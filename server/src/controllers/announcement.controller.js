import Announcement from '../models/announcement.model.js';
import Course from '../models/course.model.js';
import Enrollment from '../models/enrollment.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import notificationService from '../services/notification.service.js';

/**
 * GET /api/admin/courses/:courseId/announcements
 * Admin list all announcements for a course
 */
export const getAdminAnnouncementsByCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const course = await Course.findById(courseId);
  if (!course) {
    throw ApiError.notFound('Course not found.', 'COURSE_NOT_FOUND');
  }

  const items = await Announcement.find({ course: courseId })
    .sort({ pinned: -1, createdAt: -1 })
    .populate('createdBy', 'name email');

  return sendSuccess(res, {
    data: {
      items,
      total: items.length,
      course: {
        _id: course._id,
        title: course.title,
      },
    },
  });
});

/**
 * POST /api/admin/courses/:courseId/announcements
 * Admin creates an announcement and broadcasts notification to students
 */
export const createAnnouncementAdmin = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const course = await Course.findById(courseId);
  if (!course) {
    throw ApiError.notFound('Course not found.', 'COURSE_NOT_FOUND');
  }

  const announcement = await Announcement.create({
    ...req.body,
    course: courseId,
    createdBy: req.user._id,
  });

  // Broadcast notification to all approved enrolled students
  try {
    await notificationService.notifyAnnouncementPosted({
      courseId,
      courseTitle: course.title,
      announcementTitle: announcement.title,
      creatorId: req.user._id,
    });
  } catch (err) {
    console.error('[Notification] Error creating announcement notice:', err.message);
  }

  return sendSuccess(res, {
    statusCode: 201,
    data: announcement,
    message: 'Announcement published successfully.',
  });
});

/**
 * PUT /api/admin/announcements/:id
 * Admin updates announcement
 */
export const updateAnnouncementAdmin = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
    throw ApiError.notFound('Announcement not found.', 'ANNOUNCEMENT_NOT_FOUND');
  }

  const allowedUpdates = ['title', 'body', 'pinned'];
  allowedUpdates.forEach((f) => {
    if (req.body[f] !== undefined) {
      announcement[f] = req.body[f];
    }
  });

  await announcement.save();

  return sendSuccess(res, {
    data: announcement,
    message: 'Announcement updated successfully.',
  });
});

/**
 * DELETE /api/admin/announcements/:id
 * Admin deletes announcement
 */
export const deleteAnnouncementAdmin = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) {
    throw ApiError.notFound('Announcement not found.', 'ANNOUNCEMENT_NOT_FOUND');
  }

  await announcement.deleteOne();

  return sendSuccess(res, {
    message: 'Announcement removed successfully.',
  });
});

/**
 * GET /api/courses/:courseId/announcements
 * Student view: announcements for course where student is approved
 */
export const getCourseAnnouncementsStudent = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const items = await Announcement.find({ course: courseId })
    .sort({ pinned: -1, createdAt: -1 })
    .populate('createdBy', 'name');

  return sendSuccess(res, {
    data: {
      items,
      total: items.length,
    },
  });
});

export default {
  getAdminAnnouncementsByCourse,
  createAnnouncementAdmin,
  updateAnnouncementAdmin,
  deleteAnnouncementAdmin,
  getCourseAnnouncementsStudent,
};
