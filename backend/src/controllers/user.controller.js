const asyncHandler = require('../utils/asyncHandler');

// @desc    Get currently logged in user profile
// @route   GET /api/v1/users/me
// @access  Private
const getMe = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        createdAt: req.user.createdAt,
      },
    },
  });
});

module.exports = {
  getMe,
};
