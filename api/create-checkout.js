const Stripe = require('stripe');

// Validate required environment variables
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

// Initialize Stripe with secret key from environment variable
// NEVER expose this key in client-side code!
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Shipping rates by US state (same as frontend for validation)
const SHIPPING_RATES = {
    TX: 5,
    LA: 8, OK: 8, AR: 8, NM: 8, MS: 8,
    CO: 10, KS: 10, MO: 10, NE: 10, IA: 10, MN: 10, WI: 10,
    IL: 10, IN: 10, OH: 10, MI: 10, TN: 10, KY: 10, AL: 10,
    CA: 12, WA: 12, OR: 12, AZ: 12, NV: 12, UT: 12,
    NY: 12, PA: 12, NJ: 12, MA: 12, CT: 12, FL: 12,
    GA: 12, NC: 12, SC: 12, VA: 12, MD: 12,
    AK: 18, HI: 18
};
const DEFAULT_SHIPPING = 12;

module.exports = async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { items, state, successUrl, cancelUrl } = req.body;

        // Validate input
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Cart items required' });
        }

        if (!state || typeof state !== 'string') {
            return res.status(400).json({ error: 'Shipping state required' });
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

        // Get shipping rate
        const shippingRate = SHIPPING_RATES[state.toUpperCase()] || DEFAULT_SHIPPING;
        const total = subtotal + shippingRate;

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
                        name: `Shipping to ${state.toUpperCase()}`,
                        description: 'Standard shipping'
                    },
                    unit_amount: Math.round(shippingRate * 100)
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
                shipping_state: state,
                subtotal: subtotal.toFixed(2),
                shipping: shippingRate.toFixed(2),
                total: total.toFixed(2)
            }
        });

        // Return the checkout URL
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json({
            url: session.url,
            sessionId: session.id
        });

    } catch (error) {
        // Log detailed error server-side for debugging
        console.error('Stripe checkout error:', error);
        res.setHeader('Access-Control-Allow-Origin', '*');

        // Return generic error to client (don't leak internal details)
        return res.status(500).json({
            error: 'Unable to create checkout session. Please try again.'
        });
    }
};
