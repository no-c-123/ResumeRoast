import React, { useState, useEffect } from "react";

export default function Pricing() {
    const [ showPaywallModal, setShowPaywallModal ] = useState(false);

    useEffect(() => {
        if (showPaywallModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                setShowPaywallModal(false);
            }
        })
        
        return () => {
            document.body.style.overflow = 'unset';
        };

        
    }, [showPaywallModal]);

    return (
        <>
            <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-[60vh] transition-all ease-in-out duration-500 [background:linear-gradient(#0c0c0e,#0c0c0e)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.orange.600)_80%,_theme(colors.orange.500)_86%,_theme(colors.orange.300)_90%,_theme(colors.orange.500)_94%,_theme(colors.orange.600))_border-box] rounded-3xl border-[3px] border-transparent [animation:border_4s_linear_infinite] z-50 ${showPaywallModal ? 'flex' : 'hidden'} justify-center items-center`}>
                <button 
                    onClick={() => setShowPaywallModal(false)}
                    className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <div className={`w-full min-h-screen flex flex-col justify-center items-center pt-20 pb-20 gap-6 transform-flat ${showPaywallModal ? 'blur-lg' : ' '}`}>
            
                

                <h1 className="text-6xl text-white font-bold">Flexible Plans for Every Career Goal</h1>
                <p className="text-neutral-400">Choose the plan that best fits your needs and start perfecting your resume today.</p>
            
                <div className="grid grid-cols-3 w-[1550px] h-[508px] mt-10 px-20 justify-items-center [perspective:2000px]">
                    
                    {/* Free Plan */}
                    <div className="w-[432px] h-[508px] flex flex-col items-center bg-[#0c0c0e] rounded-2xl [transform:rotateY(15deg)] hover:[transform:rotateY(0deg)] hover:scale-105 transition-all duration-300 shadow-neutral-800 shadow-2xl">
                        <h1 className="text-4xl font-bold text-white pt-10">Free</h1>
                        <h1 className="text-4xl font-bold text-white p-6">$0</h1>
                        <p className="text-lg font-bold text-neutral-400">Get a quick taste of the Roast.</p>
                        <li className="flex justify-center items-start flex-col p-4">
                            <div className="flex h-10 gap-4 pt-4">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                                <p className="text-neutral-400">Basic AI resume roast</p>
                            </div>
                            <div className="flex h-10 gap-4 pt-4">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                                <p className="text-neutral-400">Limited roast report access</p>
                            </div>
                            <div className="flex h-10 gap-4 pt-4">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                                <p className="text-neutral-400">1 basic feedback download</p>
                            </div>
                            <div className="flex h-10 gap-4 pt-4">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                                <p className="text-neutral-400">Standard ATS compatibility</p>
                            </div>
                        </li>
                    </div>
                    {/* Pro Plan */}
                    <div className="relative flex flex-col items-center w-[432px] h-[550px] hover:scale-105 transition-all duration-300 shadow-neutral-800 shadow-2xl [background:linear-gradient(#0c0c0e,#0c0c0e)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.orange.600)_80%,_theme(colors.orange.500)_86%,_theme(colors.orange.300)_90%,_theme(colors.orange.500)_94%,_theme(colors.orange.600))_border-box] rounded-3xl border-[3px] border-transparent [animation:border_4s_linear_infinite] z-10">
                        <p className="absolute -top-4  text-white bg-gradient-to-r from-[#ff8400] via-[#ff6f00] to-[#ff3700] w-36 h-8 flex justify-center items-center text-center font-bold [background:linear-gradient(#0c0c0e,#0c0c0e)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.orange.600)_80%,_theme(colors.orange.500)_86%,_theme(colors.orange.300)_90%,_theme(colors.orange.500)_94%,_theme(colors.orange.600))_border-box] rounded-3xl border-[3px] border-transparent [animation:border_4s_linear_infinite] z-10">MOST POPULAR</p>
                        <h1 className="text-4xl font-bold text-white pt-12">Pro</h1>
                        <h1 className="text-4xl font-bold text-white p-6">$19<span className="text-base text-orange-400">/mo</span></h1>
                        <p className="text-lg font-bold text-neutral-400">Unlock your full career potential.</p>
                        <li className="flex justify-center items-start flex-col p-4">
                            <div className="flex h-10 gap-4 pt-4">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                                <p className="text-neutral-400">Detailed AI fixes & suggestions</p>
                            </div>
                            <div className="flex h-10 gap-4 pt-4">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                                <p className="text-neutral-400">Unlimited roast report access</p>
                            </div>
                            <div className="flex h-10 gap-4 pt-4">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                                <p className="text-neutral-400">Unlimited advanced feedback downloads</p>
                            </div>
                            <div className="flex h-10 gap-4 pt-4">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                                <p className="text-neutral-400">Advanced keyword optimization</p>
                            </div>
                            <div className="flex h-10 gap-4 pt-4">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                                <p className="text-neutral-400">Priority ATS compatibility check</p>
                            </div>
                            <div className="flex h-10 gap-4 pt-4">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                                <p className="text-neutral-400">Priority customer support</p>
                            </div>
                        </li>
                        <button className="w-96 h-11 text-white font-bold text-lg bg-orange-500 rounded-2xl mt-2 hover:bg-orange-500/90" onClick={() => setShowPaywallModal(true)}> Get Started </button>
                    </div>

                    {/* Enterprise Plan */}
                    <div className="flex flex-col items-center w-[432px] h-[508px] [transform:rotateY(-15deg)] hover:[transform:rotateY(0deg)] hover:scale-105 transition-all duration-300 shadow-neutral-800 shadow-2xl [background:linear-gradient(#0c0c0e,#0c0c0e)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.orange.600)_80%,_theme(colors.orange.500)_86%,_theme(colors.orange.300)_90%,_theme(colors.orange.500)_94%,_theme(colors.orange.600))_border-box] rounded-3xl border-[3px] border-transparent [animation:border_4s_linear_infinite]">
                        <h1 className="text-4xl font-bold text-white pt-10">Enterprise</h1>
                        <h1 className="text-4xl font-bold text-white p-6">$100<span className="text-base text-orange-400">/mo</span></h1>
                        <p className="text-lg font-bold text-neutral-400 px-8 text-center">For teams & organizations at scale.</p>
                        <li className="flex justify-center items-start flex-col p-4">
                            <div className="flex h-10 gap-4 pt-4">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                                <p className="text-neutral-400">Everything in Pro</p>
                            </div>
                            <div className="flex h-10 gap-4 pt-4">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                                <p className="text-neutral-400">Multi-user team accounts</p>
                            </div>
                            <div className="flex h-10 gap-4 pt-4">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                                <p className="text-neutral-400">Dedicated account manager</p>
                            </div>
                            <div className="flex h-10 gap-4 pt-4">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                                <p className="text-neutral-400">Custom branding options</p>
                            </div>
                            <div className="flex h-10 gap-4 pt-4">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                                <p className="text-neutral-400">API access for integrations</p>
                            </div>
                            <div className="flex h-10 gap-4 pt-4">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                                <p className="text-neutral-400">24/7 premium support</p>
                            </div>
                        </li>
                    </div>
                </div>

                {/* Detailed Plan Comparison */}
                <div className="w-full max-w-6xl mt-32 px-8">
                    <h2 className="text-5xl text-white font-bold text-center mb-12">Detailed Plan Comparison</h2>
                    
                    <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden">
                        {/* Header Row */}
                        <div className="grid grid-cols-4 gap-4 p-6 border-b border-zinc-800">
                            <div className="text-neutral-400 font-semibold text-lg">Feature</div>
                            <div className="text-white font-semibold text-lg text-center">Free</div>
                            <div className="text-white font-semibold text-lg text-center">Pro</div>
                            <div className="text-white font-semibold text-lg text-center">Enterprise</div>
                        </div>

                        {/* AI Resume Roast */}
                        <div className="grid grid-cols-4 gap-4 p-6 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                            <div className="text-white">AI Resume Roast</div>
                            <div className="flex justify-center">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                            </div>
                            <div className="flex justify-center">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                            </div>
                            <div className="flex justify-center">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                            </div>
                        </div>

                        {/* Detailed Fixes & Suggestions */}
                        <div className="grid grid-cols-4 gap-4 p-6 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                            <div className="text-white">Detailed Fixes & Suggestions</div>
                            <div className="flex justify-center">
                                <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </div>
                            <div className="flex justify-center">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                            </div>
                            <div className="flex justify-center">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                            </div>
                        </div>

                        {/* Roast Report Access */}
                        <div className="grid grid-cols-4 gap-4 p-6 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                            <div className="text-white">Roast Report Access</div>
                            <div className="flex justify-center">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                            </div>
                            <div className="flex justify-center">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                            </div>
                            <div className="flex justify-center">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                            </div>
                        </div>

                        {/* Advanced Feedback Downloads */}
                        <div className="grid grid-cols-4 gap-4 p-6 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                            <div className="text-white">Advanced Feedback Downloads</div>
                            <div className="flex justify-center">
                                <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </div>
                            <div className="flex justify-center">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                            </div>
                            <div className="flex justify-center">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                            </div>
                        </div>

                        {/* Basic Feedback Downloads */}
                        <div className="grid grid-cols-4 gap-4 p-6 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                            <div className="text-white">Basic Feedback Downloads</div>
                            <div className="flex justify-center">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                            </div>
                            <div className="flex justify-center">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                            </div>
                            <div className="flex justify-center">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                            </div>
                        </div>

                        {/* Keyword Optimization */}
                        <div className="grid grid-cols-4 gap-4 p-6 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                            <div className="text-white">Keyword Optimization</div>
                            <div className="flex justify-center">
                                <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </div>
                            <div className="flex justify-center">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                            </div>
                            <div className="flex justify-center">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                            </div>
                        </div>

                        {/* ATS Compatibility Check */}
                        <div className="grid grid-cols-4 gap-4 p-6 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                            <div className="text-white">ATS Compatibility Check</div>
                            <div className="flex justify-center">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                            </div>
                            <div className="flex justify-center">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                            </div>
                            <div className="flex justify-center">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                            </div>
                        </div>

                        {/* Priority Customer Support */}
                        <div className="grid grid-cols-4 gap-4 p-6 hover:bg-zinc-800/50 transition-colors">
                            <div className="text-white">Priority Customer Support</div>
                            <div className="flex justify-center">
                                <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </div>
                            <div className="flex justify-center">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                            </div>
                            <div className="flex justify-center">
                                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>

        
    )
}