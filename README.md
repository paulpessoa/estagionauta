
# Estagionauta.com.br 🚀

> Sua missão rumo ao estágio ideal

Uma plataforma que conecta universitários a mentores voluntários, oferece análise de currículo com IA, mapa de agências de estágio e calculadora de recesso.

## ✨ Funcionalidades

### ✅ Implementado
- **Sistema de Autenticação**: Login/Cadastro com email/senha, Google e LinkedIn
- **Perfis de Usuário**: Sistema completo com roles (student, admin, moderator, agency)
- **Análise de Currículo com IA**: Upload de PDF e análise (estrutura pronta)
- **Mapa de Agências**: Interface básica com listagem de agências
- **Calculadora de Recesso**: Baseada na Lei 11.788/2008
- **Sistema de Roles**: RBAC com Custom Claims no JWT
- **Database Schema**: Todas as tabelas necessárias criadas

### 🚧 Em Desenvolvimento
- **Análise de Currículo**: Integração com OpenAI para análise real
- **Sistema de Créditos**: Controle de análises gratuitas (2/mês)
- **Pagamentos Stripe**: Planos e pacotes de análise
- **Moderação**: Sistema para avaliações e comentários
- **Geolocalização**: Ordenação de agências por proximidade
- **Compartilhamento**: WhatsApp, Email e PDF para resultados

### 📋 Pendente
- **Painel Administrativo**: Gestão completa de usuários e moderação
- **Sistema de Denúncias**: Reportar agências fraudulentas
- **Leaflet Maps**: Visualização em mapa das agências
- **Autocomplete CEP**: Preenchimento automático de endereços
- **Email Service**: Envio de análises por email

## 🔧 Configuração

### 1. Pré-requisitos
- Node.js 18+ 
- Conta Supabase
- Conta Stripe (para pagamentos)
- OpenAI API Key (para análises)

### 2. Variáveis de Ambiente
Copie `.env.example` para `.env.local` e configure:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# OpenAI Configuration  
OPENAI_API_KEY=your_openai_api_key_here

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Configuração do Supabase

#### a) Custom Claims Hook
Configure o hook para adicionar roles no JWT:
```sql
-- Já executado no schema inicial
-- Verifica se a função custom_access_token_hook está configurada
```

#### b) OAuth Providers
Configure no Supabase Dashboard > Authentication > Providers:
- **Google OAuth**: Adicione Client ID e Secret
- **LinkedIn OIDC**: Configure provider

#### c) URL Configuration
Configure no Supabase Dashboard > Authentication > URL Configuration:
- **Site URL**: `http://localhost:3000` (desenvolvimento)
- **Redirect URLs**: 
  - `http://localhost:3000/**`
  - `https://yourdomain.com/**` (produção)

### 4. Instalação
```bash
npm install
npm run dev
```

## 🎯 Checklist de Funcionalidades

### Autenticação ✅
- [x] Login com email/senha
- [x] Cadastro de usuários
- [x] Recuperação de senha
- [x] Login social (Google/LinkedIn)
- [x] Sistema de roles (RBAC)
- [x] Perfis de usuário

### Análise de Currículo 🔄
- [x] Interface de upload
- [x] Formulário multistep
- [x] Estrutura de dados
- [ ] Integração OpenAI
- [ ] Sistema de créditos
- [ ] Página de resultados
- [ ] Download PDF
- [ ] Compartilhamento WhatsApp/LinkedIn
- [ ] Envio por email

### Pagamentos 📋
- [ ] Configuração Stripe
- [ ] Página de planos
- [ ] Checkout integration
- [ ] Webhooks
- [ ] Gestão de assinaturas
- [ ] Sistema de créditos

### Mapa de Agências 🔄
- [x] Interface básica
- [x] Listagem de agências
- [x] Sistema de avaliações (estrutura)
- [ ] Filtros funcionais
- [ ] Debounce na busca
- [ ] Geolocalização
- [ ] Mapa Leaflet
- [ ] Moderação de comentários
- [ ] Formulário de cadastro

### Calculadora de Recesso ✅
- [x] Cálculo básico
- [ ] Data final opcional
- [ ] Compartilhamento
- [ ] Download PDF

### Administração 📋
- [ ] Painel admin
- [ ] Gestão de usuários
- [ ] Moderação de conteúdo
- [ ] Sistema de denúncias
- [ ] Validação de agências

## 🚀 Deployment

### Configuração de Produção
1. **Supabase**: Configure URLs de produção
2. **Stripe**: Use chaves de produção
3. **OAuth**: Configure domínios de produção
4. **Build**: `npm run build`

### Domínio Personalizado
Configure no Lovable: Project > Settings > Domains

## 📊 Estratégia de Eventos

### UPE Destaca 2025
- **Landing Page**: Formulário de interesse
- **QR Code**: `https://estagionauta.com.br/?utm_source=upe_destaca`
- **Análise Gratuita**: Primeira análise grátis para participantes
- **Disclaimer Beta**: Avisos sobre funcionalidades em desenvolvimento

### Tracking de Origem
- URL com parâmetros: `?source=upe_destaca`
- Captura via JavaScript
- Armazenamento no perfil do usuário

## 💰 Modelo de Negócio

### Análise de Currículo
- **Gratuito**: 2 análises/mês para usuários logados
- **Avulso**: 
  - 1 análise: R$ 9,99
  - 5 análises: R$ 19,99
  - 10 análises: R$ 29,99
- **Assinatura**:
  - Mensal: R$ 19,90 (5 análises + suporte)
  - Anual: R$ 199,00 (60 análises + suporte)

### Agências
- **Cadastro Gratuito**: Para agências verificadas
- **Premium**: Destaque na busca (futuro)

## 🛡️ Segurança

- **RLS**: Row Level Security em todas as tabelas
- **RBAC**: Role-based Access Control
- **JWT Claims**: Roles no token de acesso
- **Validação**: Frontend e backend com Zod
- **Moderação**: Conteúdo passa por aprovação

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push (`git push origin feature/nova-funcionalidade`)
5. Pull Request

## 📞 Contato

- **Email**: contato@estagionauta.com.br
- **Instagram**: [@estagionauta](https://instagram.com/estagionauta)
- **Site Menvo**: [menvo.com.br](https://menvo.com.br)

---

**Desenvolvido com ❤️ para a comunidade estudantil brasileira**
