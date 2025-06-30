# Configuração de Domínio no Brevo

## 🚨 **Problema Identificado**

O email está sendo enviado com o domínio do Brevo (`brevosend.com`) em vez do domínio configurado (`estagionauta.com.br`).

## 🔧 **Soluções**

### **Opção 1: Verificar Domínio no Brevo (Recomendado)**

#### **Passo 1: Acessar Configurações**
1. Vá para [Brevo Dashboard](https://app.brevo.com/)
2. Menu: `Settings > Senders & IP`
3. Clique em `Add a new sender`

#### **Passo 2: Adicionar Domínio**
1. **Email:** `contato@estagionauta.com.br`
2. **Name:** `Estagionauta`
3. Clique em `Add`

#### **Passo 3: Verificar Domínio**
1. Brevo enviará um email de verificação
2. Clique no link de verificação
3. Aguarde a confirmação

#### **Passo 4: Configurar DNS (Opcional)**
```txt
# SPF Record (adicionar no DNS do domínio)
v=spf1 include:spf.brevo.com ~all

# DKIM (seguir instruções do Brevo)
# MX Records (se necessário)
```

### **Opção 2: Usar Email Verificado Existente**

Se não conseguir verificar o domínio, use um email já verificado:

#### **Gmail (Recomendado para testes)**
```javascript
// Na Edge Function, usar:
sender: {
  name: userProfile.full_name || 'Estagionauta',
  email: 'seu-email@gmail.com' // Email verificado no Brevo
}
```

#### **Outros Provedores**
- Outlook/Hotmail
- Yahoo
- Qualquer email verificado no Brevo

### **Opção 3: Usar Email Padrão do Brevo**

Para o plano free, você pode usar o email padrão do Brevo:

```javascript
sender: {
  name: userProfile.full_name || 'Estagionauta',
  email: 'noreply@brevo.com' // Email padrão do Brevo
}
```

## 📧 **Configuração Atual da Edge Function**

### **Remetente Configurado:**
```javascript
sender: {
  name: userProfile.full_name || 'Estagionauta',
  email: userProfile.email // Email do usuário logado
},
replyTo: {
  name: userProfile.full_name || 'Estagionauta',
  email: userProfile.email // Email para resposta
}
```

### **Template Melhorado:**
- **Cabeçalho destacado** com informações do remetente
- **Avatar com iniciais** do nome
- **Email de contato** visível
- **Instruções de resposta** claras

## 🔍 **Verificação de Configuração**

### **1. Testar Envio**
```javascript
// Teste no console do navegador
fetch('https://api.brevo.com/v3/smtp/email', {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'api-key': 'SUA_API_KEY'
  },
  body: JSON.stringify({
    sender: { 
      name: 'Teste', 
      email: 'contato@estagionauta.com.br' // ou email verificado
    },
    to: [{ email: 'seu-email@gmail.com' }],
    subject: 'Teste de Domínio',
    htmlContent: '<h1>Teste</h1>'
  })
})
```

### **2. Verificar no Brevo**
- **Campaigns > Transactional > Logs**
- **Settings > Senders & IP**
- **Verificar status** do domínio

### **3. Verificar DNS**
```bash
# Verificar SPF
dig TXT estagionauta.com.br

# Verificar MX
dig MX estagionauta.com.br
```

## 🎯 **Recomendações**

### **Para Produção:**
1. **Verificar domínio** `contato@estagionauta.com.br`
2. **Configurar SPF/DKIM**
3. **Usar domínio próprio**

### **Para Desenvolvimento:**
1. **Usar Gmail** verificado
2. **Testar com email próprio**
3. **Verificar logs** do Brevo

### **Para Plano Free:**
1. **Usar email verificado** existente
2. **Respeitar limite** de 300 e-mails/dia
3. **Monitorar** logs de entrega

## 📋 **Checklist de Configuração**

- [ ] **Domínio verificado** no Brevo
- [ ] **SPF configurado** no DNS
- [ ] **DKIM configurado** (se possível)
- [ ] **Email de teste** enviado com sucesso
- [ ] **Logs verificados** no Brevo
- [ ] **Resposta funcionando** corretamente

## 🚀 **Próximos Passos**

1. **Verificar domínio** no Brevo Dashboard
2. **Testar envio** com email verificado
3. **Configurar DNS** se necessário
4. **Monitorar** entregabilidade
5. **Ajustar** configurações conforme necessário 