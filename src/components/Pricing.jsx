import React from "react";
import { PLANS } from "../lib/plans";

export default function Pricing() {

    return (
        <>
            <div className={`w-full min-h-screen flex flex-col justify-center items-center pt-20 pb-20 px-4 gap-6 transform-flat`}>
            
                <h1 className="text-3xl md:text-5xl lg:text-6xl text-white font-bold text-center">Flexible Plans for Every Career Goal</h1>
                <p className="text-neutral-400 text-center px-4">Choose the plan that best fits your needs and start perfecting your resume today.</p>
                <div className="grid grid-cols-1 lg:grid-cols-3 w-full max-w-[1550px] auto-rows-auto lg:h-[640px] mt-10 px-4 md:px-10 lg:px-20 gap-8 lg:gap-0 justify-items-center lg:[perspective:2000px]">
                    
                    {PLANS.map((plan) => (
                        <div 
                            key={plan.key}
                            className={`
                                relative flex flex-col items-center w-full max-w-[432px] h-auto 
                                ${plan.popular ? 'lg:h-[640px] z-10' : 'lg:h-[600px]'}
                                ${plan.key === 'free' ? 'bg-[#0c0c0e] lg:[transform:rotateY(15deg)] lg:hover:[transform:rotateY(0deg)] border border-zinc-800' : ''}
                                ${plan.key === 'lifetime' ? 'lg:[transform:rotateY(-15deg)] lg:hover:[transform:rotateY(0deg)]' : ''}
                                ${(plan.popular || plan.key === 'lifetime') ? '[background:linear-gradient(#0c0c0e,#0c0c0e)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.orange.600)_80%,_theme(colors.orange.500)_86%,_theme(colors.orange.300)_90%,_theme(colors.orange.500)_94%,_theme(colors.orange.600))_border-box] border-[3px] border-transparent [animation:border_4s_linear_infinite]' : ''}
                                hover:scale-105 transition-all duration-300 shadow-neutral-800 shadow-2xl rounded-2xl md:rounded-3xl
                            `}
                        >
                            {plan.popular && (
                                <p className="absolute -top-4 text-white w-28 md:w-36 h-8 flex justify-center items-center text-center text-xs md:text-sm font-bold [background:linear-gradient(#0c0c0e,#0c0c0e)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.orange.600)_80%,_theme(colors.orange.500)_86%,_theme(colors.orange.300)_90%,_theme(colors.orange.500)_94%,_theme(colors.orange.600))_border-box] rounded-3xl border-[3px] border-transparent [animation:border_4s_linear_infinite] z-10">MOST POPULAR</p>
                            )}
                            
                            <h1 className={`text-4xl font-bold text-white ${plan.popular ? 'pt-12' : 'pt-10'}`}>{plan.name}</h1>
                            <h1 className="text-4xl font-bold text-white p-6">
                                {plan.price}
                                {plan.priceDetail && <span className={`text-base font-normal ${plan.key === 'lifetime' ? 'text-orange-400' : 'text-orange-400'}`}>{plan.priceDetail}</span>}
                            </h1>
                            
                            {plan.key === 'free' && <p className="text-lg font-bold text-neutral-400">Get a quick taste of the Roast.</p>}
                            {plan.key === 'pro' && <p className="text-lg font-normal text-neutral-300">Unlock your full career potential.</p>}
                            {plan.key === 'lifetime' && <p className="text-lg font-bold text-neutral-400 px-8 text-center">Pay once, own it forever.</p>}

                            <li className="flex justify-center items-start flex-col p-4 w-full px-8">
                                {plan.features.map((feature, idx) => (
                                    <div key={idx} className="flex h-10 gap-4 pt-4 items-center w-full">
                                        <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                        </svg>
                                        <p className="text-neutral-300 text-sm md:text-base font-normal">{feature}</p>
                                    </div>
                                ))}
                            </li>
                            
                            <button 
                                className={`w-full max-w-72 md:max-w-96 mx-4 h-11 text-white font-bold text-lg bg-orange-500 rounded-2xl ${plan.popular ? 'mt-auto mb-8' : 'mt-auto mb-8'} hover:bg-orange-500/90`}
                                onClick={() => window.location.href = plan.key === 'free' ? '/' : '/payment'}
                            > 
                                {plan.button}
                            </button>
                        </div>
                    ))}

                </div>

                {/* Detailed Plan Comparison */}
                <div className="w-full max-w-6xl mt-16 md:mt-32 px-4 md:px-8">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl text-white font-bold text-center mb-8 md:mb-12">Detailed Plan Comparison</h2>
                    
                    <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-x-auto">
                        {/* Header Row */}
                        <div className="grid grid-cols-4 gap-2 md:gap-4 p-3 md:p-6 border-b border-zinc-800 min-w-[600px]">
                            <div className="text-neutral-400 font-semibold text-sm md:text-lg">Feature</div>
                            <div className="text-white font-semibold text-sm md:text-lg text-center">Free</div>
                            <div className="text-white font-semibold text-sm md:text-lg text-center">Pro</div>
                            <div className="text-white font-semibold text-sm md:text-lg text-center">Lifetime</div>
                        </div>

                        {/* AI Resume Roast */}
                        <div className="grid grid-cols-4 gap-2 md:gap-4 p-3 md:p-6 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors min-w-[600px]">
                            <div className="text-white text-sm md:text-base">AI Resume Roast</div>
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
                        <div className="grid grid-cols-4 gap-2 md:gap-4 p-3 md:p-6 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors min-w-[600px]">
                            <div className="text-white text-sm md:text-base">Detailed Fixes & Suggestions</div>
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
                        <div className="grid grid-cols-4 gap-2 md:gap-4 p-3 md:p-6 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors min-w-[600px]">
                            <div className="text-white text-sm md:text-base">Roast Report Access</div>
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
                        <div className="grid grid-cols-4 gap-2 md:gap-4 p-3 md:p-6 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors min-w-[600px]">
                            <div className="text-white text-sm md:text-base">Advanced Feedback Downloads</div>
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
                        <div className="grid grid-cols-4 gap-2 md:gap-4 p-3 md:p-6 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors min-w-[600px]">
                            <div className="text-white text-sm md:text-base">Basic Feedback Downloads</div>
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
                        <div className="grid grid-cols-4 gap-2 md:gap-4 p-3 md:p-6 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors min-w-[600px]">
                            <div className="text-white text-sm md:text-base">Keyword Optimization</div>
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
                        <div className="grid grid-cols-4 gap-2 md:gap-4 p-3 md:p-6 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors min-w-[600px]">
                            <div className="text-white text-sm md:text-base">ATS Compatibility Check</div>
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
                        <div className="grid grid-cols-4 gap-2 md:gap-4 p-3 md:p-6 hover:bg-zinc-800/50 transition-colors min-w-[600px]">
                            <div className="text-white text-sm md:text-base">Priority Customer Support</div>
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
