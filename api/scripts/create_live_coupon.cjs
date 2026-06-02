const Stripe = require('stripe');

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const liveKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(liveKey);

const COSMONAUTA_PROD_ID = 'prod_UaZgShfeKyUAQH';

async function run() {
  try {
    console.log('Creating live coupon restricted to product:', COSMONAUTA_PROD_ID);
    
    // Create Coupon
    const coupon = await stripe.coupons.create({
      percent_off: 100,
      duration: 'once',
      applies_to: {
        products: [COSMONAUTA_PROD_ID],
      },
      name: 'Cosmonauta Avulso 100% OFF',
    });

    console.log('Successfully created coupon:', coupon.id);

    // Create Promotion Code
    console.log('Creating promotion code ESTAGIO100...');
    const promoCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: 'ESTAGIO100',
    });

    console.log('Successfully created Promotion Code:', promoCode.code, 'with ID:', promoCode.id);
  } catch (err) {
    console.error('Error creating Stripe assets:', err.message);
  }
}

run();
