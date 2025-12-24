import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/supabase';
import Loader from './uicomponents/Loader';

export default function VersionManager() {
    const { user } = useAuth();
    const [analyses, setAnalyses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchHistory();
        } else {
            // Give auth context a moment to load
            const timer = setTimeout(() => {
                 if (!user) setLoading(false); 
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const fetchHistory = async () => {
        try {
            const data = await dbService.getRecentAnalyses(user.id, 20);
            setAnalyses(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader /></div>;

    if (!user) {
         return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
                <p className="text-neutral-400 mb-6">You need to be logged in to manage versions.</p>
                <a href="/login" className="px-6 py-3 bg-orange-500 rounded-lg text-white font-bold">Log In</a>
            </div>
         );
    }

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 md:px-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12">
                    <a href="/dashboard" className="text-neutral-500 hover:text-white mb-4 inline-block transition-colors">← Back to Dashboard</a>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent mb-4">
                        Version History
                    </h1>
                    <p className="text-neutral-400">
                        View and manage your resume snapshots and analysis history.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Current Version Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#1a1a1a] border border-orange-500/30 rounded-xl p-6 shadow-lg shadow-orange-500/10 sticky top-24">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Current Version</h2>
                                <span className="px-3 py-1 bg-green-500/20 text-green-500 text-xs rounded-full border border-green-500/20">Active</span>
                            </div>
                            
                            <div className="aspect-[210/297] bg-white text-black p-4 mb-6 rounded shadow-inner overflow-hidden relative group cursor-pointer" onClick={() => window.location.href='/resume-builder'}>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <span className="opacity-0 group-hover:opacity-100 bg-black/80 text-white px-4 py-2 rounded-lg font-bold transform translate-y-2 group-hover:translate-y-0 transition-all">Edit Resume</span>
                                </div>
                                <div className="space-y-2 opacity-50 blur-[1px]">
                                    <div className="h-4 bg-black/80 w-3/4 mb-4"></div>
                                    <div className="h-2 bg-black/60 w-full"></div>
                                    <div className="h-2 bg-black/60 w-full"></div>
                                    <div className="h-2 bg-black/60 w-5/6"></div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button 
                                    onClick={() => window.location.href='/resume-builder'}
                                    className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 transition-colors"
                                >
                                    Edit Current Resume
                                </button>
                                <button 
                                    onClick={() => window.location.href='/analyzing'}
                                    className="w-full py-3 bg-neutral-800 text-white font-bold rounded-lg hover:bg-neutral-700 transition-colors border border-neutral-700"
                                >
                                    Analyze Current
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* History List */}
                    <div className="lg:col-span-2 space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-2xl">📜</span> Analysis Snapshots
                        </h3>
                        
                        {analyses.length === 0 ? (
                            <div className="bg-[#151515] border border-neutral-800 rounded-xl p-12 text-center border-dashed">
                                <p className="text-neutral-500 mb-4">No history found.</p>
                                <a href="/analyzing" className="text-orange-500 hover:text-orange-400 font-bold">Analyze your resume to create a snapshot →</a>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {analyses.map((item) => (
                                    <div key={item.id} className="bg-[#151515] border border-neutral-800 rounded-xl p-6 hover:border-orange-500/30 transition-colors group">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 bg-neutral-800 rounded-lg flex items-center justify-center text-2xl border border-neutral-700 group-hover:border-orange-500/30 transition-colors">
                                                    {item.ats_score > 80 ? '🌟' : item.ats_score > 60 ? '✅' : '⚠️'}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white text-lg">{item.file_name || 'Untitled Resume'}</h4>
                                                    <div className="flex items-center gap-3 text-sm text-neutral-500 mt-1">
                                                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                                                        <span>•</span>
                                                        <span className={`${item.ats_score > 70 ? 'text-green-500' : 'text-orange-500'}`}>Score: {item.ats_score}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                {/* 
                                                  Since we can't easily restore full resume structure from analysis text without parsing,
                                                  we'll keep "Restore" disabled or link to view results. 
                                                  Ideally we'd store the JSON blob in resume_analyses too.
                                                */}
                                                <a href="/dashboard" className="px-4 py-2 bg-neutral-800 text-neutral-300 rounded-lg hover:bg-neutral-700 transition-colors text-sm">
                                                    View Report
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
