# 📋 Plano de Testes Manuais & Avaliação Geral — Estagionauta

Este documento serve como guia detalhado para testar manualmente cada fluxo e funcionalidade do Estagionauta, tanto do ponto de vista do estudante (usuário comum) quanto da administração (administrador/moderador). Use os espaços de observação abaixo para documentar os resultados dos testes.

---

## 1. Fluxo de Autenticação & Perfil do Estudante

| Item de Teste | Ações a Executar | Resultado Esperado | Status (OK / Falhou) | Observações / Feedbacks do Usuário |
|:---|:---|:---|:---|:---|
| **Cadastro de Usuário** | 1. Ir para `/cadastro`. <br> 2. Preencher nome, e-mail e senha. <br> 3. Clicar em "Criar Conta". | Conta criada e redirecionamento para o dashboard ou aviso de confirmação por e-mail. | | *Deixe suas observações aqui* |
| **Login do Usuário** | 1. Ir para `/login`. <br> 2. Digitar credenciais válidas. <br> 3. Submeter. | Login realizado com sucesso e redirecionamento para a página inicial logada. | | *Deixe suas observações aqui* |
| **Recuperação de Senha** | 1. Clicar em "Esqueci minha senha" na tela de login. <br> 2. Inserir e-mail cadastrado e enviar. <br> 3. Verificar o recebimento do link/OTP de redefinição. | E-mail de redefinição enviado e fluxo de criação de nova senha concluído com sucesso. | | *Deixe suas observações aqui* |
| **Edição de Perfil & Privacidade** | 1. Ir para `/configuracoes`. <br> 2. Alterar nome ou avatar. <br> 3. Mudar configurações de privacidade (Perfil Público vs. Privado). <br> 4. Salvar. | Alterações salvas no banco. Se privado, o currículo público `/curriculo/:slug` não deve carregar para visitantes. | | *Deixe suas observações aqui* |

---

## 2. Fluxos Principais das Features do Usuário Comum

| Item de Teste | Ações a Executar | Resultado Esperado | Status (OK / Falhou) | Observações / Feedbacks do Usuário |
|:---|:---|:---|:---|:---|
| **Simulador de Entrevistas** | 1. Ir para `/simulador-entrevistas`. <br> 2. Configurar cargo, tom do entrevistador e iniciar (consome 1 crédito). <br> 3. Interagir no chat por 5 turnos. <br> 4. Testar o áudio do entrevistador (com clique e em modo automático). <br> 5. Concluir e visualizar feedback da IA. | Consome exatamente 1 crédito. Geração de perguntas e feedback final em português. Áudio funciona. | | *Deixe suas observações aqui* |
| **Análise de Currículo** | 1. Ir para `/analise-curriculo`. <br> 2. Enviar texto ou arquivo de currículo (consome créditos). <br> 3. Visualizar pontos fortes, melhorias e respostas a perguntas de mentoria estruturadas pela IA. | Crédito consumido e relatório estruturado de análise de currículo exibido em formato premium. | | *Deixe suas observações aqui* |
| **Gerador de Currículos** | 1. Ir para `/gerador-curriculos`. <br> 2. Preencher os dados do perfil profissional. <br> 3. Solicitar geração da IA. <br> 4. Testar exportação/download do currículo. | IA gera o conteúdo em Markdown limpo e adaptado à vaga desejada. | | *Deixe suas observações aqui* |
| **Kanban de Candidaturas** | 1. Ir para `/candidaturas`. <br> 2. Criar nova candidatura. <br> 3. Mover o card entre as colunas (Ex: "A aplicar" para "Entrevista"). <br> 4. Adicionar um feedback/status manual na candidatura. | Os dados persistem no banco ao recarregar a página. O histórico de status e os feedbacks salvam sem erro 404. | | *Deixe suas observações aqui* |
| **Calculadora de Recesso** | 1. Ir para `/calculadora`. <br> 2. Preencher data de início/fim do estágio e valor da bolsa. <br> 3. Calcular e testar o compartilhamento do resultado. | Mostra o cálculo correto de dias de recesso proporcionais e valores devidos de forma simples e limpa. | | *Deixe suas observações aqui* |

---

## 3. Fluxo de Compra, Planos & Créditos

| Item de Teste | Ações a Executar | Resultado Esperado | Status (OK / Falhou) | Observações / Feedbacks do Usuário |
|:---|:---|:---|:---|:---|
| **Página de Preços** | 1. Acessar `/precos`. <br> 2. Clicar em "Comprar" em um dos planos (ex: Cosmonauta). | Usuário é redirecionado para o checkout oficial do Stripe com as informações do plano corretas. | | *Deixe suas observações aqui* |
| **Stripe Webhook (Simulado)** | 1. Concluir um pagamento no Stripe (ambiente de teste/checkout). <br> 2. O webhook do Stripe processa a transação e envia ao Hono. | O saldo de créditos do usuário é atualizado atômicamente no Supabase com o valor correto do plano. | | *Deixe suas observações aqui* |
| **Página "Meus Créditos"** | 1. Acessar a aba ou link de créditos. <br> 2. Visualizar saldo e histórico de uso. | Mostra o saldo atualizado e o extrato de consumo detalhado (ex: "Simulação de entrevista", "Análise de currículo"). | | *Deixe suas observações aqui* |

