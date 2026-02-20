import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LaunchOfferModal() {
    const [isOpen, setIsOpen] = useState(false);
    
    // Set launch date to 15 days from Feb 20, 2026 (Launch Day)
    // You can adjust this date to your actual launch date
    const TARGET_DATE = new Date('2026-03-07T00:00:00'); 

    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +TARGET_DATE - +new Date();
            let newTimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

            if (difference > 0) {
                newTimeLeft = {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                };
            }
            return newTimeLeft;
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        // Show after a small delay for impact, if not already seen in session
        const hasSeen = sessionStorage.getItem('hasSeenLaunchOffer');
        
        if (!hasSeen) {
            const timer = setTimeout(() => setIsOpen(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClaim = () => {
        sessionStorage.setItem('hasSeenLaunchOffer', 'true');
        sessionStorage.setItem('claimedOffer', 'true');
        setIsOpen(false);
        window.location.href = '/login?signup=true&offer=1monthfree';
    };

    const handleClose = () => {
        sessionStorage.setItem('hasSeenLaunchOffer', 'true');
        setIsOpen(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative z-10 w-full max-w-lg bg-zinc-900 border border-orange-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-orange-900/40"
                    >
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

                        <div className="relative z-10 p-8 md:p-10 text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider mb-6">
                                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                                Live Launch Offer
                            </div>

                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                                We’re Live. <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">1 Month Free.</span>
                            </h2>

                            {/* Countdown Timer */}
                            <div className="flex justify-center gap-4 mb-6">
                                {[
                                    { label: 'Days', value: timeLeft.days },
                                    { label: 'Hours', value: timeLeft.hours },
                                    { label: 'Mins', value: timeLeft.minutes },
                                    { label: 'Secs', value: timeLeft.seconds }
                                ].map((item, i) => (
                                    <div key={i} className="flex flex-col items-center">
                                        <div className="w-14 h-14 bg-zinc-800 border border-zinc-700 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-inner">
                                            {String(item.value).padStart(2, '0')}
                                        </div>
                                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1 font-bold">{item.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-6 text-zinc-300 mb-8 leading-relaxed text-left bg-zinc-800/30 p-6 rounded-2xl border border-white/5">
                                <p>
                                    For the next <strong className="text-white">15 days</strong>, sign up and get 1 full month of ResumeRoast completely free.
                                </p>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-3 text-sm">
                                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">✓</div>
                                        No limits
                                    </li>
                                    <li className="flex items-center gap-3 text-sm">
                                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">✓</div>
                                        Full access
                                    </li>
                                    <li className="flex items-center gap-3 text-sm">
                                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">✓</div>
                                        Explore everything
                                    </li>
                                </ul>
                                <p className="text-xs text-zinc-500 italic border-t border-white/5 pt-4 flex justify-between items-center">
                                    <span>Offer ends March 7, 2026</span>
                                    <span className="text-orange-500/80">Don't miss out</span>
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={handleClaim}
                                    className="w-full py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-orange-900/20 text-lg flex items-center justify-center gap-2"
                                >
                                    <span>Claim Free Month</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                    </svg>
                                </button>
                                <button 
                                    onClick={handleClose}
                                    className="text-zinc-500 hover:text-white text-sm transition-colors py-2"
                                >
                                    Maybe later
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
