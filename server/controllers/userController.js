const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/user/userService');

const updateProfile = asyncHandler(async (req, res) => {
  const { user, profile } = await userService.updateProfile(req.user, {
    name: req.body.name,
    username: req.body.username,
    grade: req.body.grade,
  });
  res.status(200).json({
    success: true,
    message: 'Profile updated.',
    data: {
      user: { id: user._id, name: user.name, username: user.username, email: user.email, role: user.role },
      profile,
    },
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const accessToken = await userService.changePassword(req.user, req.body, res);
  res.status(200).json({
    success: true,
    message: 'Password changed successfully.',
    data: { accessToken },
  });
});

module.exports = { updateProfile, changePassword };
