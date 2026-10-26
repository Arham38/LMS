import crypto from 'crypto';
import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import emailService from '../services/email.service.js';

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw ApiError.conflict('An account with this email address already exists.', 'EMAIL_EXISTS');
  }

  // Security rule: role is ALWAYS student; ignore any role sent in the body
  const user = await User.create({
    name,
    email,
    password,
    phone: phone || '',
    role: 'student',
    isActive: true,
  });

  const token = user.generateAuthToken();

  return sendSuccess(res, {
    statusCode: 201,
    data: {
      user: user.toJSON(),
      token,
    },
    message: 'Registration successful. Welcome to CodeCraft Academy.',
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Query user including password field
  const user = await User.findOne({ email }).select('+password');

  // Generic error for wrong email or wrong password
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password.', 'INVALID_CREDENTIALS');
  }

  // Inactive users get a clear message
  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Please contact support.', 'ACCOUNT_DEACTIVATED');
  }

  // Update last login timestamp
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = user.generateAuthToken();

  return sendSuccess(res, {
    statusCode: 200,
    data: {
      user: user.toJSON(),
      token,
    },
    message: 'Login successful.',
  });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    statusCode: 200,
    data: {
      user: req.user.toJSON(),
    },
  });
});

// PATCH /api/auth/me
export const updateMe = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  );

  return sendSuccess(res, {
    statusCode: 200,
    data: {
      user: updatedUser.toJSON(),
    },
    message: 'Profile updated successfully.',
  });
});

// PATCH /api/auth/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Retrieve user with password
  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
  }

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.badRequest('The current password you entered is incorrect.', 'INVALID_PASSWORD');
  }

  // Update password and record changed timestamp
  user.password = newPassword;
  user.passwordChangedAt = new Date();
  await user.save();

  // Issue new token so the current session remains authenticated
  const newToken = user.generateAuthToken();

  return sendSuccess(res, {
    statusCode: 200,
    data: {
      token: newToken,
      user: user.toJSON(),
    },
    message: 'Password changed successfully. All previous sessions have been invalidated.',
  });
});

// POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (user && user.isActive) {
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    try {
      await emailService.sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        resetToken,
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      throw ApiError.internal('Failed to process password reset email. Please try again later.');
    }
  }

  // Always return identical success message to prevent user enumeration
  return sendSuccess(res, {
    statusCode: 200,
    message: 'If an account exists with this email, a password reset link has been sent.',
  });
});

// POST /api/auth/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  // Hash candidate token to match database
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw ApiError.badRequest('Password reset token is invalid or has expired.', 'INVALID_RESET_TOKEN');
  }

  // Reset password
  user.password = newPassword;
  user.passwordChangedAt = new Date();
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Password has been reset successfully. Please log in with your new password.',
  });
});

export default {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
  forgotPassword,
  resetPassword,
};
