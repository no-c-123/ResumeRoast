import React from 'react';

export const TextArea = ({ label, value, onChange, placeholder, maxLength, aiAssist = true, onImprove, isImproving, improvementResult }) => (
    <div className="space-y-2">
        <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-neutral-400">{label}</label>
            {maxLength && (
                <span className={`text-xs ${value?.length > maxLength ? 'text-red-500' : 'text-neutral-500'}`}>
                    {value?.length || 0}/{maxLength}
                </span>
            )}
        </div>
        <div className="relative">
            <textarea
                value={value || ''}
                onChange={onChange}
                placeholder={placeholder}
                rows={6}
                maxLength={maxLength}
                className="w-full bg-[#111] h-[300px] border border-neutral-700 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 resize-none"
            />
        </div>

        {aiAssist && (
            <div className="flex flex-col items-end gap-2 mt-2 relative">
                <button
                    onClick={onImprove}
                    disabled={isImproving}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white transition-all absolute right-0 ${isImproving
                        ? 'bg-neutral-800 cursor-not-allowed opacity-50'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 shadow-lg hover:shadow-purple-500/20'
                        }`}
                >
                    {isImproving ? (
                        <>
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Improving...</span>
                        </>
                    ) : (
                        <>
                            <h1 className='text-base font-medium'>✨ Improve with AI</h1>
                        </>
                    )}
                </button>

                {improvementResult && (
                    <div className="w-full bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-2">
                        <h4 className="text-blue-400 text-sm font-bold mb-2 flex items-center gap-2">
                            <span>✨</span> AI Improvements
                        </h4>
                        <ul className="list-disc list-inside space-y-1">
                            {improvementResult.map((note, i) => (
                                <li key={i} className="text-blue-300 text-xs leading-relaxed">
                                    {note}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        )}
    </div>
);
