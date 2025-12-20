// Simple event emitter for toasts
const TOAST_EVENT = 'resume-roast-toast';

export const toast = {
    success: (message) => dispatch(message, 'success'),
    error: (message) => dispatch(message, 'error'),
    info: (message) => dispatch(message, 'info'),
    warning: (message) => dispatch(message, 'warning'),
};

function dispatch(message, type) {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(TOAST_EVENT, {
            detail: { id: Date.now(), message, type }
        }));
    }
}

export { TOAST_EVENT };
