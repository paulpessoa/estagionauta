# 🚀 Configuração do Stripe - MVP Estagionauta

## 📋 Pré-requisitos
- Conta no Stripe (https://stripe.com)
- Node.js instalado
- Projeto Supabase configurado

---

## 🔧 Passo a Passo - Configuração no Stripe

### 1. **Criar Conta no Stripe**
1. Acesse https://stripe.com
2. Clique em "Start now"
3. Preencha os dados da empresa
4. Ative sua conta (pode usar modo teste inicialmente)

### 2. **Configurar Produtos e Preços**

#### **Acessar Dashboard**
1. Faça login no Stripe Dashboard
2. Vá para **Products** no menu lateral

#### **Criar Produto Principal**
1. Clique em **"Add product"**
2. Nome: `Estagionauta - Créditos`
3. Descrição: `Créditos para análise de currículos com IA`
4. Clique em **"Save product"**

#### **Criar Preços para Cada Plano**

**⭐ Plano Cosmonauta:**
1. No produto criado, clique em **"Add price"**
2. Tipo: `One-time`
3. Valor: `4.00`
4. Moeda: `BRL (Brazilian Real)`
5. Nome: `Cosmonauta - 30 créditos`
6. Clique em **"Save price"**
7. **Copie o Price ID** (ex: `price_1ABC123...`)

**🚀 Plano Astronauta:**
1. Clique em **"Add price"** novamente
2. Tipo: `One-time`
3. Valor: `5.00`
4. Moeda: `BRL`
5. Nome: `Astronauta - 60 créditos`
6. Clique em **"Save price"**
7. **Copie o Price ID**

**💼 Plano Comandante:**
1. Clique em **"Add price"** novamente
2. Tipo: `One-time`
3. Valor: `15.00`
4. Moeda: `BRL`
5. Nome: `Comandante - 300 créditos`
6. Clique em **"Save price"**
7. **Copie o Price ID**

### 3. **Configurar Webhooks**

#### **Acessar Webhooks**
1. No menu lateral, vá para **Developers > Webhooks**
2. Clique em **"Add endpoint"**

#### **Configurar Endpoint**
1. URL: `https://seu-dominio.com/api/webhooks/stripe`
2. Eventos a escutar:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
3. Clique em **"Add endpoint"**
4. **Copie o Webhook Secret** (ex: `whsec_ABC123...`)

### 4. **Obter Chaves de API**

#### **Chaves Públicas e Secretas**
1. Vá para **Developers > API keys**
2. **Copie a Publishable key** (ex: `pk_test_ABC123...`)
3. **Copie a Secret key** (ex: `sk_test_ABC123...`)

---

## 🔧 Configuração no Projeto

### 1. **Variáveis de Ambiente**

Crie/atualize o arquivo `.env`:

```env
# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_ABC123...
STRIPE_SECRET_KEY=sk_test_ABC123...
STRIPE_WEBHOOK_SECRET=whsec_ABC123...

# URLs
STRIPE_SUCCESS_URL=https://seu-dominio.com/sucesso
STRIPE_CANCEL_URL=https://seu-dominio.com/precos
```

### 2. **Atualizar IDs dos Preços**

No arquivo `src/lib/stripe.ts`, substitua os IDs temporários:

```typescript
export const STRIPE_PLANS: StripePlan[] = [
  {
    id: 'cosmonauta',
    name: 'Cosmonauta',
    price: 4.00,
    credits: 30,
    analyses: 10,
    stripePriceId: 'price_1ABC123...' // ID real do Stripe
  },
  {
    id: 'astronauta',
    name: 'Astronauta',
    price: 5.00,
    credits: 60,
    analyses: 20,
    stripePriceId: 'price_1DEF456...' // ID real do Stripe
  },
  {
    id: 'comandante',
    name: 'Comandante',
    price: 15.00,
    credits: 300,
    analyses: 100,
    stripePriceId: 'price_1GHI789...' // ID real do Stripe
  }
]
```

### 3. **Criar API Routes (Backend)**

#### **Instalar Dependências**
```bash
npm install stripe
```

#### **Criar API Route para Checkout**
Crie o arquivo `api/create-checkout-session.js`:

```javascript
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { planId, planName, price, credits, userId } = req.body

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `${planName} - ${credits} créditos`,
              description: `${credits} créditos para análise de currículos`,
            },
            unit_amount: Math.round(price * 100), // Stripe usa centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: process.env.STRIPE_CANCEL_URL,
      metadata: {
        planId,
        userId,
        credits: credits.toString(),
      },
    })

    res.status(200).json({ sessionId: session.id })
  } catch (error) {
    console.error('Erro ao criar checkout session:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
}
```

#### **Criar Webhook Handler**
Crie o arquivo `api/webhooks/stripe.js`:

```javascript
import Stripe from 'stripe'
import { buffer } from 'micro'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const buf = await buffer(req)
  const sig = req.headers['stripe-signature']

  let event

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret)
  } catch (err) {
    console.error('Erro no webhook:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    
    // Adicionar créditos ao usuário
    try {
      const { userId, credits } = session.metadata
      
      // Chamar função do Supabase para adicionar créditos
      const { error } = await supabase.rpc('add_credits', {
        user_uuid: userId,
        amount: parseInt(credits),
        stripe_payment_intent_id: session.payment_intent,
        description: `Compra de ${credits} créditos`
      })

      if (error) {
        console.error('Erro ao adicionar créditos:', error)
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error)
    }
  }

  res.status(200).json({ received: true })
}
```

### 4. **Testar a Integração**

#### **Modo Teste**
1. Use cartões de teste do Stripe:
   - Sucesso: `4242 4242 4242 4242`
   - Falha: `4000 0000 0000 0002`

#### **Verificar Funcionamento**
1. Faça uma compra de teste
2. Verifique se os créditos foram adicionados
3. Teste o webhook no dashboard do Stripe

---

## 🚀 Deploy e Produção

### 1. **Ativar Conta de Produção**
1. Complete a verificação da conta no Stripe
2. Troque as chaves de teste pelas de produção
3. Atualize as variáveis de ambiente

### 2. **Configurar Domínio**
1. Atualize as URLs de sucesso/cancelamento
2. Configure o webhook com o domínio de produção
3. Teste o fluxo completo

### 3. **Monitoramento**
1. Configure alertas no Stripe
2. Monitore logs de webhook
3. Configure notificações de erro

---

## 📝 Notas Importantes

### **Segurança**
- ✅ Nunca exponha a Secret Key no frontend
- ✅ Sempre valide webhooks
- ✅ Use HTTPS em produção
- ✅ Implemente rate limiting

### **MVP Features**
- ✅ Pagamento único (one-time)
- ✅ Cartão de crédito
- ✅ Webhook para adicionar créditos
- ✅ Página de sucesso
- ✅ Tratamento de erros básico

### **Próximos Passos**
- 🔄 PIX (pagamento brasileiro)
- 🔄 Assinaturas recorrentes
- 🔄 Cupons de desconto
- 🔄 Relatórios de vendas
- 🔄 Reembolsos automáticos

---

## 🆘 Suporte

Se encontrar problemas:
1. Verifique os logs do Stripe Dashboard
2. Teste com cartões de teste
3. Verifique as variáveis de ambiente
4. Consulte a documentação do Stripe

**Links Úteis:**
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Webhook Testing](https://stripe.com/docs/webhooks/test) 