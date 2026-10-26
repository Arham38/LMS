import { Router } from 'express';
import {
  getPublicCourses,
  getPublicCourseBySlug,
} from '../controllers/course.controller.js';
import {
  getCourseSessionsStudent,
  getMyCourseAttendanceStudent,
} from '../controllers/session.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { requireApprovedEnrollment } from '../middleware/enrollment.middleware.js';

const router = Router();

// Student Protected Session & Attendance Routes (Requires Approved Enrollment)
router.get('/:courseId/sessions', protect, requireApprovedEnrollment, getCourseSessionsStudent);
router.get('/:courseId/my-attendance', protect, requireApprovedEnrollment, getMyCourseAttendanceStudent);

// Public Course Catalog Routes
router.get('/', getPublicCourses);
router.get('/:slug', getPublicCourseBySlug);

export default router;
