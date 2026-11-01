const rateLimit = require('express-rate-limit');

// Tighter limit on auth endpoints specifically, since these are the
// prime target for credential stuffing / brute force / spam registration.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts from this device. Please try again in a few minutes.',
    code: 'RATE_LIMITED',
  },
});

// Every route behind this makes a real Gemini API call — quiz
// generation, custom question generation, the doubt solver, and teaching
// insights all cost real money per request. The generic API-wide limiter
// (env.rateLimit, ~200/15min) is far too loose to stop someone from
// running up a large AI bill; this caps it per-account specifically.
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: {
    success: false,
    message: 'You\u2019ve hit the AI usage limit for now. Please wait a few minutes and try again.',
    code: 'AI_RATE_LIMITED',
  },
});

module.exports = { authLimiter, aiLimiter };
