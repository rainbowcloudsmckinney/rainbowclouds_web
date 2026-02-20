const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);



// Read raw body from request stream
function getRawBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
}

const handler = async (req, res) => {
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

        // Send order notification email via Google Apps Script
        try {
            await fetch('https://script.google.com/macros/s/AKfycbyu99OSzsScUZRzdYHAgec1eGTc9nBRLP0ZSI7W7woM3ZI5RlNq8eREjJcgQEG2EemR/exec', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: `🧁 New Paid Order - Rainbow Clouds ($${total})`,
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

module.exports = handler;
module.exports.config = {
    api: {
        bodyParser: false,
    },
};
