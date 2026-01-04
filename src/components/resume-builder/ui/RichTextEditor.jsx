import React, { useState } from 'react';

export const RichTextEditor = ({ label, value, onChange, placeholder, minLength = 50, maxLength = 500, aiAssist = false, onImprove, isImproving, improvementResult }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const insertFormatting = (format) => {
        const textarea = document.getElementById(`rte-${label.replace(/\s+/g, '-')}`);
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = value || '';
        let newText = '';
        let newCursorPos = start;

        if (format === 'bold') {
            newText = text.substring(0, start) + '**' + text.substring(start, end) + '**' + text.substring(end);
            newCursorPos = end + 4;
        } else if (format === 'bullet') {
            const before = text.substring(0, start);
            const after = text.substring(end);
            const bullet = '\n• ';
            newText = before + bullet + after;
            newCursorPos = start + bullet.length;
        }

        onChange({ target: { value: newText } });

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            const textarea = e.target;
            const cursor = textarea.selectionStart;
            const currentLine = value.substring(0, cursor).split('\n').pop();

            if (currentLine.trim().startsWith('•') || currentLine.trim().startsWith('-')) {
                e.preventDefault();
                const bullet = '\n• ';
                const newValue = value.substring(0, cursor) + bullet + value.substring(cursor);
                onChange({ target: { value: newValue } });

                setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = cursor + bullet.length;
                }, 0);
            }
        }
    };

    const charCount = value?.length || 0;
    const isValid = charCount >= minLength && charCount <= maxLength;

    return (
        <div className="space-y-2 border border-neutral-700 rounded-lg overflow-hidden bg-[#111]">
            <div
                className="flex items-center justify-between p-3 bg-neutral-800/50 cursor-pointer select-none"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                    {label}
                    {!isValid && charCount > 0 && <span className="text-xs text-orange-500 font-normal">(Min {minLength} chars)</span>}
                </label>
                <div className="flex items-center gap-3">
                    <span className={`text-xs ${isValid ? 'text-green-500' : 'text-neutral-500'}`}>
                        {charCount}/{maxLength}
                    </span>
                    <span className="text-neutral-500 text-xs">{isExpanded ? '▲' : '▼'}</span>
                </div>
            </div>

            {isExpanded && (
                <div className="p-3 border-t border-neutral-800">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex gap-1">
                            <button
                                onClick={() => insertFormatting('bold')}
                                className="p-1.5 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded transition-colors text-xs font-bold"
                                title="Bold"
                            >
                                B
                            </button>
                            <button
                                onClick={() => insertFormatting('bullet')}
                                className="p-1.5 text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded transition-colors text-xs"
                                title="Bullet List"
                            >
                                • List
                            </button>
                        </div>
                    </div>
                    <textarea
                        id={`rte-${label.replace(/\s+/g, '-')}`}
                        value={value || ''}
                        onChange={onChange}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        rows={6}
                        className="w-full bg-transparent text-white placeholder-neutral-600 text-sm focus:outline-none resize-y min-h-[120px] font-mono leading-relaxed"
                    />

                    {aiAssist && (
                        <div className="flex flex-col items-end gap-2 mt-2 relative">
                            <button
                                onClick={onImprove}
                                disabled={isImproving}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white transition-all ${isImproving
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
            )}
        </div>
    );
};
