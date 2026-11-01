// Loads and validates environment variables in one place so nothing
// in the rest of the app has to guess whether a var exists.
require('dotenv').config();

const required = ['MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET', 'EMAIL_VERIFICATION_SECRET'];

function assertRequiredEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    // Fail loudly and immediately rather than limping along with
    // undefined secrets, which would silently break auth.
    // eslint-disable-next-line no-console
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error('Copy server/.env.example to server/.env and fill in real values.');
    process.exit(1);
  }
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  mongoUri: process.env.MONGO_URI,

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  emailVerification: {
    secret: process.env.EMAIL_VERIFICATION_SECRET,
    expiresIn: process.env.EMAIL_VERIFICATION_EXPIRES_IN || '1d',
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'EduMap <no-reply@edumap.app>',
  },

  ai: {
    provider: process.env.AI_PROVIDER || 'gemini',
    geminiApiKey: process.env.GEMINI_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 200,
  },
};

module.exports = { env, assertRequiredEnv };
