import React, { useState, useEffect } from 'react';

const CookieConsent = () => {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'true');
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 p-4 md:p-6 z-50 shadow-lg animate-slide-up">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-gray-300 text-sm md:text-base">
          <p>
            We use cookies to enhance your experience, analyze site traffic, and personalize content. 
            By continuing to use our site, you consent to our use of cookies. 
            <a href="/cookies" className="text-orange-500 hover:text-orange-400 ml-1 underline transition-colors">
              Learn more
            </a>
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={acceptCookies}
            className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity text-sm md:text-base whitespace-nowrap"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
