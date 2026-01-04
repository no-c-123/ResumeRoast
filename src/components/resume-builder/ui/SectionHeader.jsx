import React from 'react';

export const SectionHeader = ({ icon, title, subtitle, isComplete, isOpen, onToggle }) => (
    <div
        className={`flex items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition-colors ${isOpen ? 'bg-white/5' : ''}`}
        onClick={onToggle}
    >
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${isComplete ? 'bg-green-500/20 text-green-500' : 'bg-neutral-800 text-neutral-400'}`}>
                {isComplete ? '✓' : icon}
            </div>
            <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    {title}
                    {isComplete && <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">Complete</span>}
                </h3>
                {subtitle && <p className="text-neutral-500 text-sm">{subtitle}</p>}
            </div>
        </div>
        <div className="text-neutral-500">
            {isOpen ? '▲' : '▼'}
        </div>
    </div>
);
