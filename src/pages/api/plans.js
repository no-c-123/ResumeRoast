export const plans = [
  {
    key: 'pro',
    name: 'Pro Plan',
    price: '$19.00',
    priceDetail: '/ month',
    lookup_key: 'Pro_plan-0d04ed9',
    // price_id can be fetched via lookup_key or hardcoded if necessary, 
    // but better to rely on lookup_key or server resolution
    features: [
      '✔️ Unlimited resume analyses',
      '✔️ Premium templates',
      '✔️ Priority support',
      '✔️ Cancel anytime',
    ],
    icon: '/proplanIcon.png',
    button: 'Upgrade to Pro',
    gradient: 'from-orange-400 via-orange-500 to-red-500',
    mode: 'subscription'
  },
  {
    key: 'lifetime',
    name: 'Lifetime Plan',
    price: '$149',
    priceDetail: 'one time',
    lookup_key: 'Lifetime_plan-0d04ed91',
    price_id: 'price_1SfadPCg8wVUWA0gLWYY3HPb',
    features: [
      '✔️ Unlimited resume analyses',
      '✔️ Premium templates',
      '✔️ Priority support',
      '✔️ Pay once, own it forever',
    ],
    icon: '/OneTimePaymentIcon.png',
    button: 'Buy Lifetime Access',
    gradient: 'from-orange-400 via-orange-500 to-yellow-400',
    mode: 'payment'
  },
];

export async function GET({ request }) {
  return new Response(JSON.stringify(plans), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}