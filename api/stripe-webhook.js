const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const WEB3FORMS_KEY = '62541ea1-fe13-465c-8642-2157c92c067a';

// Disable Vercel's default body parsing — Stripe needs the raw body for signature verification
module.exports.config = {
    api: {
        bodyParser: false,
    },
};

// Read raw body from request stream
function getRawBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    let event;

    try {
        const rawBody = req.rawBody || await getRawBody(req);
        const signature = req.headers['stripe-signature'];

        // Verify the webhook signature to make sure it's really from Stripe
        event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: 'Invalid signature' });
    }

    // Only handle successful checkout completions
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const metadata = session.metadata || {};

        const orderItems = metadata.order_items || 'Unknown items';
        const subtotal = metadata.subtotal || '0.00';
        const shipping = metadata.shipping || '0.00';
        const total = metadata.total || '0.00';
        const customerEmail = session.customer_details?.email || 'Not provided';

        // Send order notification email via Web3Forms
        try {
            await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    access_key: WEB3FORMS_KEY,
                    subject: `🧁 New Paid Order - Rainbow Clouds ($${total})`,
                    from_name: 'Rainbow Clouds Orders',
                    message: `Payment confirmed! New order received.\n\nCustomer Email: ${customerEmail}\n\nItems: ${orderItems}\n\nSubtotal: $${subtotal}\nShipping: $${shipping}\nTotal: $${total}\n\nStripe Payment ID: ${session.payment_intent}`
                })
            });
            console.log('Order notification sent for session:', session.id);
        } catch (err) {
            console.error('Order notification failed:', err);
        }
    }

    // Always return 200 to acknowledge receipt (Stripe will retry if it doesn't get 200)
    return res.status(200).json({ received: true });
};
