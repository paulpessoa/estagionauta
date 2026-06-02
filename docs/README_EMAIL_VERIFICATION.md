# Como Verificar se o E-mail foi Enviado

## Métodos de Verificação

### 1. **Página de Logs de E-mail** 📊
- **Acesso:** `/email-logs` (após fazer login)
- **Funcionalidades:**
  - Visualizar todos os e-mails enviados
  - Filtrar por status (Enviado, Falhou, Pendente)
  - Buscar por email, assunto ou slug do currículo
  - Filtrar por data
  - Exportar logs em CSV
  - Estatísticas de envio

### 2. **Notificação no Modal de Compartilhamento** 🔔
- Após enviar e-mails, o modal mostra:
  - Status de cada e-mail (✓ Enviado / ✗ Falhou)
  - Link direto para o histórico completo
  - Mensagens de erro detalhadas

### 3. **Logs do Supabase** 🔍
- **Dashboard do Supabase > Logs > Edge Functions**
- Mostra logs detalhados da função `send-curriculum-email`
- Inclui erros e informações de debug

### 4. **Banco de Dados** 💾
- **Tabela:** `email_logs`
- **Colunas importantes:**
  - `status`: 'sent', 'failed', 'pending'
  - `provider_id`: ID do e-mail no Brevo
  - `error_message`: Detalhes do erro (se houver)
  - `sent_at`: Timestamp do envio

## Status dos E-mails

### ✅ **Enviado (sent)**
- E-mail foi entregue com sucesso
- `provider_id` contém o ID do Brevo
- `sent_at` contém o timestamp

### ❌ **Falhou (failed)**
- Erro no envio
- `error_message` contém detalhes
- Verificar logs do Supabase para mais informações

### ⏳ **Pendente (pending)**
- E-mail ainda está sendo processado
- Sistema faz polling automático

## Troubleshooting

### E-mail não aparece nos logs
1. Verificar se a tabela `email_logs` existe
2. Executar o script SQL de setup
3. Verificar logs da Edge Function

### E-mail marcado como "Falhou"
1. Verificar `error_message` no banco
2. Verificar logs da Edge Function
3. Verificar configuração do Brevo API

### E-mail não chega ao destinatário
1. Verificar se o `provider_id` existe
2. Verificar logs do Brevo
3. Verificar spam/lixo eletrônico

## Scripts SQL Úteis

### Verificar estrutura da tabela
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'email_logs' 
ORDER BY ordinal_position;
```

### Verificar e-mails recentes
```sql
SELECT 
  to_email,
  subject,
  status,
  created_at,
  sent_at,
  error_message
FROM email_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### Estatísticas de envio
```sql
SELECT 
  status,
  COUNT(*) as total,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM email_logs 
GROUP BY status;
```

## Configuração do Brevo

### Verificar envios no Brevo
1. Acessar [Brevo Dashboard](https://app.brevo.com/)
2. Ir para **Campaigns > Transactional > Logs**
3. Buscar pelo `provider_id` do e-mail

### Configurações importantes
- **API Key:** Configurada na Edge Function
- **From Email:** noreply@estagionauta.com
- **Template:** curriculum_share

## Monitoramento Automático

### Alertas recomendados
- E-mails com status "failed" > 5%
- Tempo de envio > 30 segundos
- Erros de API do Brevo

### Métricas importantes
- Taxa de entrega
- Tempo médio de envio
- Erros por tipo
- Volume diário de e-mails 