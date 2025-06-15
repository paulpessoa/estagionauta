
-- Criar tabela de comentários das agências
CREATE TABLE IF NOT EXISTS public.agency_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID NULL REFERENCES public.agency_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  dislikes_count INTEGER DEFAULT 0,
  is_reported BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de likes/dislikes dos comentários
CREATE TABLE IF NOT EXISTS public.comment_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.agency_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Criar tabela de denúncias de comentários
CREATE TABLE IF NOT EXISTS public.comment_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.agency_comments(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolved_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Atualizar tabela agency_reviews para incluir status
ALTER TABLE public.agency_reviews 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.agency_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reports ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para agency_comments
CREATE POLICY "Comentários são visíveis para todos" 
ON public.agency_comments FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Usuários podem criar comentários" 
ON public.agency_comments FOR INSERT 
TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar próprios comentários" 
ON public.agency_comments FOR UPDATE 
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar próprios comentários" 
ON public.agency_comments FOR DELETE 
TO authenticated USING (auth.uid() = user_id);

-- Políticas RLS para comment_reactions
CREATE POLICY "Reações são visíveis para todos" 
ON public.comment_reactions FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Usuários podem reagir a comentários" 
ON public.comment_reactions FOR INSERT 
TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem alterar próprias reações" 
ON public.comment_reactions FOR UPDATE 
TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem remover próprias reações" 
ON public.comment_reactions FOR DELETE 
TO authenticated USING (auth.uid() = user_id);

-- Políticas RLS para comment_reports
CREATE POLICY "Denúncias visíveis para admins e autor" 
ON public.comment_reports FOR SELECT 
TO authenticated USING (
  auth.uid() = reported_by OR 
  EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Usuários podem criar denúncias" 
ON public.comment_reports FOR INSERT 
TO authenticated WITH CHECK (auth.uid() = reported_by);

-- Trigger para atualizar contadores de likes/dislikes
CREATE OR REPLACE FUNCTION update_comment_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.reaction_type = 'like' THEN
      UPDATE public.agency_comments 
      SET likes_count = likes_count + 1 
      WHERE id = NEW.comment_id;
    ELSE
      UPDATE public.agency_comments 
      SET dislikes_count = dislikes_count + 1 
      WHERE id = NEW.comment_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.reaction_type = 'like' THEN
      UPDATE public.agency_comments 
      SET likes_count = likes_count - 1 
      WHERE id = OLD.comment_id;
    ELSE
      UPDATE public.agency_comments 
      SET dislikes_count = dislikes_count - 1 
      WHERE id = OLD.comment_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Se mudou o tipo de reação
    IF OLD.reaction_type != NEW.reaction_type THEN
      IF OLD.reaction_type = 'like' THEN
        UPDATE public.agency_comments 
        SET likes_count = likes_count - 1, dislikes_count = dislikes_count + 1 
        WHERE id = NEW.comment_id;
      ELSE
        UPDATE public.agency_comments 
        SET likes_count = likes_count + 1, dislikes_count = dislikes_count - 1 
        WHERE id = NEW.comment_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_reaction_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.comment_reactions
FOR EACH ROW EXECUTE FUNCTION update_comment_reaction_counts();

-- Trigger para updated_at nas novas tabelas
CREATE TRIGGER handle_updated_at_agency_comments BEFORE UPDATE ON public.agency_comments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
