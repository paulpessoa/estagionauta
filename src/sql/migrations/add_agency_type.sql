-- Adiciona o campo agency_type à tabela agencies
ALTER TABLE public.agencies
ADD COLUMN agency_type TEXT CHECK (agency_type IN ('faculdade', 'consultoria', 'agencia_privada', 'orgao_publico', 'instituto', 'fundacao', 'outro'));

-- Atualiza registros existentes para ter um valor padrão
UPDATE public.agencies
SET agency_type = 'agencia_privada'
WHERE agency_type IS NULL; 