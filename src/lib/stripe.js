import Stripe from 'stripe';

if (typeof window !== 'undefined') {
    throw new Error('Stripe server instance must not be used on the client side');
}

export const stripe = new Stripe(process.env.STRIPE_LIVE_SECRET_KEY || import.meta.env.STRIPE_LIVE_SECRET_KEY);