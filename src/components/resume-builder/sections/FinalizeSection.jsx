import React from 'react';

export const FinalizeSection = ({ isDownloading, handleDownload }) => {
    return (
        <div className="space-y-6 text-center py-12">
            <div className="w-24 h-24 mx-auto bg-green-500/20 rounded-full flex items-center justify-center text-5xl mb-6">
                🎉
            </div>
            <h2 className="text-3xl font-bold text-white">Resume Complete!</h2>
            <p className="text-neutral-400 max-w-md mx-auto">
                You've filled out all the sections. Now preview your resume, choose a template, and download it.
            </p>
            <div className="flex justify-center gap-4">
                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg font-bold text-white hover:shadow-lg transition-all disabled:opacity-50"
                >
                    {isDownloading ? 'Generating PDF...' : 'Download PDF'}
                </button>
                <a
                    href="/analyzing"
                    className="px-8 py-3 bg-neutral-800 border border-neutral-700 rounded-lg font-bold text-white hover:bg-neutral-700 transition-all"
                >
                    Analyze Score
                </a>
            </div>
        </div>
    );
};
