import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import Loader from './uicomponents/Loader.jsx';

function AccountDashborad() {

    const [isLoggedIn, setIsLoggedIn] = useState(null);
    const [currentTab, setCurrentTab] = useState('resume');

    // Upload Logic
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const MAX_BYTES = 5 * 1024 * 1024; // 5MB
    const ACCEPTED = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    const validateAndSet = (file) => {
        setError('');
        if (!file) return;
        
        const typeOk = !file.type || ACCEPTED.includes(file.type);
        if (!typeOk) {
            setError('Unsupported file type. Please upload a PDF or Word document.');
            return;
        }

        if (file.size > MAX_BYTES) {
            setError('File size exceeds 5MB limit. Please upload a smaller file.');
            return;
        }
        
        setIsLoading(true);
        setTimeout(() => {
            setSelectedFile(file);
            setIsLoading(false);
        }, 1000);
    };

    const openFilePicker = () => {
        setError('');
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
    
    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setIsLoggedIn(session.user);
            }
        }

        getSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                setIsLoggedIn(session.user);
            } else {
                setIsLoggedIn(null);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };

    }, [])

    return (
        <div className='w-full h-full flex pl-10'>

            {/* Sidebar Profile */}
            <aside className="flex flex-col justify-center w-1/5 h-2/5 mt-12 bg-black/5 backdrop-blur-2xl rounded-2xl border border-white/20">
                {isLoggedIn ? (
                    <div className='flex flex-col justify-center items-center'>
                        <img className='rounded-full w-24 h-24 ' src="/user_img.png" alt="" />
                        {/* Profile Name and Occupation*/}
                        <div className='flex flex-col items-center justify-center'>
                            <p className="text-neutral-400 mb-2 text-lg font-bold ">
                                <span className='text-neutral-200 '>
                                    {isLoggedIn.user_metadata.name} {isLoggedIn.user_metadata.lastname}
                                </span>
                            </p>
                            <p className="mb-2 ">
                                <span className='text-neutral-400 text-sm '>
                                    {isLoggedIn.user_metadata.occupation}
                                </span>
                            </p>
                        </div>

                        {/* Additional User Info */}
                        <div className='w-full flex flex-col justify-center items-start px-6 gap-4 mt-6'>
                            {/* Email Section */}
                            <div className='w-full flex items-center justify-between border-b border-white/10 pb-4'>
                                <div className='flex items-center gap-4'>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-neutral-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                    </svg>
                                    <div className='flex flex-col'>
                                        <label className='text-neutral-400 font-light text-xs'>Email</label>
                                        <p className='text-neutral-200 text-sm'>{isLoggedIn.email}</p>
                                    </div>
                                </div >
                                <button className='text-neutral-300 text-sm transition-all duration-300 hover:text-orange-500 cursor-pointer'>
                                    Change Email
                                </button>
                            </div>

                            {/* Password Section */}
                            <div className='w-full flex items-center justify-between pb-4'>
                                <div className='flex items-center gap-4'>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-neutral-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                    </svg>
                                    <div className='flex flex-col'>
                                        <label className='text-neutral-400 font-light text-xs'>Password</label>
                                        <p className='text-neutral-200 text-sm'>••••••••••••</p>
                                    </div>
                                </div>
                                <button className='text-neutral-300 text-sm hover:text-orange-500 transition-colors cursor-pointer'>
                                    Change Password
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-white">You are not logged in.</p>
                )}
            </aside>

            <div className='w-3/5 h-2/3 bg-black/5 border-white/20 border rounded-2xl ml-10 mt-12 p-6 text-white'>
                <nav className='relative flex items-center w-full h-12 border border-white/10 rounded-2xl bg-neutral-900/80'>
                    {/* Animated background indicator */}
                    <div 
                        className='absolute h-10 bg-neutral-700/40 rounded-2xl transition-all duration-300 ease-in-out top-1'
                        style={{
                            left: currentTab === 'resume' ? '0.5%' : currentTab === 'history' ? '33.5%' : '66.5%',
                            width: '33%'
                        }}
                    />
                    <a 
                        className={`relative z-10 flex-1 flex items-center justify-center gap-2 cursor-pointer transition-colors duration-300 ${currentTab === 'resume' ? 'text-orange-500 font-semibold' : 'hover:text-orange-400'}`}
                        onClick={() => setCurrentTab('resume')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        My Resume
                    </a>
                    <a 
                        className={`relative z-10 flex-1 flex items-center justify-center gap-2 cursor-pointer transition-colors duration-300 ${currentTab === 'history' ? 'text-orange-500 font-semibold' : 'hover:text-orange-400'}`}
                        onClick={() => setCurrentTab('history')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        History
                    </a>
                    <a 
                        className={`relative z-10 flex-1 flex items-center justify-center gap-2 cursor-pointer transition-colors duration-300 ${currentTab === 'settings' ? 'text-orange-500 font-semibold' : 'hover:text-orange-400'}`}
                        onClick={() => setCurrentTab('settings')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                    </a>
                </nav>

                <div className='mt-6'>
                    {currentTab === 'resume' && (
                        <div className="animate-fade-in">
                            <h2 className='text-2xl font-bold mb-6'>My Resume</h2>
                            <div 
                                className={`relative bg-gradient-to-r from-neutral-800/20 to-neutral-200/10 border-dashed border-2 border-neutral-500/50 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer group
                                    ${isDragging 
                                        ? 'border-orange-500/80 bg-neutral-800/80' 
                                        : 'border-neutral-500/20 hover:border-orange-500/50'
                                    }`}
                                onClick={openFilePicker}
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                onDrop={onDrop}
                            >
                                {isLoading && (
                                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-xl z-10">
                                        <Loader />
                                    </div>
                                )}
                                <div className="w-16 h-16 bg-neutral-700/50 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-neutral-400 group-hover:text-orange-500 transition-colors">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-white mb-2">Upload your resume</h3>
                                <p className="text-neutral-400 text-sm max-w-xs">Drag and drop your PDF here, or click to browse files</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    onChange={onInputChange}
                                />
                                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                            </div>
                            
                            <div className="mt-8">
                                <h3 className="text-lg font-semibold mb-4">Recent Analysis</h3>
                                <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-500/20 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center text-orange-500">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">Software_Engineer_Resume.pdf</p>
                                            <p className="text-xs text-neutral-400">Uploaded 2 days ago</p>
                                        </div>
                                    </div>
                                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors">
                                        View Roast
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentTab === 'history' && (
                        <div className="animate-fade-in">
                            <h2 className='text-2xl font-bold mb-6'>History</h2>
                            <div className="space-y-6">
                                {[1, 2, 3].map((item) => (
                                    <div key={item} className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-500/20 flex items-center justify-between hover:border-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center text-neutral-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">Resume_v{item}.pdf</p>
                                                <p className="text-xs text-neutral-400">Roasted on Dec {10 + item}, 2023</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-md border border-green-500/20">Completed</span>
                                            <button className="text-neutral-400 hover:text-white transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                                        <button className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors border border-red-500/20">
                                            Delete Account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AccountDashborad;