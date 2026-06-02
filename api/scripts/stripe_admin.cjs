const Stripe = require('stripe');

async function listProducts(secretKey) {
  const stripe = new Stripe(secretKey);
  console.log('Listing products for key:', secretKey.substring(0, 8) + '...');
  try {
    const products = await stripe.products.list({ limit: 100 });
    console.log(`Found ${products.data.length} products:`);
    for (const prod of products.data) {
      console.log(`- Product: ${prod.name} (ID: ${prod.id}), Active: ${prod.active}`);
      const prices = await stripe.prices.list({ product: prod.id });
      for (const price of prices.data) {
        console.log(`  - Price: ${price.unit_amount / 100} ${price.currency.toUpperCase()} (ID: ${price.id}), Type: ${price.type}`);
      }
    }
  } catch (err) {
    console.error('Error listing products:', err.message);
  }
}

async function listCoupons(secretKey) {
  const stripe = new Stripe(secretKey);
  console.log('Listing coupons...');
  try {
    const coupons = await stripe.coupons.list({ limit: 100 });
    console.log(`Found ${coupons.data.length} coupons:`);
    for (const cp of coupons.data) {
      console.log(`- Coupon ID: ${cp.id}, Percent Off: ${cp.percent_off}%, Duration: ${cp.duration}, Valid: ${cp.valid}`);
      const promoCodes = await stripe.promotionCodes.list({ coupon: cp.id });
      for (const pc of promoCodes.data) {
        console.log(`  - Promo Code: ${pc.code} (ID: ${pc.id}), Active: ${pc.active}`);
      }
    }
  } catch (err) {
    console.error('Error listing coupons:', err.message);
  }
}

require('dotenv').config();
const liveKey = process.env.STRIPE_LIVE_SECRET_KEY;
const testKey = process.env.STRIPE_TEST_SECRET_KEY;

const cmd = process.argv[2] || 'list';

(async () => {
  if (cmd === 'list-live') {
    await listProducts(liveKey);
    await listCoupons(liveKey);
  } else if (cmd === 'list-test') {
    await listProducts(testKey);
    await listCoupons(testKey);
  } else {
    console.log('Use: node stripe_admin.cjs [list-live | list-test]');
  }
})();
