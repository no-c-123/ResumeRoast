import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_LIVE_SECRET_KEY || import.meta.env.STRIPE_LIVE_SECRET_KEY);
