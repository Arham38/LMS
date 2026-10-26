import { Router } from 'express';
import {
  getPublicCourses,
  getPublicCourseBySlug,
} from '../controllers/course.controller.js';
import {
  getCourseSessionsStudent,
  getMyCourseAttendanceStudent,
} from '../controllers/session.controller.js';
import { getCourseQuizzesStudent } from '../controllers/quiz.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { requireApprovedEnrollment } from '../middleware/enrollment.middleware.js';

const router = Router();

// Student Protected Session, Attendance & Quiz Routes (Requires Approved Enrollment)
router.get('/:courseId/sessions', protect, requireApprovedEnrollment, getCourseSessionsStudent);
router.get('/:courseId/my-attendance', protect, requireApprovedEnrollment, getMyCourseAttendanceStudent);
router.get('/:courseId/quizzes', protect, requireApprovedEnrollment, getCourseQuizzesStudent);

// Public Course Catalog Routes
router.get('/', getPublicCourses);
router.get('/:slug', getPublicCourseBySlug);

export default router;
