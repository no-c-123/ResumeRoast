function Hero() {

    return (
        
        <div className="flex flex-col justify-center items-center h-screen overflow-x-hidden px-20 pt-20">
            <section className="flex flex-col items-center justify-center w-full">
                <h1 className="bg-gradient-to-r from-[#FF7A00] via-[#FF3E1F] to-[#FF001F] bg-clip-text text-transparent text-8xl font-bold mb-6">
                    Your Resume Sucks.
                </h1>
                <h1 className="bg-gradient-to-r from-[#FF7A00] via-[#FF3E1F] to-[#FF001F] bg-clip-text text-transparent text-8xl font-bold mb-6">
                    Let's Fix It.
                </h1>
                <div className="flex flex-col justify-center items-center w-2/4 h-96 border-4 border-dashed border-white/20 rounded-xl bg-white/5">
                    
                    <img src="/logo-orange.png" alt="logo-orange"/>
                    
                    <p 
                        className="text-white font-bold text-2xl font-outfit p-6"
                    >
                        Drag & Drop Your Resume Here
                    </p>

                    <p 
                        className="text-white/40 text-xl font-outfit pb-6"
                    > 
                        or 
                    </p>
                    
                    <button className="w-44 h-10 text-sm bg-gradient-to-r from-[#FF6333FF] to-[#DC2626FF] rounded-2xl hover:opacity-90 duration-300 flex justify-center items-center text-white font-medium">
                        <img 
                            src="Upload-Icon.svg" 
                            alt="upload-svg" 
                            className="w-5 h-5 mr-4 brightness-0 invert"
                        />
                        Browse Files
                        <input type="file" className="hidden"/>
                    </button>

                    <p className="text-white/40 text-sm font-outfit pt-5">Accepted formats: PDF, DOC, DOCX. Max file size: 5MB.</p>
                    <p className="text-neutral-400 text-md font-outfit pt-3">We analyze your resume for ATS compatibility, optimal formatting, and powerful keywords.</p>
                </div>
            </section>

            <section className="flex grid-cols-3 pt-10">
                <div className="w-96 h-44 bg-white/5 border-2 border-white/10 rounded-lg m-6 p-6 flex flex-col justify-start items-start">
                    <div className="flex flex-row justify-center items-center gap-2">
                        <img src="clipboard.png" alt="clipboard" />
                        <p className="text-white font-bold">ATS Match Score</p>
                    </div>
                    <p className="text-neutral-400 pt-3">Optimize your resume to pass Applicant Tracking Systems with flying colors, ensuring recruiters see your potential.</p>
                </div>

                <div className="w-96 h-44 bg-white/5 border-2 border-white/10 rounded-lg m-6 p-6 flex flex-col justify-start items-start">
                    <div className="flex flex-row justify-center items-center gap-2">
                        <img src="clipboard.png" alt="clipboard" />
                        <p className="text-white font-bold">Formatting Feedback</p>
                    </div>
                    <p className="text-neutral-400 pt-3">Receive expert advice on layout, readability, and visual appeal to make your resume stand out in a pile.</p>
                </div>

                <div className="w-96 h-44 bg-white/5 border-2 border-white/10 rounded-lg m-6 p-6 flex flex-col justify-start items-start">
                    <div className="flex flex-row justify-center items-center gap-2">
                        <img src="clipboard.png" alt="clipboard" />
                        <p className="text-white font-bold">Keyword Optimization</p>
                    </div>
                    <p className="text-neutral-400 pt-3">Identify and integrate high-impact keywords to align perfectly with job descriptions and industry standards.</p>
                </div>
            </section>
        </div>
    )
}
//368 x 170
export default Hero;