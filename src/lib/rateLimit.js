const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

const requestCounts = new Map();

export function checkRateLimit(identifier) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;
  
  // Clean up old entries
  for (const [key, data] of requestCounts.entries()) {
    if (data.startTime < windowStart) {
      requestCounts.delete(key);
    }
  }
  
  let data = requestCounts.get(identifier);
  
  if (!data) {
    data = { count: 0, startTime: now };
    requestCounts.set(identifier, data);
  }
  
  // If the window has passed, reset
  if (data.startTime < windowStart) {
    data.count = 0;
    data.startTime = now;
  }
  
  data.count++;
  
  if (data.count > MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  return true;
}
