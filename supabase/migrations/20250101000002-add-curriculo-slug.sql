-- Adicionar coluna curriculo_slug na tabela user_profiles
ALTER TABLE user_profiles 
ADD COLUMN curriculo_slug TEXT UNIQUE;

-- Criar índice para melhorar performance das consultas por slug
CREATE INDEX idx_user_profiles_curriculo_slug ON user_profiles(curriculo_slug);

-- Adicionar comentário na coluna
COMMENT ON COLUMN user_profiles.curriculo_slug IS 'Slug único para URL pública do currículo do usuário'; 