/**
 * Simple in-memory rate limiter for OTP endpoints.
 * No external dependencies required.
 */

const rateLimitStore = new Map();

// Cleanup expired entries every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > data.windowMs) {
      rateLimitStore.delete(key);
    }
  }
}, 15 * 60 * 1000);

/**
 * Create a rate limiter middleware
 * @param {object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 15 min)
 * @param {number} options.maxRequests - Max requests per window (default: 5)
 * @param {string} options.keyGenerator - Function to generate rate-limit key from request
 * @param {string} options.message - Error message when limit exceeded
 */
const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  maxRequests = 5,
  keyGenerator = (req) => req.body.email || req.ip,
  message = 'Too many requests. Please try again later.',
} = {}) => {
  return (req, res, next) => {
    const key = keyGenerator(req);
    if (!key) return next();

    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
      // New window
      rateLimitStore.set(key, { windowStart: now, count: 1, windowMs });
      return next();
    }

    entry.count++;

    if (entry.count > maxRequests) {
      const retryAfterSec = Math.ceil((entry.windowStart + windowMs - now) / 1000);
      return res.status(429).json({
        message,
        retryAfterSeconds: retryAfterSec,
      });
    }

    return next();
  };
};

// Pre-configured rate limiters
const otpSendLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyGenerator: (req) => `otp-send:${req.body.email || req.ip}`,
  message: 'Too many OTP requests. Please try again after 15 minutes.',
});

const otpVerifyLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  keyGenerator: (req) => `otp-verify:${req.body.email || req.ip}`,
  message: 'Too many verification attempts. Please try again after 15 minutes.',
});

module.exports = { createRateLimiter, otpSendLimiter, otpVerifyLimiter };
