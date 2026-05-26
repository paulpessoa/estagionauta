const Stripe = require('stripe');
require('dotenv').config({ path: '.env' });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const products = [
  { key: 'ASTRONAUTA_AVULSO', id: 'prod_UadiXnOFqBpBg2' },
  { key: 'COSMONAUTA_AVULSO', id: 'prod_UadiV8qwuEcYjn' },
  { key: 'COMANDANTE_AVULSO', id: 'prod_UadiXjGMPmu9EO' },
  { key: 'ASTRONAUTA_ASSINATURA', id: 'prod_UaZh1qHNQ1nTVY' },
  { key: 'COSMONAUTA_ASSINATURA', id: 'prod_UaZgShfeKyUAQH' },
  { key: 'COMANDANTE_ASSINATURA', id: 'prod_UaaFqeY0UCni2j' }
];

async function run() {
  for (const p of products) {
    const prices = await stripe.prices.list({ product: p.id, active: true, limit: 1 });
    if (prices.data.length > 0) {
      console.log(`STRIPE_PRICE_${p.key}=${prices.data[0].id}`);
    } else {
      console.log(`No active price found for ${p.key} (${p.id})`);
    }
  }
}
run();
