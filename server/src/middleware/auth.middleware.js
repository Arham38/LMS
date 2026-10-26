import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw ApiError.unauthorized('Not authenticated. Please log in to access this resource.', 'AUTH_REQUIRED');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Your session has expired. Please log in again.', 'TOKEN_EXPIRED');
    }
    throw ApiError.unauthorized('Invalid authentication token.', 'TOKEN_INVALID');
  }

  // Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    throw ApiError.unauthorized('The user belonging to this token no longer exists.', 'USER_NOT_FOUND');
  }

  // Check if user is active
  if (!currentUser.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Please contact support.', 'ACCOUNT_DEACTIVATED');
  }

  // Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    throw ApiError.unauthorized('Password was recently changed. Please log in again with your new credentials.', 'TOKEN_INVALIDATED');
  }

  // Grant access
  req.user = currentUser;
  next();
});

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          'You do not have permission to perform this action.',
          'FORBIDDEN'
        )
      );
    }
    next();
  };
};

export default {
  protect,
  authorizeRoles,
};
