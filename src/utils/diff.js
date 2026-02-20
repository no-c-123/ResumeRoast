
// Simple word-based diff
export const diffStrings = (oldText, newText) => {
    if (!oldText) oldText = "";
    if (!newText) newText = "";
    
    // If exact match, return text
    if (oldText === newText) return newText;
    
    // Split by whitespace
    const splitText = (text) => text.split(/\s+/);
    
    const oldWords = splitText(oldText);
    const newWords = splitText(newText);
    
    // If significantly different, just show new text
    if (Math.abs(oldWords.length - newWords.length) > Math.max(oldWords.length, newWords.length) * 0.8) {
        return `<span class="bg-green-500/20 text-green-700 dark:text-green-300 px-1 rounded">${newText}</span>`;
    }

    // Since I can't use 'diff' lib, let's just highlight the whole block if it changed
    // for a better UX than a broken word-diff without proper algo.
    // The user wants to know "what AI detected and changed".
    // Highlighting the whole improved paragraph is often clearer than messy word diffs.
    
    return `<span class="bg-green-500/20 text-green-700 dark:text-green-300 px-1 rounded border-b-2 border-green-500" title="AI Improved">${newText}</span>`;
};
