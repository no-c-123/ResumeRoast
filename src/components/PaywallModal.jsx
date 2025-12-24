
import React, { useState, useEffect } from 'react';
import { logger } from '../lib/logger';

const ProductDisplay = ({ initialTab }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(initialTab || 'pro');

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch('/api/plans');
        const data = await res.json();
        setPlans(data);
      } catch (err) {
        logger.error('Failed to load plans');
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  const plan = plans.find((p) => p.key === selectedTab) || plans[0];

  const handleCheckout = async () => {
    // Get current user session
    const { authService } = await import('../services/supabase');
    const session = await authService.getSession();
    
    const payload = {
      planKey: plan.key,
      mode: plan.mode || (plan.key === 'lifetime' ? 'payment' : 'subscription'),
      user_id: session?.user?.id || undefined, // Include user_id if available
    };
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': session ? `Bearer ${session.access_token}` : ''
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (data.url) {
      window.location = data.url;
    } else if (data.error) {
      alert('Payment error: ' + data.error);
    } else {
      alert('Unknown error occurred.');
    }
  };

  if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
             <div className="spinner" style={{ width: 40, height: 40, border: '3px solid rgba(255, 99, 51, 0.1)', borderTopColor: '#FF6333', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
             <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      );
  }
  
  if (!plan) return null;

  return (
    <section className="lg:w-full h-full flex flex-col items-center justify-center shadow-2xl mx-auto relative borde">
      <div className="w-1/3 p-6 bg-gradient-to-b from-neutral-900 via-neutral-800 to-neutral-900 rounded-xl shadow-xl relative">
        {/* Top Back Button */}
        <button
          onClick={() => window.history.back()}
          className="absolute left-4 top-4 flex items-center gap-2 text-neutral-300 hover:text-orange-400 font-medium text-base focus:outline-none"
          aria-label="Go back"
        >
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="inline-block align-middle"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>
        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-8 pt-8">
          {plans.map(p => (
            <button
                key={p.key}
                className={`px-4 py-2 rounded-t-lg font-semibold text-base transition-all duration-200 ${selectedTab === p.key ? 'bg-orange-500 text-white' : 'bg-neutral-800 text-orange-300 hover:bg-neutral-700'}`}
                onClick={() => setSelectedTab(p.key)}
            >
                {p.name}
            </button>
          ))}
        </div>
        <div className="flex flex-col items-center gap-4 w-full">
          <img src={plan.icon} alt={plan.name} width="120" height="40" className="mb-2 drop-shadow-lg" />
          <div className="text-center">
            <h3 className={`text-3xl font-extrabold bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent mb-1`}>{plan.name}</h3>
            <h5 className="text-lg font-semibold text-orange-200 mb-4">{plan.price} <span className="text-sm font-normal text-neutral-400">{plan.priceDetail}</span></h5>
            <ul className="text-sm text-neutral-300 mb-6 space-y-1">
              {plan.features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
          <button
            id="checkout-and-portal-button"
            onClick={handleCheckout}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white font-bold text-lg shadow-lg hover:opacity-90 transition-all duration-200 mt-2"
          >
            {plan.button}
          </button>
        </div>
      </div>
    </section>
  );
};

const SuccessDisplay = ({ sessionId }) => {
  const handlePortal = async () => {
    // Get current user session
    const { authService } = await import('../services/supabase');
    const session = await authService.getSession();

    const response = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': session ? `Bearer ${session.access_token}` : ''
      },
      body: JSON.stringify({}),
    });
    const data = await response.json();
    if (data.url) {
        window.location = data.url;
    } else {
        alert('Error redirecting to portal: ' + (data.error || 'Unknown error'));
    }
  };

  return (
    <section className="lg:w-full h-full flex flex-col items-center justify-center shadow-2xl mx-auto relative">
      <div className="w-1/3 p-8 bg-neutral-900 rounded-xl shadow-xl flex flex-col items-center text-center border border-green-500/30">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
        <p className="text-neutral-400 mb-8">Thank you for your purchase. Your account has been upgraded.</p>
        
        <div className="flex flex-col gap-3 w-full">
          <a 
            href="/dashboard"
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
          >
            Go to Dashboard
          </a>
          <button 
            onClick={handlePortal}
            className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold rounded-lg transition-colors"
          >
            Manage Billing
          </button>
        </div>
      </div>
    </section>
  );
};

const CanceledDisplay = ({ message, onRetry }) => (
  <section className="lg:w-full h-full flex flex-col items-center justify-center shadow-2xl mx-auto relative">
    <div className="w-1/3 p-8 bg-neutral-900 rounded-xl shadow-xl flex flex-col items-center text-center border border-red-500/30">
      <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">Payment Canceled</h3>
      <p className="text-neutral-400 mb-8">{message}</p>
      
      <button 
        onClick={onRetry}
        className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
      >
        Try Again
      </button>
      <p className="text-neutral-400 mt-8 mb-8 text-center items-center justify-center">━━━━━━━━━━━━━<span className="mx-2"> or </span>━━━━━━━━━━━━━</p>
      <button 
        onClick={() => window.location.href='/pricing'}
        className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
      >
        Go back
      </button>
    </div>
  </section>
);

export default function PaywallModal() {
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [initialTab, setInitialTab] = useState('pro');

  useEffect(() => {
    // Check to see if this is a redirect back from Checkout
    const query = new URLSearchParams(window.location.search);

    // Detect which plan to show first based on query param
    if (query.get('plan')) {
      setInitialTab(query.get('plan'));
    }

    if (query.get('success')) {
      setSuccess(true);
      setSessionId(query.get('session_id'));
    }

    if (query.get('canceled')) {
      setSuccess(false);
      setMessage(
        "Order canceled -- you haven't been charged."
      );
    }
  }, [sessionId]);

  const handleRetry = () => {
    setMessage('');
    setSuccess(false);
    // Clear query params
    const url = new URL(window.location);
    url.search = '';
    window.history.replaceState({}, '', url);
  };

  if (!success && message === '') {
    return <ProductDisplay initialTab={initialTab} />;
  } else if (success && sessionId !== '') {
    return <SuccessDisplay sessionId={sessionId} />;
  } else {
    return <CanceledDisplay message={message} onRetry={handleRetry} />;
  }
}

const Logo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    width="14px"
    height="16px"
    viewBox="0 0 14 16"
    version="1.1"
  >
    <defs />
    <g id="Flow" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
      <g
        id="0-Default"
        transform="translate(-121.000000, -40.000000)"
        fill="#E184DF"
      >
        <path
          d="M127,50 L126,50 C123.238576,50 121,47.7614237 121,45 C121,42.2385763 123.238576,40 126,40 L135,40 L135,56 L133,56 L133,42 L129,42 L129,56 L127,56 L127,50 Z M127,48 L127,42 L126,42 C124.343146,42 123,43.3431458 123,45 C123,46.6568542 124.343146,48 126,48 L127,48 Z"
          id="Pilcrow"
        />
      </g>
    </g>
  </svg>
);