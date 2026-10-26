import { Router } from 'express';
import {
  getAdminCourses,
  createCourse,
  getAdminCourseById,
  updateCourse,
  deleteCourse,
} from '../controllers/course.controller.js';
import {
  getAdminEnrollments,
  getPendingEnrollmentCount,
  reviewEnrollment,
} from '../controllers/enrollment.controller.js';
import {
  getAdminSettings,
  updateAdminSettings,
} from '../controllers/settings.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.js';
import { createCourseSchema, updateCourseSchema } from '../validators/course.validator.js';
import { adminReviewEnrollmentSchema } from '../validators/enrollment.validator.js';
import { updateSettingsSchema } from '../validators/settings.validator.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

// Non-negotiable server security: All routes under /api/admin require protect + authorizeRoles('admin')
router.use(protect);
router.use(authorizeRoles('admin'));

// Admin status verification
router.get('/ping', (req, res) => {
  return sendSuccess(res, {
    data: { role: req.user.role },
    message: 'Admin access verified',
  });
});

// Course Management
router.get('/courses', getAdminCourses);
router.post('/courses', validateBody(createCourseSchema), createCourse);
router.get('/courses/:id', getAdminCourseById);
router.put('/courses/:id', validateBody(updateCourseSchema), updateCourse);
router.delete('/courses/:id', deleteCourse);

// Enrollment Management
router.get('/enrollments', getAdminEnrollments);
router.get('/enrollments/pending-count', getPendingEnrollmentCount);
router.patch('/enrollments/:id', validateBody(adminReviewEnrollmentSchema), reviewEnrollment);

// Settings Management
router.get('/settings', getAdminSettings);
router.put('/settings', validateBody(updateSettingsSchema), updateAdminSettings);

export default router;
