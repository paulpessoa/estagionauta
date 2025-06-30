# 🧪 Teste da Integração Stripe - Estagionauta

## ✅ Configuração Atual
- ✅ Produtos criados no Stripe
- ✅ Webhook configurado
- ✅ Variáveis de ambiente adicionadas
- ✅ IDs dos produtos atualizados no código

---

## 🔍 Teste Passo a Passo

### 1. **Verificar Variáveis de Ambiente**
```bash
# Verifique se estas variáveis estão no seu .env:
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_blablabla
```

### 2. **Testar Frontend**
1. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

2. **Acesse a página de preços:**
   - Vá para `http://localhost:5173/precos`
   - Verifique se os planos aparecem corretamente
   - Confirme se os preços estão corretos

3. **Teste sem login:**
   - Clique em "Comprar" em qualquer plano
   - Deve mostrar mensagem "Login necessário"

### 3. **Teste com Login**
1. **Faça login na aplicação**
2. **Vá para a página de preços**
3. **Clique em "Comprar" em um plano**
4. **Deve redirecionar para Stripe Checkout**

### 4. **Teste de Pagamento**
Use estes cartões de teste do Stripe:

#### **Cartão de Sucesso:**
```
Número: 4242 4242 4242 4242
Data: Qualquer data futura
CVC: Qualquer 3 dígitos
```

#### **Cartão de Falha:**
```
Número: 4000 0000 0000 0002
Data: Qualquer data futura
CVC: Qualquer 3 dígitos
```

### 5. **Verificar Webhook**
1. **No Stripe Dashboard:**
   - Vá para **Developers > Webhooks**
   - Clique no seu webhook
   - Vá para **"Events"**
   - Verifique se os eventos estão chegando

2. **Logs do Webhook:**
   - Verifique se há erros nos logs
   - Confirme se o webhook está processando corretamente

---

## 🚨 Possíveis Problemas e Soluções

### **Problema 1: "Stripe is not defined"**
**Solução:**
```bash
# Verifique se a biblioteca foi instalada
npm list @stripe/stripe-js
```

### **Problema 2: "Invalid publishable key"**
**Solução:**
- Verifique se a chave pública está correta
- Confirme se está no formato `pk_test_...` ou `pk_live_...`

### **Problema 3: Webhook não está funcionando**
**Solução:**
- Verifique se a URL do webhook está correta
- Confirme se o webhook secret está correto
- Teste o webhook no Stripe Dashboard

### **Problema 4: Créditos não são adicionados**
**Solução:**
- Verifique os logs do webhook
- Confirme se a função `add_credits` existe no Supabase
- Verifique se o usuário existe na tabela `user_profiles`

---

## 🔧 Comandos de Debug

### **Verificar Console do Navegador:**
```javascript
// No console do navegador, teste:
console.log(import.meta.env.VITE_NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
```

### **Verificar Network Tab:**
1. Abra DevTools (F12)
2. Vá para Network tab
3. Faça uma compra
4. Verifique as requisições para `/api/create-checkout-session`

### **Verificar Logs do Supabase:**
1. Vá para Supabase Dashboard
2. Vá para **Logs**
3. Verifique se há erros relacionados ao Stripe

---

## 📋 Checklist de Teste

- [ ] Página de preços carrega corretamente
- [ ] Planos mostram preços corretos
- [ ] Botão "Comprar" funciona
- [ ] Redirecionamento para Stripe funciona
- [ ] Pagamento com cartão de teste funciona
- [ ] Redirecionamento para página de sucesso funciona
- [ ] Créditos são adicionados ao usuário
- [ ] Webhook está processando eventos
- [ ] Página de sucesso mostra detalhes corretos

---

## 🆘 Se Algo Não Funcionar

1. **Verifique os logs do console**
2. **Teste com cartão de sucesso**
3. **Verifique as variáveis de ambiente**
4. **Confirme se o webhook está ativo**
5. **Teste a função `add_credits` no Supabase**

**Precisa de ajuda?** Me envie os erros que aparecerem no console! 