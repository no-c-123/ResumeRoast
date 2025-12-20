import React from 'react';

const UpgradeModal = ({ isOpen, onClose, featureName, remainingRequests = 0 }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-md w-full p-6 relative animate-fade-in">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Upgrade to Pro</h2>
          <p className="text-neutral-400">
            {remainingRequests <= 0 
              ? `You've used all your free ${featureName} requests.` 
              : `Unlock unlimited ${featureName} with Pro.`}
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-neutral-300">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Unlimited AI Resume Improvements</span>
          </div>
          <div className="flex items-center gap-3 text-neutral-300">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Tailor Resumes for Specific Jobs</span>
          </div>
          <div className="flex items-center gap-3 text-neutral-300">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Premium Templates & Downloads</span>
          </div>
        </div>

        <button
          onClick={() => window.location.href = '/pricing'}
          className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-orange-500/20"
        >
          Upgrade Now
        </button>
        
        <p className="text-center mt-4 text-xs text-neutral-500">
          Starting at just $19/month. Cancel anytime.
        </p>
      </div>
    </div>
  );
};

export default UpgradeModal;
