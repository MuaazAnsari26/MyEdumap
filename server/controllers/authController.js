const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const TeacherProfile = require('../models/TeacherProfile');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { generateUniqueKey } = require('../services/auth/keyGenerator');
const { sendVerificationEmail } = require('../services/auth/emailService');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  signEmailVerificationToken,
  verifyEmailVerificationToken,
  setRefreshCookie,
  clearRefreshCookie,
} = require('../services/auth/tokenService');
const { env } = require('../config/env');

function buildVerificationUrl(token) {
  return `${env.clientUrl}/verify-email?token=${token}`;
}

async function issueSession(res, user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  setRefreshCookie(res, refreshToken);
  return accessToken;
}

// ---------- Student Registration ----------
const registerStudent = asyncHandler(async (req, res) => {
  const { name, username, email, password, grade } = req.body;

  const existing = await User.findOne({ $or: [{ email }, { username }] }).lean();
  if (existing) {
    const field = existing.email === email ? 'email' : 'username';
    throw new AppError(`That ${field} is already registered.`, 409, 'DUPLICATE_FIELD');
  }

  const passwordHash = await User.hashPassword(password);

  const user = await User.create({
    name,
    username,
    email,
    passwordHash,
    role: 'student',
  });

  const connectionKey = await generateUniqueKey('student');
  const profile = await StudentProfile.create({
    user: user._id,
    grade,
    connectionKey,
  });

  const verificationToken = signEmailVerificationToken(user);
  const emailResult = await sendVerificationEmail(user.email, user.name, buildVerificationUrl(verificationToken));

  res.status(201).json({
    success: true,
    message: emailResult.delivered
      ? 'Account created. Please check your email to verify your account.'
      : 'Account created. Email delivery is not configured in this environment — check the server logs for your verification link.',
    data: {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      profile: { grade: profile.grade, connectionKey: profile.connectionKey },
    },
  });
});

// ---------- Teacher Registration ----------
const registerTeacher = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email }).lean();
  if (existing) {
    throw new AppError('That email is already registered.', 409, 'DUPLICATE_FIELD');
  }

  const passwordHash = await User.hashPassword(password);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: 'teacher',
  });

  const connectionKey = await generateUniqueKey('teacher');
  const profile = await TeacherProfile.create({
    user: user._id,
    connectionKey,
  });

  const verificationToken = signEmailVerificationToken(user);
  const emailResult = await sendVerificationEmail(user.email, user.name, buildVerificationUrl(verificationToken));

  res.status(201).json({
    success: true,
    message: emailResult.delivered
      ? 'Account created. Please check your email to verify your account.'
      : 'Account created. Email delivery is not configured in this environment — check the server logs for your verification link.',
    data: {
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      profile: { connectionKey: profile.connectionKey },
    },
  });
});

// ---------- Email Verification ----------
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) {
    throw new AppError('Verification token is required.', 400, 'MISSING_TOKEN');
  }

  let decoded;
  try {
    decoded = verifyEmailVerificationToken(token);
  } catch (err) {
    throw new AppError(
      'This verification link is invalid or has expired. Please request a new one.',
      400,
      'INVALID_VERIFICATION_TOKEN'
    );
  }

  const user = await User.findById(decoded.sub);
  if (!user) {
    throw new AppError('Account not found.', 404, 'USER_NOT_FOUND');
  }

  if (user.isEmailVerified) {
    return res.status(200).json({ success: true, message: 'Email already verified. You can log in now.' });
  }

  user.isEmailVerified = true;
  await user.save();

  return res.status(200).json({ success: true, message: 'Email verified successfully. You can log in now.' });
});

const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new AppError('Email is required.', 400, 'MISSING_EMAIL');
  }

  const user = await User.findOne({ email });

  // Respond the same way whether or not the account exists, so this
  // endpoint can't be used to enumerate registered emails.
  const genericMessage = 'If an account with that email exists and is unverified, a new verification link has been sent.';

  if (!user || user.isEmailVerified) {
    return res.status(200).json({ success: true, message: genericMessage });
  }

  const verificationToken = signEmailVerificationToken(user);
  await sendVerificationEmail(user.email, user.name, buildVerificationUrl(verificationToken));

  return res.status(200).json({ success: true, message: genericMessage });
});

// ---------- Login ----------
const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }],
  }).select('+passwordHash');

  if (!user) {
    throw new AppError('Invalid email/username or password.', 401, 'INVALID_CREDENTIALS');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email/username or password.', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) {
    throw new AppError('This account has been deactivated. Contact support for help.', 403, 'ACCOUNT_DEACTIVATED');
  }

  if (!user.isEmailVerified) {
    throw new AppError(
      'Please verify your email before logging in. Check your inbox or request a new link.',
      403,
      'EMAIL_NOT_VERIFIED'
    );
  }

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = await issueSession(res, user);

  res.status(200).json({
    success: true,
    message: 'Logged in successfully.',
    data: {
      accessToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    },
  });
});

// ---------- Refresh ----------
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) {
    throw new AppError('No active session found. Please log in again.', 401, 'NO_REFRESH_TOKEN');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (err) {
    clearRefreshCookie(res);
    throw new AppError('Your session has expired. Please log in again.', 401, 'REFRESH_TOKEN_EXPIRED');
  }

  const user = await User.findById(decoded.sub);
  if (!user || !user.isActive) {
    clearRefreshCookie(res);
    throw new AppError('Session no longer valid. Please log in again.', 401, 'INVALID_SESSION');
  }

  const accessToken = await issueSession(res, user); // rotates refresh token too

  res.status(200).json({
    success: true,
    data: {
      accessToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    },
  });
});

// ---------- Logout ----------
const logout = asyncHandler(async (req, res) => {
  clearRefreshCookie(res);
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

// ---------- Current user ----------
const getMe = asyncHandler(async (req, res) => {
  const { user } = req;
  let profile = null;

  if (user.role === 'student') {
    profile = await StudentProfile.findOne({ user: user._id }).lean();
  } else if (user.role === 'teacher') {
    profile = await TeacherProfile.findOne({ user: user._id }).lean();
  }

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      profile,
    },
  });
});

module.exports = {
  registerStudent,
  registerTeacher,
  verifyEmail,
  resendVerification,
  login,
  refresh,
  logout,
  getMe,
};
