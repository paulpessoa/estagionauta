-- Criar tabela de teste bolos
CREATE TABLE public.bolos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  peso DECIMAL(5,2) NOT NULL, -- peso em kg com 2 casas decimais
  preco DECIMAL(10,2) NOT NULL, -- preço com 2 casas decimais
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.bolos ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir que qualquer usuário autenticado veja os bolos
CREATE POLICY "Usuários podem ver bolos" 
ON public.bolos 
FOR SELECT 
TO authenticated 
USING (true);

-- Criar política para permitir que qualquer usuário autenticado insira bolos
CREATE POLICY "Usuários podem criar bolos" 
ON public.bolos 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_bolos_updated_at
BEFORE UPDATE ON public.bolos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();