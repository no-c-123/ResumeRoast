import React, {useState} from 'react';

function LoginForm() {
    const [isSignUp, setIsSignUp] = useState(false);
    
    const toggleForm = () => {
        setIsSignUp(!isSignUp);
    }
    
    return (

        <div className='min-h-screen flex items-center justify-center p-4'>
            <div className='relative w-full max-w-6xl h-auto md:h-[600px] rounded-3xl shadow-2xl overflow-hidden'>
                
                {/* Sliding Overlay */}
                <div
                    className={`absolute top-0 left-0 w-full md:w-1/2 h-1/2 md:h-full bg-clip-text transition-transform duration-700 ease-in-out z-10 border-2 border-white/15 rounded-2xl ${isSignUp ? 'translate-x-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'}`}
                >
                    <div className='h-full flex flex-col items-center justify-center text-white px-8 md:px-12'>
                    {isSignUp ? (
                        <>
                            <h2 className='text-2xl md:text-4xl font-bold mb-4 bg-gradient-to-br from-[#FF7A00] via-[#FF3E1F] to-[#FF001F] bg-clip-text text-transparent'>Welcome Back!</h2>
                            <p className='text-center mb-6 md:mb-8 text-orange-100 text-sm md:text-base'>
                                Already have an account? Click below to login!
                            </p>
                            <button 
                                onClick={toggleForm}
                                className='px-6 md:px-8 py-2 md:py-3 border-2 border-white rounded-full font-semibold hover:bg-white hover:text-[#FF3E1F] transition-all duration-300 text-sm md:text-base'
                            >
                                Switch to Login
                            </button>
                        </>
                    ) : (
                        <>
                        <h2 className="text-2xl md:text-4xl font-bold mb-4 bg-gradient-to-br from-[#FF7A00] via-[#FF3E1F] to-[#FF001F] bg-clip-text text-transparent">New Here?</h2>
                        <p className="text-center mb-6 md:mb-8 text-orange-100 text-sm md:text-base">
                            Start your journey in one click
                        </p>

                        <button
                            onClick={toggleForm}
                            className="px-6 md:px-8 py-2 md:py-3 border-2 border-white rounded-full font-semibold hover:bg-white hover:text-[#FF3E1F] transition-all duration-300 text-sm md:text-base"
                        >
                            SIGN UP
                        </button>

                        </>
                    )}

                    </div>
                </div>

                {/* Login Form */}

                <div className="flex justify-center items-center w-full h-full bg-black rounded-3xl">
                    <div className="flex justify-center items-center w-full h-full [background:linear-gradient(#000,#000)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.orange.600)_80%,_theme(colors.orange.500)_86%,_theme(colors.orange.300)_90%,_theme(colors.orange.500)_94%,_theme(colors.orange.600))_border-box] rounded-3xl border-[3px] border-transparent [animation:border_4s_linear_infinite]">
                        
                        {/* ========== LOGIN SECTION ========== */}
                        <div className={`flex justify-center items-center w-full md:w-1/2 h-1/2 md:h-full transition-opacity duration-700 ${isSignUp ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                            <section className="text-white flex flex-col justify-center items-center w-full px-4">
                                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#FF7A00] via-[#FF3E1F] to-[#FF001F] bg-clip-text text-transparent">LOG IN</h1>
                                <form className="w-full h-full flex flex-col items-center gap-4 md:gap-6 p-4 md:p-8" action="">
                                    
                                    <div className="group">
                                        <label htmlFor="usernameOrEmail" className="block mb-1 text-sm font-bold text-[#FF6333FF] transition-colors duration-300 ease-[cubic-bezier(.25,.01,.25,1)] group-hover:text-[#ff3c00]">
                                            Username or Email
                                        </label>
                                        <input 
                                            type="email"
                                            id="usernameOrEmail"
                                            name="usernameOrEmail"
                                            autoComplete="off"
                                            className="w-72 h-11 bg-white/5 rounded-lg px-4 border-2 border-transparent text-base text-[#FF6333FF] transition-[border-color,color,background] duration-300 ease-[cubic-bezier(.25,.01,.25,1)] hover:outline-none hover:border-[#ff3c00] focus:outline-none focus:border-[#ff3c00] group-hover:border-[#FF6333FF]"
                                        />
                                        <div></div>
                                    </div>

                                    <div className="group">
                                        <label htmlFor="usernameOrEmail" className="block mb-1 text-sm font-bold text-[#FF6333FF] transition-colors duration-300 ease-[cubic-bezier(.25,.01,.25,1)] group-hover:text-[#ff3c00]">
                                            Password
                                        </label>
                                        <input 
                                            type="password"
                                            id="loginPassword"
                                            name="password"
                                            autoComplete="current-password"
                                            className="w-full h-11 bg-white/5 rounded-lg px-4 border-2 border-transparent text-base text-[#FF6333FF] transition-[border-color,color,background] duration-300 hover:border-[#ff3c00] focus:outline-none focus:border-[#ff3c00] focus:ring-2 focus:ring-orange-500/50"
                                        />
                                    </div>
                                    <a href="#" className="text-sm text-orange-500 hover:text-orange-400 transition-colors self-end pr-8">Forgot Password?</a>
                                    <button type="submit" className="w-full max-w-sm h-11 bg-gradient-to-r from-[#FF6333FF] to-[#DC2626FF] rounded-lg text-white font-semibold hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black">Sign In</button>
                                </form>
                                <p className="text-neutral-300 text-sm">Don't have an account? <span><a href="#" className="underline text-orange-500 hover:text-orange-400 cursor-pointer transition-colors">Sign up now</a></span></p>
                            </section>
                        </div>
                        
                        {/* ========== SIGNUP SECTION ========== */}
                        <div className={`w-full md:w-1/2 h-1/2 md:h-full flex justify-center items-center transition-opacity duration-700 ${isSignUp ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            <section className="text-white flex flex-col justify-center items-center w-full px-4">
                                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#FF7A00] via-[#FF3E1F] to-[#FF001F] bg-clip-text text-transparent">SIGN UP</h1>

                                <form className="w-full h-full flex flex-col items-center gap-4 md:gap-6 p-4 md:p-8" action="">
                                    
                                    <div className="group w-full max-w-sm">
                                        <label htmlFor="signupEmail" className="block mb-1 text-sm font-semibold text-[#FF6333FF] transition-colors duration-300 group-hover:text-[#ff3c00]">
                                            Username or Email
                                        </label>
                                        <input 
                                            type="email"
                                            id="signupEmail"
                                            name="usernameOrEmail"
                                            autoComplete="email"
                                            className="w-full h-11 bg-white/5 rounded-lg px-4 border-2 border-transparent text-base text-[#FF6333FF] transition-all duration-300 hover:border-[#ff3c00] focus:outline-none focus:border-[#ff3c00] focus:ring-2 focus:ring-orange-500/50"
                                        />
                                    </div>

                                    <div className="group w-full max-w-sm">
                                        <label htmlFor="signupPassword" className="block mb-1 text-sm font-semibold text-[#FF6333FF] transition-colors duration-300 group-hover:text-[#ff3c00]">
                                            Password
                                        </label>
                                        <input 
                                            type="password"
                                            id="signupPassword"
                                            name="password"
                                            autoComplete="new-password"
                                            className="w-full h-11 bg-white/5 rounded-lg px-4 border-2 border-transparent text-base text-[#FF6333FF] transition-all duration-300 hover:border-[#ff3c00] focus:outline-none focus:border-[#ff3c00] focus:ring-2 focus:ring-orange-500/50"
                                        />
                                    </div>

                                    <div className="group w-full max-w-sm">
                                        <label htmlFor="confirmPassword" className="block mb-1 text-sm font-semibold text-[#FF6333FF] transition-colors duration-300 group-hover:text-[#ff3c00]">
                                            Confirm Password
                                        </label>
                                        <input 
                                            type="password"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            autoComplete="new-password"
                                            className="w-full h-11 bg-white/5 rounded-lg px-4 border-2 border-transparent text-base text-[#FF6333FF] transition-all duration-300 hover:border-[#ff3c00] focus:outline-none focus:border-[#ff3c00] focus:ring-2 focus:ring-orange-500/50"
                                        />
                                    </div>
                                    
                                    <button type="submit" className="w-full max-w-sm h-11 bg-gradient-to-r from-[#FF6333FF] to-[#DC2626FF] rounded-lg text-white font-semibold hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black">Create Account</button>
                                </form>
                            </section>        
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoginForm;