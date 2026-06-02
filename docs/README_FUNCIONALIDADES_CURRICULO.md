# Funcionalidades do Currículo Público

## Funcionalidades Implementadas

### 1. **Upload de Foto de Perfil**
- Componente `AvatarUpload` para fazer upload de fotos
- Salva no Supabase Storage (bucket `user-avatars`)
- Validação de tipo e tamanho de arquivo
- Preview em tempo real

### 2. **Download PDF do Currículo**
- Gera PDF completo do currículo
- Usa `jsPDF` e `html2canvas`
- Layout otimizado para impressão
- Inclui todas as informações do perfil

### 3. **Compartilhamento por Email**
- Modal para enviar currículo para 1-5 destinatários
- Integração com Brevo (Sendinblue)
- Templates HTML e texto
- Histórico de emails enviados

## Configuração Necessária

### 1. **Supabase Storage - Avatares**
Execute no Supabase SQL Editor:

```sql
-- Criar bucket para avatares
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars',
  'user-avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso
drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check (bucket_id = 'user-avatars' and auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update avatars" on storage.objects;
create policy "Authenticated users can update avatars"
  on storage.objects for update
  using (bucket_id = 'user-avatars' and auth.role() = 'authenticated');

drop policy if exists "Authenticated users can delete avatars" on storage.objects;
create policy "Authenticated users can delete avatars"
  on storage.objects for delete
  using (bucket_id = 'user-avatars' and auth.role() = 'authenticated');

drop policy if exists "Anyone can view avatars" on storage.objects;
create policy "Anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'user-avatars');
```

### 2. **Tabela Email Logs**
Execute no Supabase SQL Editor:

```sql
-- Adicionar colunas para currículo
ALTER TABLE public.email_logs 
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS curriculum_slug TEXT;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_email_logs_curriculum_slug ON public.email_logs(curriculum_slug);
CREATE INDEX IF NOT EXISTS idx_email_logs_profile_id ON public.email_logs(profile_id);
```

### 3. **Variáveis de Ambiente**
Adicione no seu `.env`:

```env
# Brevo (Sendinblue) API
BREVO_API_KEY=sua_chave_api_do_brevo

# Supabase (já deve existir)
VITE_SUPABASE_URL=sua_url_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

### 4. **Configurar Brevo**
1. Crie uma conta no [Brevo](https://www.brevo.com/)
2. Obtenha sua API Key
3. Configure um domínio de envio (ex: noreply@estagionauta.com)
4. Adicione a API Key nas variáveis de ambiente

## Como Usar

### 1. **Upload de Foto**
1. Acesse `/configuracoes`
2. Na seção "Foto do Perfil", clique em "Escolher Foto"
3. Selecione uma imagem (máximo 5MB)
4. Clique em "Fazer Upload"

### 2. **Download PDF**
1. Acesse `/curriculo/seu-slug`
2. Clique no botão "Download PDF"
3. O PDF será gerado e baixado automaticamente

### 3. **Compartilhamento por Email**
1. Acesse `/curriculo/seu-slug`
2. Clique em "Compartilhar por Email"
3. Adicione até 5 emails de destinatários
4. Personalize o assunto e mensagem
5. Clique em "Enviar"

## Estrutura dos Arquivos

```
src/
├── components/
│   ├── ui/
│   │   ├── avatar-upload.tsx          # Upload de foto
│   │   └── curriculum-pdf.tsx         # Geração de PDF
│   └── modals/
│       └── ShareCurriculoModal.tsx    # Modal de compartilhamento
├── api/
│   └── send-curriculum-email.js       # API para envio de emails
└── pages/
    ├── Configuracoes.tsx              # Página com upload de foto
    └── Curriculo.tsx                  # Página pública com botões
```

## Dependências Instaladas

```bash
npm install jspdf html2canvas
```

## Funcionalidades dos Componentes

### AvatarUpload
- ✅ Preview em tempo real
- ✅ Validação de tipo e tamanho
- ✅ Upload para Supabase Storage
- ✅ Remoção de foto
- ✅ Estados de loading e erro

### CurriculumPDF
- ✅ Geração de PDF responsivo
- ✅ Layout otimizado para A4
- ✅ Inclui todas as informações
- ✅ Nome de arquivo personalizado

### ShareCurriculoModal
- ✅ Múltiplos destinatários (1-5)
- ✅ Validação de emails
- ✅ Template HTML personalizado
- ✅ Histórico de envios
- ✅ Tratamento de erros

## Próximos Passos Sugeridos

1. **Analytics**: Tracking de downloads e compartilhamentos
2. **Templates**: Múltiplos templates de email
3. **QR Code**: Gerar QR code para o currículo
4. **Redes Sociais**: Botões de compartilhamento
5. **Impressão**: CSS otimizado para impressão
6. **SEO**: Meta tags dinâmicas
7. **Cache**: Cache de PDFs gerados
8. **Notificações**: Email de confirmação de envio

## Troubleshooting

### Erro 403 no Upload de Avatar
- Verifique se o bucket `user-avatars` foi criado
- Confirme se as policies estão corretas
- Verifique se o usuário está autenticado

### Erro no Envio de Email
- Verifique se a API key do Brevo está configurada
- Confirme se o domínio de envio está verificado
- Verifique os logs no Supabase

### PDF não Gera
- Verifique se as dependências estão instaladas
- Confirme se o elemento HTML está renderizado
- Verifique o console para erros de CORS 