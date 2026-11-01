const User = require('../../models/User');
const StudentProfile = require('../../models/StudentProfile');
const TeacherProfile = require('../../models/TeacherProfile');
const AppError = require('../../utils/AppError');
const { signAccessToken, signRefreshToken, setRefreshCookie } = require('../auth/tokenService');

const VALID_GRADES = ['10th CBSE', '12th CBSE'];

async function updateProfile(user, { name, username, grade }) {
  if (name && name.trim() && name.trim() !== user.name) {
    user.name = name.trim();
  }

  // Username is a student-only concept (teachers never had one) — a
  // value here from a teacher's request is simply ignored rather than
  // erroring, since the teacher profile form never sends this field.
  if (user.role === 'student' && username && username.trim()) {
    const normalized = username.trim().toLowerCase();
    if (normalized !== user.username) {
      const existing = await User.findOne({ username: normalized, _id: { $ne: user._id } }).lean();
      if (existing) {
        throw new AppError('That username is already taken.', 409, 'DUPLICATE_USERNAME');
      }
      user.username = normalized;
    }
  }

  await user.save();

  let profile;
  if (user.role === 'student') {
    if (grade) {
      if (!VALID_GRADES.includes(grade)) {
        throw new AppError('Invalid grade.', 400, 'INVALID_GRADE');
      }
      // Self-service grade change, by product decision. Note: quiz
      // assignment is grade-checked at the moment a teacher assigns it,
      // not re-checked when the student later attempts it — so changing
      // grade doesn't retroactively affect quizzes already assigned, in
      // either direction.
      profile = await StudentProfile.findOneAndUpdate({ user: user._id }, { grade }, { new: true }).lean();
    } else {
      profile = await StudentProfile.findOne({ user: user._id }).lean();
    }
  } else {
    profile = await TeacherProfile.findOne({ user: user._id }).lean();
  }

  return { user, profile };
}

// Returns a fresh access token (and rotates the refresh cookie) so the
// person isn't logged out by their own password change — updating
// passwordChangedAt invalidates any token issued before this moment,
// including the one they're currently using.
async function changePassword(user, { currentPassword, newPassword }, res) {
  const fullUser = await User.findById(user._id).select('+passwordHash');

  const isMatch = await fullUser.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect.', 401, 'INVALID_CURRENT_PASSWORD');
  }

  if (currentPassword === newPassword) {
    throw new AppError('New password must be different from your current password.', 400, 'SAME_PASSWORD');
  }

  fullUser.passwordHash = await User.hashPassword(newPassword);
  fullUser.passwordChangedAt = new Date();
  await fullUser.save();

  const accessToken = signAccessToken(fullUser);
  const refreshToken = signRefreshToken(fullUser);
  setRefreshCookie(res, refreshToken);

  return accessToken;
}

module.exports = { updateProfile, changePassword };
