import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/supabase';
import { logger } from '../lib/logger';
import Loader from './uicomponents/Loader.jsx';
import AnalysisResults from './AnalysisResults.jsx';
import { useSubscription } from '../hooks/useSubscription';
import { useRecentAnalyses } from '../hooks/useRecentAnalyses';
import { useResumeAnalyzer } from '../hooks/useResumeAnalyzer';

function AccountDashboard() {
    const { user: isLoggedIn, signOut } = useAuth();
    const [currentTab, setCurrentTab] = useState('resume');

    // Hooks
    const { subscription, loading: subLoading } = useSubscription(isLoggedIn);
    const { analyses: recentAnalyses, stats, loading: historyLoading, refetch: refetchHistory } = useRecentAnalyses(isLoggedIn);
    const { analyzeResume, analyzing, error: analyzeError } = useResumeAnalyzer();

    // Upload Logic
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [localError, setLocalError] = useState('');
    const [currentAnalysis, setCurrentAnalysis] = useState(null);

    const [deleteModal, setDeleteModal] = useState(false);
    const [showProfileUpload, setShowProfileUpload] = useState(false);

    const MAX_BYTES = 5 * 1024 * 1024; // 5MB
    const ACCEPTED = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    const handleLogout = async () => {
        try {
            await signOut();
            window.location.href = '/';
        } catch (error) {
            logger.error('Error logging out:', error);
        }
    };

    const deleteAccount = async () => {
        try {
            const session = await authService.getSession();
            if (!session) {
                throw new Error('No session found');
            }

            const response = await fetch('/api/delete-account', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete account');
            }

            await signOut();
            window.location.href = '/';
        } catch (error) {
            logger.error('Error deleting account:', error);
            setLocalError(error.message || 'Failed to delete account');
        }
    }

    const validateAndSet = async (file) => {
        setLocalError('');
        if (!file) return;
        
        const typeOk = !file.type || ACCEPTED.includes(file.type);
        if (!typeOk) {
            setLocalError('Unsupported file type. Please upload a PDF or Word document.');
            return;
        }

        if (file.size > MAX_BYTES) {
            setLocalError('File size exceeds 5MB limit. Please upload a smaller file.');
            return;
        }
        
        setSelectedFile(file);
        // Automatically start analysis
        await handleAnalyzeResume(file);
    };

    const handleAnalyzeResume = async (file) => {
        if (!isLoggedIn) return;
        setLocalError('');

        try {
            const analysis = await analyzeResume(file, isLoggedIn.id);
            setCurrentAnalysis(analysis);
            setCurrentTab('resume');
            await refetchHistory();
        } catch (err) {
            // Error is already handled/logged in hook, but we can set local state if needed
            // setLocalError(err.message); // Hook exposes 'error' state too
        }
    };

    const openFilePicker = () => {
        setLocalError('');
        fileInputRef.current?.click();
    }

    const onInputChange = (e) => {
        const file = e.target.files?.[0];
        validateAndSet(file);
    }

    const onDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const onDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const onDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        validateAndSet(file);
    }
    
    const displayError = localError || analyzeError;
    const isLoading = analyzing || historyLoading || subLoading;

    return (
        <div className="min-h-screen w-full bg-black/10 flex items-center justify-center p-6">
            {/* Main Container */}
            <div className="max-w-7xl w-full flex gap-6">
                
                {/* Left Column - Profile & Transactions */}
                <aside className="flex flex-col gap-6 w-80">
                    {/* Profile Box */}
                    <div className="bg-black/5 backdrop-blur-2xl rounded-2xl border border-white/20 p-6">
                        {isLoggedIn ? (
                            <div className='flex flex-col items-center'>
                                <div className='relative mb-4'>
                                    <img className='rounded-full w-24 h-24' src="/user_img.png" alt="Profile" />
                                    <button 
                                        onClick={() => setShowProfileUpload(true)}
                                        className='absolute bottom-0 right-0 bg-orange-500 hover:bg-orange-600 rounded-full p-2 transition-colors'
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-white">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                                        </svg>
                                    </button>
                                </div>
                                
                                {/* Profile Name and Occupation*/}
                                <div className='flex flex-col items-center text-center mb-6'>
                                    <p className="text-neutral-200 text-lg font-bold mb-1">
                                        {isLoggedIn.user_metadata.name} {isLoggedIn.user_metadata.lastname}
                                    </p>
                                    <p className="text-neutral-400 text-sm">
                                        {isLoggedIn.user_metadata.occupation}
                                    </p>
                                </div>

                                {/* Additional User Info */}
                                <div className='w-full flex flex-col gap-4'>
                                    {/* Email Section */}
                                    <div className='w-full border-b border-white/10 pb-4'>
                                        <div className='flex items-start gap-3 mb-2'>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-neutral-400 mt-0.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                            </svg>
                                            <div className='flex-1 min-w-0'>
                                                <label className='text-neutral-400 font-light text-xs'>Email</label>
                                                <p className='text-neutral-200 text-sm truncate'>{isLoggedIn.email}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => alert('Email change coming soon!')}
                                            className='text-neutral-300 text-xs transition-all duration-300 hover:text-orange-500 cursor-pointer ml-8'
                                        >
                                            Change Email
                                        </button>
                                    </div>

                                    {/* Password Section */}
                                    <div className='w-full'>
                                        <div className='flex items-start gap-3 mb-2'>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-neutral-400 mt-0.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                            </svg>
                                            <div className='flex-1'>
                                                <label className='text-neutral-400 font-light text-xs'>Password</label>
                                                <p className='text-neutral-200 text-sm'>••••••••••••</p>
                                            </div>
                                        </div>
                                        <button className='text-neutral-300 text-xs hover:text-orange-500 transition-colors cursor-pointer ml-8'>
                                            Change Password
                                        </button>
                                    </div>
                                </div>

                                {/* Logout Button */}
                                <button 
                                    onClick={handleLogout}
                                    className='w-full mt-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 border border-white/10 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 text-white'
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                    </svg>
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <p className="text-white">You are not logged in.</p>
                        )}
                    </div>

                    {/* Subscription/Transactions Box */}
                    <div className="bg-black/5 backdrop-blur-2xl rounded-2xl border border-white/20 p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-orange-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                            </svg>
                            Subscription
                        </h3>
                        <div className="space-y-3">
                            <div className="bg-neutral-900/50 rounded-lg p-3 border border-white/10">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-neutral-400 text-xs">Current Plan</span>
                                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                        subscription?.plan === 'pro' || subscription?.plan === 'premium' || subscription?.plan === 'lifetime'
                                            ? 'bg-orange-500/20 text-orange-500'
                                            : 'bg-neutral-700/50 text-neutral-400'
                                    }`}>
                                        {subscription?.plan === 'pro' ? 'Pro' : subscription?.plan === 'premium' ? 'Premium' : subscription?.plan === 'lifetime' ? 'Lifetime' : 'Free'}
                                    </span>
                                </div>
                                <p className="text-white text-sm font-medium">
                                    {subscription?.plan === 'pro' ? 'Pro Plan' : subscription?.plan === 'premium' ? 'Premium Plan' : subscription?.plan === 'lifetime' ? 'Lifetime Plan' : 'Free Plan'}
                                </p>
                                {subscription && (
                                    <p className="text-xs text-neutral-500 mt-1">
                                        {subscription.cancel_at_period_end ? 'Expires' : 'Renews'} {new Date(subscription.current_period_end).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                            
                            {!subscription || subscription.plan === 'free' ? (
                                <a 
                                    href="/pricing"
                                    className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-lg text-sm font-semibold transition-all block text-center"
                                >
                                    Upgrade to Pro
                                </a>
                            ) : null}

                            <div className="pt-3 border-t border-white/10">
                                <p className="text-xs text-neutral-400 mb-2">Recent Activity</p>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {recentAnalyses.slice(0, 3).map((analysis, idx) => (
                                        <div key={analysis.id} className="flex items-center gap-2 text-xs">
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                                analysis.ats_score >= 80 ? 'bg-green-500' :
                                                analysis.ats_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}></div>
                                            <span className="text-neutral-300 truncate">Resume analyzed</span>
                                            <span className="text-neutral-500 ml-auto whitespace-nowrap">
                                                {new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    ))}
                                    {recentAnalyses.length === 0 && (
                                        <p className="text-xs text-neutral-500 italic">No activity yet</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Right Column - Main Content */}
                <div className='flex-1 bg-black/5 border-white/20 border rounded-2xl p-6 flex flex-col max-h-[calc(100vh-3rem)]'>
                    {/* Stats Overview */}
                    <div className='grid grid-cols-3 gap-4 mb-6'>
                        <div className='bg-neutral-900/50 rounded-xl p-4 border border-white/10'>
                            <div className='flex items-center gap-3'>
                                <div className='p-2 bg-orange-500/20 rounded-lg'>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-orange-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className='text-2xl font-bold text-white'>{stats.total}</p>
                                    <p className='text-xs text-neutral-400'>Resumes Analyzed</p>
                                </div>
                            </div>
                        </div>
                        <div className='bg-neutral-900/50 rounded-xl p-4 border border-white/10'>
                            <div className='flex items-center gap-3'>
                                <div className='p-2 bg-blue-500/20 rounded-lg'>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className='text-2xl font-bold text-white'>{stats.avgScore || 0}</p>
                                    <p className='text-xs text-neutral-400'>Average ATS Score</p>
                                </div>
                            </div>
                        </div>
                        <div className='bg-neutral-900/50 rounded-xl p-4 border border-white/10'>
                            <div className='flex items-center gap-3'>
                                <div className='p-2 bg-green-500/20 rounded-lg'>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                    </svg>
                                </div>
                                <div>
                                    <p className='text-sm font-bold text-white'>
                                        {stats.lastAnalysis ? new Date(stats.lastAnalysis).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}
                                    </p>
                                    <p className='text-xs text-neutral-400'>Last Analysis</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className='flex gap-3 mb-6'>
                        <a
                            href='/resume-builder'
                            className='flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl p-4 transition-all flex items-center gap-3 text-white font-medium'
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Build New Resume
                        </a>
                        {recentAnalyses[0] && (
                            <button
                                onClick={() => {
                                    setCurrentAnalysis(recentAnalyses[0]);
                                    setCurrentTab('resume');
                                }}
                                className='flex-1 bg-neutral-900/50 hover:bg-neutral-800/50 border border-white/10 rounded-xl p-4 transition-all flex items-center gap-3 text-white font-medium'
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                View Last Analysis
                            </button>
                        )}
                    </div>

                    <nav className='relative flex items-center w-full h-12 border border-white/10 rounded-2xl bg-neutral-900/80 flex-shrink-0'>
                    {/* Animated background indicator */}
                    <div 
                        className='absolute h-10 bg-neutral-700/40 rounded-2xl transition-all duration-300 ease-in-out top-1'
                        style={{
                            left: currentTab === 'resume' ? '0.5%' : currentTab === 'history' ? '33.5%' : '66.5%',
                            width: '33%'
                        }}
                    />
                    <a 
                        className={`relative z-10 flex-1 flex items-center justify-center gap-2 cursor-pointer transition-colors duration-300 ${currentTab === 'resume' ? 'text-orange-500 font-semibold' : 'text-white hover:text-orange-400'}`}
                        onClick={() => setCurrentTab('resume')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        My Resume
                    </a>
                    <a 
                        className={`relative z-10 flex-1 flex items-center justify-center gap-2 cursor-pointer transition-colors duration-300 ${currentTab === 'history' ? 'text-orange-500 font-semibold' : 'text-white hover:text-orange-400'}`}
                        onClick={() => setCurrentTab('history')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        History
                    </a>
                    <a 
                        className={`relative z-10 flex-1 flex items-center justify-center gap-2 cursor-pointer transition-colors duration-300 ${currentTab === 'settings' ? 'text-orange-500 font-semibold' : 'text-white hover:text-orange-400'}`}
                        onClick={() => setCurrentTab('settings')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                    </a>
                </nav>

                <div className='mt-6 flex-1 overflow-y-auto text-white'>
                    {currentTab === 'resume' && (
                        <>
                            {currentAnalysis ? (
                                <AnalysisResults 
                                    analysis={currentAnalysis}
                                    onClose={() => setCurrentTab('history')}
                                    onNewAnalysis={() => {
                                        setCurrentAnalysis(null);
                                        setSelectedFile(null);
                                    }}
                                />
                            ) : (
                                <div className="animate-fade-in">
                                    <h2 className='text-2xl font-bold mb-6'>My Resume</h2>
                                    {recentAnalyses.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center mt-12">
                                            <p className="text-lg text-neutral-300 mb-6">You haven't uploaded a resume yet.</p>
                                            <div className="flex gap-4">
                                                <a href="/resume-builder" className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg text-white font-semibold hover:opacity-90 transition">Create a Resume</a>
                                                <a href="/" className="px-6 py-3 bg-neutral-800 rounded-lg text-white font-semibold hover:bg-neutral-700 transition">Analyze your Resume</a>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-8">
                                            <h3 className="text-lg font-semibold mb-4">Recent Analysis</h3>
                                            <div 
                                                className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-500/20 flex items-center justify-between cursor-pointer hover:border-orange-500/50 transition-colors"
                                                onClick={() => setCurrentAnalysis(recentAnalyses[0])}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center text-orange-500">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white">{recentAnalyses[0].file_name}</p>
                                                        <p className="text-xs text-neutral-400">
                                                            Analyzed {new Date(recentAnalyses[0].created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors">
                                                    View Results
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {currentTab === 'history' && (
                        <div className="animate-fade-in">
                            <h2 className='text-2xl font-bold mb-6'>History</h2>
                            {recentAnalyses.length > 0 ? (
                                <div className="space-y-6">
                                    {recentAnalyses.map((analysis) => (
                                        <div 
                                            key={analysis.id} 
                                            className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-500/20 flex items-center justify-between hover:border-white/10 transition-colors cursor-pointer"
                                            onClick={() => {
                                                setCurrentAnalysis(analysis);
                                                setCurrentTab('resume');
                                            }}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center text-neutral-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{analysis.file_name}</p>
                                                    <p className="text-xs text-neutral-400">
                                                        Roasted on {new Date(analysis.created_at).toLocaleDateString('en-US', { 
                                                            month: 'short', 
                                                            day: 'numeric', 
                                                            year: 'numeric' 
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`px-3 py-1 text-xs rounded-md border font-semibold ${
                                                    analysis.ats_score >= 80 
                                                        ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                                                        : analysis.ats_score >= 60
                                                        ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                }`}>
                                                    Score: {analysis.ats_score}
                                                </span>
                                                <button className="text-neutral-400 hover:text-white transition-colors">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-neutral-900/50 rounded-xl p-8 border border-neutral-500/20 text-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-neutral-600 mx-auto mb-3">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-neutral-400">No resume analyses yet</p>
                                    <button 
                                        onClick={() => setCurrentTab('resume')}
                                        className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Upload Your First Resume
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {currentTab === 'settings' && (
                        <div className="animate-fade-in">
                            <h2 className='text-2xl font-bold mb-6'>Settings</h2>
                            
                            <div className="space-y-6">
                                <div className="bg-neutral-900/50 rounded-xl p-6 border border-neutral-500/20">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-orange-500">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                        </svg>
                                        Notifications
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-white">Email Notifications</p>
                                                <p className="text-sm text-neutral-400">Receive updates about your resume analysis</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-neutral-900/50 rounded-xl p-6 border border-neutral-500/20">
                                    <h3 className="text-lg font-semibold mb-4 text-red-500 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                        </svg>
                                        Danger Zone
                                    </h3>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-white">Delete Account</p>
                                            <p className="text-sm text-neutral-400">Permanently delete your account and all data</p>
                                        </div>
                                        <button 
                                            className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors border border-red-500/20"
                                            onClick={() => setDeleteModal(true)}
                                        >
                                            Delete Account
                                        </button>

                                        {deleteModal && (
                                            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                                                <div className="bg-neutral-900/90 rounded-xl p-6 w-96 border border-red-500/30">
                                                    <h3 className="text-xl font-bold mb-4 text-red-500">Confirm Account Deletion</h3>
                                                    <p className="text-sm text-neutral-400 mb-6">
                                                        Are you sure you want to delete your account? This action is irreversible and will remove all your data.
                                                    </p>
                                                    <div className="flex justify-end gap-4">
                                                        <button 
                                                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                                                            onClick={() => setDeleteModal(false)}
                                                        > Cancel</button>
                                                        <button 
                                                            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-medium text-white transition-colors"
                                                            onClick={deleteAccount}
                                                        >
                                                            Delete Account
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </div>
    )
}

export default AccountDashboard;
