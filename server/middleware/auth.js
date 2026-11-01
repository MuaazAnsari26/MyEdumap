const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken } = require('../services/auth/tokenService');

// Verifies the Authorization: Bearer <token> header, loads the user, and
// attaches it to req.user. Rejects deactivated accounts and users whose
// password changed after the token was issued (forces re-login).
const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('You are not logged in. Please log in to continue.', 401, 'UNAUTHORIZED');
  }

  const token = authHeader.split(' ')[1];
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    throw new AppError('Your session is invalid or has expired. Please log in again.', 401, 'INVALID_TOKEN');
  }

  const user = await User.findById(decoded.sub);
  if (!user) {
    throw new AppError('The account for this session no longer exists.', 401, 'USER_NOT_FOUND');
  }

  if (!user.isActive) {
    throw new AppError('This account has been deactivated.', 403, 'ACCOUNT_DEACTIVATED');
  }

  if (user.passwordChangedAt) {
    const changedAtSeconds = Math.floor(user.passwordChangedAt.getTime() / 1000);
    if (decoded.iat < changedAtSeconds) {
      throw new AppError('Your password was recently changed. Please log in again.', 401, 'STALE_TOKEN');
    }
  }

  req.user = user;
  next();
});

// Restricts a route to specific roles, e.g. restrictTo('teacher').
// Must run after `protect`.
function restrictTo(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403, 'FORBIDDEN')
      );
    }
    return next();
  };
}

// Blocks access for accounts that haven't verified their email yet,
// used on sensitive/role-specific routes beyond login itself.
function requireVerifiedEmail(req, res, next) {
  if (!req.user.isEmailVerified) {
    return next(
      new AppError('Please verify your email address to access this feature.', 403, 'EMAIL_NOT_VERIFIED')
    );
  }
  return next();
}

module.exports = { protect, restrictTo, requireVerifiedEmail };
