import { Router } from 'express';
import { getStudentDashboard } from '../controllers/studentDashboard.controller.js';
import { getMyCourseGradesStudent } from '../controllers/gradebook.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { requireApprovedEnrollment } from '../middleware/enrollment.middleware.js';

const router = Router();

router.use(protect);

// Student Dashboard Overview Telemetry
router.get('/dashboard', getStudentDashboard);

// Student Course Gradebook Breakdown
router.get('/courses/:courseId/grades', requireApprovedEnrollment, getMyCourseGradesStudent);

export default router;
