import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../lib/logger';

export default function NavBar() {
    const { user, profile, signOut } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [currentPath, setCurrentPath] = useState('');
    const [scrolled, setScrolled] = useState(false);
    const [initials, setInitials] = useState('');
    
    // Backward compatibility for existing JSX
    const isLoggedIn = user;
    const setIsLoggedIn = () => {};

    useEffect(() => {
        const handleScroll = () => {
            const isScrolled = window.scrollY > 10;
            setScrolled(isScrolled);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentPath(window.location.pathname);
        }

        const handlePageLoad = () => {
            setCurrentPath(window.location.pathname);
        };

        document.addEventListener('astro:page-load', handlePageLoad);
        return () => document.removeEventListener('astro:page-load', handlePageLoad);
    }, []);

    useEffect(() => {
        if (profile?.full_name) {
             const nameParts = profile.full_name.split(' ');
             if (nameParts.length >= 2) {
                 setInitials(`${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase());
             } else {
                 setInitials(profile.full_name.substring(0, 2).toUpperCase());
             }
        } else if (user?.email) {
             setInitials(user.email.substring(0, 2).toUpperCase());
        }
    }, [profile, user]);

    const handleSignOut = async () => {
        try {
            await signOut();
            window.location.href = '/';
        } catch (error) {
            logger.error('Error signing out:', error);
        }
    };

    return (
        <div className="w-full h-16 md:h-20 flex items-center justify-between px-4 md:px-8 sticky top-0 z-50 pt-2 bg-black/30 backdrop-blur-2xl border-b-[0.5px] border-white/10">
            <nav className="flex items-center justify-between w-full h-16">
                <div className="flex items-center gap-2 md:gap-4">
                    <div className="bg-[#FF6333FF] rounded h-[32px] w-[32px] md:h-[36px] md:w-[36px]">
                        <img 
                            src="/image.png" 
                            alt="ResumeRoast-Logo"
                            className="w-8 h-8 md:w-10 md:h-10 pb-1 rounded"
                        />
                    </div>
                    <a 
                        href="/" 
                        className="text-[#FF6333FF] font-medium text-lg md:text-[23px]">
                        Resume Roast
                    </a>
                </div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex text-white items-center gap-8 lg:gap-14 font-medium text-[16px]">
                    <a 
                        href="/" 
                        className={currentPath === '/' ? 'text-[#ff835d]' : 'text-white hover:text-[#ff835d] duration-300'}
                    >
                        Home
                    </a>
                    <a 
                        href="/about" 
                        className={currentPath === '/about' || currentPath === '/about/' ? 'text-[#ff835d]' : 'text-white hover:text-[#ff835d] duration-300'}
                    >
                        About
                    </a>
                    <a 
                        href="/pricing" 
                        className={currentPath === '/pricing' || currentPath === '/pricing/' ? 'text-[#ff835d]' : 'text-white hover:text-[#ff835d] duration-300'}
                    >
                        Pricing
                    </a>
                </div>

                {/* Desktop Login/Signup */}
                { isLoggedIn ? (
                    <div className="hidden md:flex items-center gap-4">
                        <a 
                            href="/dashboard" 
                            className="text-white hover:text-[#ff835d] duration-300 font-medium"
                        >
                            Dashboard
                        </a>
                        <button 
                            onClick={handleSignOut}
                            className="bg-gradient-to-r from-[#FF6333FF] to-[#DC2626FF] rounded-3xl w-24 h-10 text-white hover:opacity-90 duration-300"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <div className="hidden md:flex text-white gap-4 md:gap-8 font-medium">
                        <button>
                            <a href="/login">Login</a>
                        </button>
                        
                        <button
                            className="w-20 h-10 bg-gradient-to-r from-[#F97316FF] to-[#DC2626FF] rounded-2xl hover:opacity-90 duration-300"
                        >
                            <a href="/login">Sign Up</a>
                        </button>
                    </div>
                )}

                {/* Mobile Menu Button */}
                <button 
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden text-white"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
                    </svg>
                </button>
            </nav>

            {/* Mobile Menu */}
            <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:hidden absolute top-16 left-0 w-full bg-black/95 backdrop-blur-2xl border-b border-white/10 py-4`}>
                <div className="flex flex-col gap-4 px-4">
                    <a 
                        href="/" 
                        className={`${currentPath === '/' ? 'text-[#ff835d]' : 'text-white'} text-base py-2`}
                    >
                        Home
                    </a>
                    <a 
                        href="/about" 
                        className={`${currentPath === '/about' || currentPath === '/about/' ? 'text-[#ff835d]' : 'text-white'} text-base py-2`}
                    >
                        About
                    </a>
                    <a 
                        href="/pricing" 
                        className={`${currentPath === '/pricing' || currentPath === '/pricing/' ? 'text-[#ff835d]' : 'text-white'} text-base py-2`}
                    >
                        Pricing
                    </a>
                    <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
                        {isLoggedIn ? (
                            <>
                                <a 
                                    href="/dashboard" 
                                    className="text-white py-2"
                                >
                                    Dashboard
                                </a>
                                <button 
                                    onClick={handleSignOut}
                                    className="bg-gradient-to-r from-[#FF6333FF] to-[#DC2626FF] rounded-3xl w-full h-10 text-white"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <a href="/login" className="text-white py-2">Login</a>
                                <button className="bg-gradient-to-r from-[#FF6333FF] to-[#DC2626FF] rounded-3xl w-full h-10 text-white">
                                    Sign Up
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
