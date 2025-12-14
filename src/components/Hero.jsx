function Hero() {

    return (
        
        <div className="flex flex-col justify-center items-center min-h-screen overflow-x-hidden px-4 md:px-10 lg:px-20 pt-20 pb-10">
            <section className="flex flex-col items-center justify-center w-full">
                <h1 className="bg-gradient-to-r from-[#FF7A00] via-[#FF3E1F] to-[#FF001F] bg-clip-text text-transparent text-4xl md:text-6xl lg:text-8xl font-extrabold mb-4 md:mb-6 text-center">
                    Your Resume Sucks.
                </h1>
                <h1 className="bg-gradient-to-r from-[#FF7A00] via-[#FF3E1F] to-[#FF001F] bg-clip-text text-transparent text-4xl md:text-6xl lg:text-8xl font-extrabold mb-6 md:mb-8 text-center">
                    Let's Fix It.
                </h1>
                <div className="flex flex-col justify-center items-center w-full md:w-3/4 lg:w-2/4 h-auto min-h-[400px] md:h-96 border-4 border-dashed border-white/20 hover:border-orange-500/50 rounded-xl bg-white/5 hover:bg-white/10 p-4 transition-all duration-300 cursor-pointer">
                    
                    <img src="/logo-orange.png" alt="logo-orange" className="w-16 h-16 md:w-20 md:h-20"/>
                    
                    <p 
                        className="text-white font-bold text-lg md:text-2xl font-outfit p-4 md:p-6 text-center"
                    >
                        Drag & Drop Your Resume Here
                    </p>

                    <p 
                        className="text-white/40 text-base md:text-xl font-outfit pb-4 md:pb-6"
                    > 
                        or 
                    </p>
                    
                    <button className="w-36 md:w-44 h-10 text-xs md:text-sm bg-gradient-to-r from-[#FF6333FF] to-[#DC2626FF] rounded-2xl hover:opacity-90 duration-300 flex justify-center items-center text-white font-medium">
                        <img 
                            src="Upload-Icon.svg" 
                            alt="upload-svg" 
                            className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-4 brightness-0 invert"
                        />
                        Browse Files
                        <input type="file" className="hidden"/>
                    </button>

                    <p className="text-white/40 text-xs md:text-sm font-outfit pt-4 md:pt-5 text-center px-2">Accepted formats: PDF, DOC, DOCX. Max file size: 5MB.</p>
                    <p className="text-neutral-400 text-sm md:text-md font-outfit pt-3 text-center px-4">We analyze your resume for ATS compatibility, optimal formatting, and powerful keywords.</p>
                </div>
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