---

## 4. Agências (Avaliações, Busca, Mapa e Contatos)

| Item de Teste | Ações a Executar | Resultado Esperado | Status (OK / Falhou) | Observações / Feedbacks do Usuário |
|:---|:---|:---|:---|:---|
| **Busca & Filtros na URL** | 1. Pesquisar agências em `/agencias` (por estado, cidade ou nome). <br> 2. Copiar a URL com os parâmetros e colar em nova aba. | Os filtros de busca são mantidos e sincronizados pela URL. A paginação reseta se o número de itens encolher. | | *Deixe suas observações aqui* |
| **Visualização em Mapa** | 1. Alternar para a visualização "Mapa". | Todas as agências filtradas aparecem de uma só vez (sem paginação no mapa). | | *Deixe suas observações aqui* |
| **Submissão de Avaliação** | 1. Entrar na agência. <br> 2. Deixar uma avaliação (nota e relato). | Salva no banco com o status `pending` para aprovação do moderador/admin. | | *Deixe suas observações aqui* |
| **Endereço Clicável** | 1. Clicar no endereço de uma agência no card. | Abre a pesquisa do endereço no Google Maps em uma nova guia. | | *Deixe suas observações aqui* |
| **Contatos Clicáveis (Telefone)** | 1. Clicar no badge de Telefone de uma agência no card. | Abre o discador telefônico correspondente do dispositivo (`tel:<numero>`). | | *Deixe suas observações aqui* |
| **Contatos Clicáveis (WhatsApp)** | 1. Clicar no badge de WhatsApp de uma agência. | Abre o WhatsApp Web ou aplicativo com o link de conversa direto (`https://wa.me/<numero>`). | | *Deixe suas observações aqui* |
| **Contatos Clicáveis (Website, E-mail, Redes)** | 1. Clicar em Website, E-mail, Instagram, LinkedIn ou TikTok da agência. | Abre os links em nova aba externa (`_blank`) com o protocolo correto. | | *Deixe suas observações aqui* |

---

## 5. Fluxo Administrativo & Moderação

| Item de Teste | Ações a Executar | Status da Conta | Resultado Esperado | Status (OK / Falhou) | Observações / Feedbacks do Usuário |
|:---|:---|:---|:---|:---|:---|
| **Moderação de Avaliações** | 1. Ir para `/admin` -> Aba "Moderação" -> "Avaliações". <br> 2. Tentar aprovar ou rejeitar uma avaliação de teste. | **Moderador ou Admin** | A avaliação aprovada torna-se pública e a rejeitada desaparece. Nenhuma falha de permissão SQL ocorre. | | *Deixe suas observações aqui* |
| **Moderação de Feedbacks** | 1. Ir para `/admin` -> Aba "Moderação" -> "Sugestões / Feedbacks". <br> 2. Visualizar a lista de feedbacks. | **Moderador ou Admin** | Carrega a lista de sugestões recebidas dos usuários comuns. | | *Deixe suas observações aqui* |
| **Gestão de Usuários** | 1. Ir para `/admin` -> Aba "Usuários". <br> 2. Tentar alterar role ou adicionar créditos manuais. | **Admin** | Permite alterar a role de um estudante para moderador ou dar créditos manuais. | | *Deixe suas observações aqui* |
| **Bloqueio de Moderador** | 1. Tentar acessar rotas confidenciais (Ex: `/api/admin/users`) logado como Moderador. | **Moderador** | Retorna 403 Forbidden. Moderadores só podem moderar agências e avaliações. | | *Deixe suas observações aqui* |

---

## 6. Pontos Críticos de Segurança a Validar

1. **Tentativa de Injeção de Créditos no Frontend:**
   * *O que testar:* Tente disparar uma requisição Supabase RPC diretamente no console do desenvolvedor para `add_credits` ou `consume_credits`.
   * *Esperado:* Bloqueio total (permissão negada/erro RLS), pois o front não tem mais a `service_role_key` e o banco restringe essas execuções.
2. **Invasão de Rota Admin:**
   * *O que testar:* Tente acessar a URL `/admin` usando uma conta de estudante comum.
   * *Esperado:* Redirecionamento automático ou bloqueio de exibição (tela de "Não Autorizado").
3. **Validação de Preços no Checkout:**
   * *O que testar:* Tente iniciar um checkout enviando um valor modificado no corpo da requisição.
   * *Esperado:* O sistema ignora qualquer preço vindo do cliente, gerando o preço com base no ID do plano definido estritamente no backend.

---

## 7. Otimizações & Notas Técnicas

1. **Divisão de Bundles (Lazy Loading):**
   * *O que foi feito:* Implementamos o carregamento sob demanda (`React.lazy` + `Suspense`) de todas as rotas no arquivo `route.ts`.
   * *Vantagem:* Acelera o primeiro carregamento da aplicação ao dividir o código de cada rota em chunks sob demanda.
2. **Postgres Cast Error no `authorize`:**
   * *O que foi feito:* Corrigimos a função de banco `public.authorize` para converter explicitamente a permissão solicitada em `text` (`requested_permission::text`), solucionando o erro 42883 de incompatibilidade de tipo.
