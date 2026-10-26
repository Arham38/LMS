import Notification from '../models/notification.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, formatPagination } from '../utils/response.js';

/**
 * GET /api/notifications
 * Get paginated notifications for current user with unread count
 */
export const getMyNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = { user: req.user._id };

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, readAt: null }),
  ]);

  return sendSuccess(res, {
    data: {
      items,
      unreadCount,
      pagination: formatPagination(page, limit, total),
    },
  });
});

/**
 * GET /api/notifications/unread-count
 * Quick polling endpoint for header notification bell
 */
export const getUnreadNotificationCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    user: req.user._id,
    readAt: null,
  });

  return sendSuccess(res, {
    data: { count },
  });
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!notification) {
    throw ApiError.notFound('Notification not found.', 'NOTIFICATION_NOT_FOUND');
  }

  if (!notification.readAt) {
    notification.readAt = new Date();
    await notification.save();
  }

  return sendSuccess(res, {
    data: notification,
    message: 'Notification marked as read.',
  });
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read for current user
 */
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const now = new Date();
  const result = await Notification.updateMany(
    { user: req.user._id, readAt: null },
    { $set: { readAt: now } }
  );

  return sendSuccess(res, {
    data: { modifiedCount: result.modifiedCount },
    message: 'All notifications marked as read.',
  });
});

export default {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
