-- Migração para adicionar colunas status_history e feedbacks na tabela kanban_applications
ALTER TABLE public.kanban_applications 
ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::JSONB NOT NULL;

ALTER TABLE public.kanban_applications 
ADD COLUMN IF NOT EXISTS feedbacks JSONB DEFAULT '[]'::JSONB NOT NULL;

-- Adicionar um comentário explicativo nas colunas
COMMENT ON COLUMN public.kanban_applications.status_history IS 'Histórico cronológico de transições de status da vaga';
COMMENT ON COLUMN public.kanban_applications.feedbacks IS 'Lista de feedbacks e anotações detalhadas de recrutadores/entrevistas';
