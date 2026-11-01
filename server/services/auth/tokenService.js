const jwt = require('jsonwebtoken');
const { env } = require('../../config/env');

function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user._id.toString(), type: 'refresh' }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.secret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

function signEmailVerificationToken(user) {
  return jwt.sign({ sub: user._id.toString(), purpose: 'email_verification' }, env.emailVerification.secret, {
    expiresIn: env.emailVerification.expiresIn,
  });
}

function verifyEmailVerificationToken(token) {
  return jwt.verify(token, env.emailVerification.secret);
}

// Refresh token is set as an httpOnly cookie so it can't be read by
// frontend JS (mitigates XSS token theft). The access token is returned
// in the JSON body and kept in memory on the client.
function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days, matches JWT_REFRESH_EXPIRES_IN default
    path: '/api/auth',
  });
}

function clearRefreshCookie(res) {
  res.clearCookie('refreshToken', { path: '/api/auth' });
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  signEmailVerificationToken,
  verifyEmailVerificationToken,
  setRefreshCookie,
  clearRefreshCookie,
};
