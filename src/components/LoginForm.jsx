import React, {useState} from 'react';
import { supabase } from '../lib/supabaseClient';
import { set } from 'astro:schema';
import { occupations } from '../data/occupations';

function LoginForm() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);


    // Login setup
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    
    // Sign Up setup
    const [name, setName] = useState('');
    const [lastname, setLastName] = useState('');
    const [userId, setUserId] = useState(null);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [ occupation, setOccupation ] = useState('');

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    
    const toggleForm = () => {
        setIsSignUp(!isSignUp);
    }
    
    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setErrorMessage(error.message);
            setIsLoading(false);
            return;
        }

        if (data.user) {
            window.location.href = '/';
        } else {
            window.location.href = '/verify-email';
        }
        
    }

    const handleSignUp = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setIsLoading(true);

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            setIsLoading(false);
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name: name.trim(), lastname: lastname.trim(), occupation: occupation.trim() },
            },
        });

        if (error) {
            setErrorMessage(error.message);
            setIsLoading(false);
            return;
        }

        if (data.user) {
            // Optional: Save to profiles table if needed
            const { error: profileError } = await supabase.from('profiles').insert({
                user_id: data.user.id,
                two_factor_enabled: false,
                two_factor_secret: null,
            });

            if (profileError) {
                console.error('Profile creation error:', profileError.message);
                // Don't block signup if profile creation fails
            }

            // Redirect to verification or home page
            window.location.href = '/verify-email';
        } else {
            setErrorMessage('User ID not found after sign up.');
            setIsLoading(false);
        }

    }

    return (

        <div className='min-h-screen flex items-center justify-center p-4'>
            <div className={`relative w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${isSignUp ? 'md:h-[800px]' : 'h-[500px] md:h-[600px]'}`}>
                
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
                                <form className="relative w-full h-full flex flex-col items-center gap-4 md:gap-6 p-4 md:p-8" action="">
                                    
                                    <div className="group">
                                        <label htmlFor="usernameOrEmail" className="block mb-1 text-sm font-bold text-[#FF6333FF] transition-colors duration-300 ease-[cubic-bezier(.25,.01,.25,1)] group-hover:text-[#ff3c00]">
                                            Username or Email
                                        </label>
                                        <input 
                                            type="email"
                                            placeholder='E-mail'
                                            value={email}
                                            label="Email"
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-72 h-11 bg-white/5 rounded-lg px-4 border-2 border-transparent text-base text-[#FF6333FF] transition-[border-color,color,background] duration-300 ease-[cubic-bezier(.25,.01,.25,1)] hover:outline-none hover:border-[#ff3c00] focus:outline-none focus:border-[#ff3c00] group-hover:border-[#FF6333FF]"
                                        />
                                        <div></div>
                                    </div>

                                    <div className="group">
                                        <label htmlFor="loginPassword" className="block mb-1 text-sm font-bold text-[#FF6333FF] transition-colors duration-300 ease-[cubic-bezier(.25,.01,.25,1)] group-hover:text-[#ff3c00]">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input 
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder='Password'
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="w-72 h-11 bg-white/5 rounded-lg px-4 pr-12 border-2 border-transparent text-base text-[#FF6333FF] transition-[border-color,color,background] duration-300 hover:border-[#ff3c00] focus:outline-none focus:border-[#ff3c00] focus:ring-2 focus:ring-orange-500/50"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 hover:text-orange-400 transition-colors"
                                            >
                                                {showPassword ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <button 
                                        type="submit" 
                                        className="w-72 max-w-sm h-11 bg-gradient-to-r from-[#FF6333FF] to-[#DC2626FF] rounded-lg text-white font-semibold hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black"
                                        onClick={handleLogin}
                                    >
                                        Sign In
                                    </button>
                                        {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
                                </form>
                                <p className="text-neutral-300 text-sm">Don't remember your password? <span><a href="#" className="underline text-orange-500 hover:text-orange-400 cursor-pointer transition-colors">Reset it Here</a></span></p>
                            </section>
                        </div>
                        
                        {/* ========== SIGNUP SECTION ========== */}
                        <div className={`w-full md:w-1/2 h-1/2 md:h-full flex justify-center items-center transition-opacity duration-700 ${isSignUp ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            <section className="text-white flex flex-col justify-center items-center w-full px-4">
                                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#FF7A00] via-[#FF3E1F] to-[#FF001F] bg-clip-text text-transparent">SIGN UP</h1>

                                <form className="w-full h-full flex flex-col items-center gap-4 md:gap-6 p-4 md:p-8" action="">
                                    
                                    <div className="group w-full max-w-sm">
                                        <label htmlFor="usernameOrEmail" className="block mb-1 text-sm font-bold text-[#FF6333FF] transition-colors duration-300 ease-[cubic-bezier(.25,.01,.25,1)] group-hover:text-[#ff3c00]">
                                            Name
                                        </label>
                                        <input 
                                            type="text"
                                            placeholder='First Name'
                                            value={name}
                                            label="Name"
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="w-full h-11 bg-white/5 rounded-lg px-4 border-2 border-transparent text-base text-[#FF6333FF] transition-all duration-300 hover:border-[#ff3c00] focus:outline-none focus:border-[#ff3c00] focus:ring-2 focus:ring-orange-500/50"
                                        />
                                        <div></div>
                                    </div>

                                    <div className="group w-full max-w-sm">
                                        <label htmlFor="usernameOrEmail" className="block mb-1 text-sm font-bold text-[#FF6333FF] transition-colors duration-300 ease-[cubic-bezier(.25,.01,.25,1)] group-hover:text-[#ff3c00]">
                                            Last Name
                                        </label>
                                        <input 
                                            type="text"
                                            placeholder='Last Name'
                                            value={lastname}
                                            label="Last Name"
                                            onChange={(e) => setLastName(e.target.value)}
                                            required
                                            className="w-full h-11 bg-white/5 rounded-lg px-4 border-2 border-transparent text-base text-[#FF6333FF] transition-all duration-300 hover:border-[#ff3c00] focus:outline-none focus:border-[#ff3c00] focus:ring-2 focus:ring-orange-500/50"
                                        />
                                        <div></div>
                                    </div>

                                    <div className="group w-full max-w-sm">
                                        <label htmlFor="signupEmail" className="block mb-1 text-sm font-semibold text-[#FF6333FF] transition-colors duration-300 group-hover:text-[#ff3c00]">
                                            Occupation
                                        </label>
                                        <input 
                                            type="text"
                                            value={occupation}
                                            list="occupations"
                                            onChange={(e) => setOccupation(e.target.value)}
                                            placeholder='Occupation'
                                            className="w-full h-11 bg-white/5 rounded-lg px-4 border-2 border-transparent text-base text-[#FF6333FF] transition-all duration-300 hover:border-[#ff3c00] focus:outline-none focus:border-[#ff3c00] focus:ring-2 focus:ring-orange-500/50"
                                        />
                                        <datalist id="occupations">
                                            {occupations.map((occupation) => (
                                                <option key={occupation} value={occupation} />
                                            ))}
                                        </datalist>
                                    </div>

                                    <div className="group w-full max-w-sm">
                                        <label htmlFor="signupEmail" className="block mb-1 text-sm font-semibold text-[#FF6333FF] transition-colors duration-300 group-hover:text-[#ff3c00]">
                                            Username or Email
                                        </label>
                                        <input 
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder='Email'
                                            className="w-full h-11 bg-white/5 rounded-lg px-4 border-2 border-transparent text-base text-[#FF6333FF] transition-all duration-300 hover:border-[#ff3c00] focus:outline-none focus:border-[#ff3c00] focus:ring-2 focus:ring-orange-500/50"
                                        />
                                    </div>

                                    <div className="group w-full max-w-sm">
                                        <label htmlFor="signupPassword" className="block mb-1 text-sm font-semibold text-[#FF6333FF] transition-colors duration-300 group-hover:text-[#ff3c00]">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input 
                                                type={showSignupPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder='Password'
                                                className="w-full h-11 bg-white/5 rounded-lg px-4 pr-12 border-2 border-transparent text-base text-[#FF6333FF] transition-all duration-300 hover:border-[#ff3c00] focus:outline-none focus:border-[#ff3c00] focus:ring-2 focus:ring-orange-500/50"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowSignupPassword(!showSignupPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 hover:text-orange-400 transition-colors"
                                            >
                                                {showSignupPassword ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="group w-full max-w-sm">
                                        <label htmlFor="confirmPassword" className="block mb-1 text-sm font-semibold text-[#FF6333FF] transition-colors duration-300 group-hover:text-[#ff3c00]">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <input 
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder='Confirm Password'
                                                className="w-full h-11 bg-white/5 rounded-lg px-4 pr-12 border-2 border-transparent text-base text-[#FF6333FF] transition-all duration-300 hover:border-[#ff3c00] focus:outline-none focus:border-[#ff3c00] focus:ring-2 focus:ring-orange-500/50"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 hover:text-orange-400 transition-colors"
                                            >
                                                {showConfirmPassword ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        type="submit" 
                                        onClick={handleSignUp}
                                        className="w-full max-w-sm h-11 bg-gradient-to-r from-[#FF6333FF] to-[#DC2626FF] rounded-lg text-white font-semibold hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-black"
                                    >
                                        Create Account
                                    </button>
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