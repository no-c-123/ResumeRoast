const isProduction = import.meta.env.PROD || process.env.NODE_ENV === 'production';

export const logger = {
  log: (...args) => {
    if (!isProduction) {
      console.log(...args);
    }
  },
  warn: (...args) => {
    if (!isProduction) {
      console.warn(...args);
    }
  },
  error: (message, error) => {
    // Always log critical errors, but sanitize in production
    if (isProduction) {
       // Send to error tracking service (e.g. Sentry) here in future
       // For now, just log a generic message to avoid leaking data
       console.error(message, error?.message || 'Unknown error');
    } else {
       console.error(message, error);
    }
  },
  info: (...args) => {
    if (!isProduction) {
      console.info(...args);
    }
  }
};
