import React, { useState, useEffect } from 'react';
import { TOAST_EVENT } from '../../lib/toast';

export default function ToastContainer() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const handleToast = (event) => {
            const { id, message, type } = event.detail;
            setToasts((prev) => [...prev, { id, message, type }]);

            // Auto dismiss
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 5000);
        };

        window.addEventListener(TOAST_EVENT, handleToast);
        return () => window.removeEventListener(TOAST_EVENT, handleToast);
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
            {toasts.map((toast) => (
                <div 
                    key={toast.id}
                    className={`
                        min-w-[300px] px-4 py-3 rounded-lg shadow-lg border backdrop-blur-md animate-slide-in
                        ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-200' : 
                          toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-200' :
                          'bg-neutral-800/90 border-neutral-700 text-white'}
                    `}
                >
                    <div className="flex items-center gap-3">
                        {toast.type === 'error' && (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                        )}
                        {toast.type === 'success' && (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        <p className="text-sm font-medium">{toast.message}</p>
                        <button 
                            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                            className="ml-auto text-neutral-400 hover:text-white"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
