import {useRef, useState} from "react";
import Loader from './uicomponents/Loader.jsx';

function Hero() {

    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [careerLevel, setCareerLevel] = useState('professional');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const MAX_BYTES = 5 * 1024 * 1024; // 5MB
    const ACCEPTED = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    const validateAndSet = async (file) => {
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
        setSelectedFile(file);
        
        // Convert file to base64 for storage
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Content = e.target.result.split(',')[1];
            
            // Store file data in sessionStorage
            sessionStorage.setItem('pendingAnalysis', JSON.stringify({
                fileName: file.name,
                fileContent: base64Content,
                careerLevel: careerLevel
            }));
            
            // Navigate to analyzing page
            window.location.href = '/analyzing';
        };
        reader.readAsDataURL(file);
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

    return (
        <div className="flex flex-col justify-center items-center min-h-screen overflow-x-hidden px-4 md:px-10 lg:px-20 pt-20 pb-10">
            <section className="flex flex-col items-center justify-center w-full">
                <h1 className="bg-gradient-to-r from-[#FF7A00] via-[#FF3E1F] to-[#FF001F] bg-clip-text text-transparent text-4xl md:text-6xl lg:text-8xl font-extrabold mb-4 md:mb-6 text-center">
                    Your Resume Sucks.
                </h1>
                <h1 className="bg-gradient-to-r from-[#FF7A00] via-[#FF3E1F] to-[#FF001F] bg-clip-text text-transparent text-4xl md:text-6xl lg:text-8xl font-extrabold mb-6 md:mb-8 text-center">
                    Let's Fix It.
                </h1>

                {/* Career Level Selection */}
                <div className="w-full max-w-6xl mb-6">
                    <label className="block text-white text-sm font-medium mb-3 text-center">
                        Select your career level for tailored feedback:
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                            onClick={() => setCareerLevel('intern')}
                            className={`p-4 rounded-xl border-2 transition-all ${
                                careerLevel === 'intern'
                                    ? 'border-orange-500 bg-orange-500/20'
                                    : 'border-white/20 bg-white/5 hover:border-orange-500/50'
                            }`}
                        >
                            <div className="text-2xl mb-2">🎓</div>
                            <h3 className="text-white font-bold mb-1">Intern</h3>
                            <p className="text-white/60 text-xs">Entry-level, internship, or first job</p>
                        </button>
                        <button
                            onClick={() => setCareerLevel('new_grad')}
                            className={`p-4 rounded-xl border-2 transition-all ${
                                careerLevel === 'new_grad'
                                    ? 'border-orange-500 bg-orange-500/20'
                                    : 'border-white/20 bg-white/5 hover:border-orange-500/50'
                            }`}
                        >
                            <div className="text-2xl mb-2">🎓</div>
                            <h3 className="text-white font-bold mb-1">New Grad</h3>
                            <p className="text-white/60 text-xs">Recent graduate, 0-2 years experience</p>
                        </button>
                        <button
                            onClick={() => setCareerLevel('professional')}
                            className={`p-4 rounded-xl border-2 transition-all ${
                                careerLevel === 'professional'
                                    ? 'border-orange-500 bg-orange-500/20'
                                    : 'border-white/20 bg-white/5 hover:border-orange-500/50'
                            }`}
                        >
                            <div className="text-2xl mb-2">💼</div>
                            <h3 className="text-white font-bold mb-1">Professional</h3>
                            <p className="text-white/60 text-xs">2+ years of experience</p>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-6xl mb-4">
                    {/* Upload Resume Box */}
                    <div 
                        className={`relative flex flex-col justify-center items-center min-h-[400px] border-4 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer 
                            ${isDragging
                                ? 'bg-white/10 border-orange-500/80' 
                                : 'border-white/20 hover:border-orange-500/50 bg-white/5 hover:bg-white/10' 
                            }`}

                        onClick={openFilePicker}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ')
                                openFilePicker();
                        }}
                    >
                        {isLoading && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-xl z-10">
                                <Loader />
                            </div>
                        )}
                    
                        <img src="/logo-orange.png" alt="logo-orange" className="w-20 h-20 mb-4"/>
                        
                        <p className="text-white font-bold text-2xl font-outfit mb-3 text-center">
                            Upload Your Resume
                        </p>

                        <p className="text-white/60 text-base font-outfit mb-4 text-center px-4">
                            Drag & drop your file here
                        </p>

                        <p className="text-white/40 text-lg font-outfit mb-6"> 
                            or 
                        </p>
                        
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                openFilePicker();
                            }}
                            className="w-44 h-11 text-sm bg-gradient-to-r from-[#FF6333FF] to-[#DC2626FF] rounded-2xl hover:opacity-90 duration-300 flex justify-center items-center text-white font-medium mb-5"
                        >
                            <img 
                                src="Upload-Icon.svg" 
                                alt="upload-svg" 
                                className="w-5 h-5 mr-3 brightness-0 invert"
                            />
                            Browse Files
                        </button>
                        
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={onInputChange}
                        />

                        <p className="text-white/40 text-sm font-outfit text-center px-2">
                            Accepted: PDF, DOC, DOCX • Max 5MB
                        </p>
                        
                        {selectedFile && (
                            <p className="text-green-400 text-sm font-outfit pt-2 text-center px-2">
                                ✓ {selectedFile.name}
                            </p>
                        )}
                        {error && (
                            <p className="text-red-500 text-sm font-outfit pt-2 text-center px-2">{error}</p>
                        )}
                    </div>

                    {/* Build Resume Box */}
                    <a
                        href="/resume-builder"
                        className="relative flex flex-col justify-center items-center min-h-[400px] border-4 border-dashed rounded-xl border-white/20 hover:border-orange-500/50 bg-white/5 hover:bg-white/10 p-8 transition-all duration-300 cursor-pointer group"
                    >
                        <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-500/30 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-12 h-12 text-orange-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                        </div>

                        <p className="text-white font-bold text-2xl font-outfit mb-3 text-center">
                            Build From Scratch
                        </p>

                        <p className="text-white/60 text-base font-outfit mb-6 text-center px-4 max-w-sm">
                            Create your resume step-by-step with our guided builder
                        </p>

                        <button
                            type="button"
                            className="w-44 h-11 text-sm bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl hover:opacity-90 duration-300 flex justify-center items-center text-white font-medium mb-5"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            Get Started
                        </button>

                        <p className="text-white/40 text-sm font-outfit text-center px-2">
                            Perfect for first-time job seekers
                        </p>
                    </a>
                </div>

                <p className="text-white/40 text-sm text-center mb-6">
                    Choose how you want to start building your perfect resume
                </p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 pt-8 md:pt-10 w-full max-w-7xl">
                <div className="w-full h-auto md:h-44 bg-white/5 border-2 border-white/10 hover:border-white/20 rounded-lg p-4 md:p-6 flex flex-col justify-start items-start transition-all duration-300">
                    <div className="flex flex-row justify-center items-center gap-2">
                        <img src="clipboard.png" alt="clipboard" />
                        <p className="text-white font-semibold">ATS Match Score</p>
                    </div>
                    <p className="text-neutral-300 pt-3 font-normal">Optimize your resume to pass Applicant Tracking Systems with flying colors, ensuring recruiters see your potential.</p>
                </div>

                <div className="w-full h-auto md:h-44 bg-white/5 border-2 border-white/10 hover:border-white/20 rounded-lg p-4 md:p-6 flex flex-col justify-start items-start transition-all duration-300">
                    <div className="flex flex-row justify-center items-center gap-2">
                        <img src="clipboard.png" alt="clipboard" />
                        <p className="text-white font-semibold">Formatting Feedback</p>
                    </div>
                    <p className="text-neutral-300 pt-3 font-normal">Receive expert advice on layout, readability, and visual appeal to make your resume stand out in a pile.</p>
                </div>

                <div className="w-full h-auto md:h-44 bg-white/5 border-2 border-white/10 hover:border-white/20 rounded-lg p-4 md:p-6 flex flex-col justify-start items-start transition-all duration-300">
                    <div className="flex flex-row justify-center items-center gap-2">
                        <img src="clipboard.png" alt="clipboard" />
                        <p className="text-white font-semibold">Keyword Optimization</p>
                    </div>
                    <p className="text-neutral-300 pt-3 font-normal">Identify and integrate high-impact keywords to align perfectly with job descriptions and industry standards.</p>
                </div>
            </section>
        </div>
    )
}
//368 x 170
export default Hero;