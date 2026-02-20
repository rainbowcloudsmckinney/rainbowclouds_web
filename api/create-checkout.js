const Stripe = require('stripe');

// Validate required environment variables
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

// Initialize Stripe with secret key from environment variable
// NEVER expose this key in client-side code!
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Flat shipping rate
const FLAT_SHIPPING = 15;
const MIN_ORDER = 6;

module.exports = async (req, res) => {
    // Get allowed origin from environment variable (defaults to * for development)
    const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { items, successUrl, cancelUrl } = req.body;

        // Validate input
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Cart items required' });
        }

        // Validate minimum order
        const totalQty = items.reduce((sum, item) => sum + (item.qty || 0), 0);
        if (totalQty < MIN_ORDER) {
            return res.status(400).json({ error: `Minimum order is ${MIN_ORDER} items` });
        }

        // Calculate totals server-side (never trust client calculations for payment!)
        const subtotal = items.reduce((sum, item) => {
            // Validate each item has required fields
            if (!item.name || typeof item.price !== 'number' || typeof item.qty !== 'number') {
                throw new Error('Invalid item format');
            }
            // All cotton candy is $3 - validate price
            if (item.price !== 3) {
                throw new Error('Invalid item price');
            }
            return sum + (item.price * item.qty);
        }, 0);

        const total = subtotal + FLAT_SHIPPING;

        // Build line items for Stripe
        const lineItems = [
            // Product items
            ...items.map(item => ({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `${item.name} Cotton Candy`,
                        description: 'Rainbow Clouds Premium Cotton Candy'
                    },
                    unit_amount: Math.round(item.price * 100) // Stripe uses cents
                },
                quantity: item.qty
            })),
            // Shipping as a line item
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Standard Shipping',
                        description: 'Flat rate shipping across the US'
                    },
                    unit_amount: Math.round(FLAT_SHIPPING * 100)
                },
                quantity: 1
            }
        ];

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: successUrl || `${req.headers.origin || 'http://localhost:8080'}/success.html`,
            cancel_url: cancelUrl || `${req.headers.origin || 'http://localhost:8080'}/cancel.html`,
            shipping_address_collection: {
                allowed_countries: ['US']
            },
            metadata: {
                order_items: items.map(i => `${i.name} x${i.qty}`).join(', '),
                subtotal: subtotal.toFixed(2),
                shipping: FLAT_SHIPPING.toFixed(2),
                total: total.toFixed(2)
            }
        });

        // Order notification email is sent via webhook (api/stripe-webhook.js)
        // only after payment is confirmed — not here at session creation

        // Return the checkout URL
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        return res.status(200).json({
            url: session.url,
            sessionId: session.id
        });

    } catch (error) {
        // Log detailed error server-side for debugging
        console.error('Stripe checkout error:', error);
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);

        // Return generic error to client (don't leak internal details)
        return res.status(500).json({
            error: 'Unable to create checkout session. Please try again.'
        });
    }
};
