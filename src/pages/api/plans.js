import { SERVER_PLANS } from '../../config/plans';

export const GET = async ({ request }) => {
  // Publicly exposed plan details (no internal IDs)
  const publicPlans = [
    {
      key: 'free',
      name: 'Free',
      price: '$0',
      priceDetail: '',
      features: [
        'Basic AI resume roast',
        'Limited roast report access',
        '1 basic feedback download',
        'Standard ATS compatibility'
      ],
      icon: '',
      button: 'Try Now',
      gradient: '',
      mode: 'free',
      popular: false
    },
    {
      key: 'pro',
      name: 'Pro',
      price: '$19',
      priceDetail: '/mo',
      features: [
        'Detailed AI fixes & suggestions',
        'Unlimited roast report access',
        'Unlimited advanced feedback downloads',
        'Advanced keyword optimization',
        'Priority ATS compatibility check',
        'Priority customer support'
      ],
      icon: '/proplanIcon.png',
      button: 'Upgrade to Pro',
      gradient: 'from-orange-400 via-orange-500 to-red-500',
      mode: 'subscription',
      popular: true
    },
    {
      key: 'lifetime',
      name: 'Lifetime',
      price: '$149',
      priceDetail: ' once',
      features: [
        'Detailed AI fixes & suggestions',
        'Unlimited roast report access',
        'Unlimited advanced feedback downloads',
        'Advanced keyword optimization',
        'Priority ATS compatibility check',
        'Priority customer support',
        'Pay once, own it forever'
      ],
      icon: '/OneTimePaymentIcon.png',
      button: 'Buy Lifetime Access',
      gradient: 'from-orange-400 via-orange-500 to-yellow-400',
      mode: 'payment',
      popular: false
    }
  ];

  return new Response(JSON.stringify(publicPlans), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
