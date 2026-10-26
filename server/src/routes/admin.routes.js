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
import {
  getCourseSessionsAdmin,
  createSessionAdmin,
  getSessionByIdAdmin,
  updateSessionAdmin,
  deleteSessionAdmin,
  updateSessionStatusAdmin,
  getSessionAttendanceAdmin,
  updateSessionAttendanceAdmin,
  getTodaySessionsAdmin,
} from '../controllers/session.controller.js';
import {
  getAdminQuizzesByCourse,
  createQuizAdmin,
  getQuizByIdAdmin,
  updateQuizAdmin,
  deleteQuizAdmin,
  importQuestionsPlainTextAdmin,
  getQuizResultsAdmin,
  exportQuizResultsCSVAdmin,
} from '../controllers/quiz.controller.js';
import {
  getAdminAssignmentsByCourse,
  createAssignmentAdmin,
  getAssignmentByIdAdmin,
  updateAssignmentAdmin,
  deleteAssignmentAdmin,
  getAssignmentSubmissionsAdmin,
  gradeSubmissionAdmin,
  exportAssignmentMarksCSVAdmin,
} from '../controllers/assignment.controller.js';
import {
  getAdminAnnouncementsByCourse,
  createAnnouncementAdmin,
  updateAnnouncementAdmin,
  deleteAnnouncementAdmin,
} from '../controllers/announcement.controller.js';
import { getAdminStats } from '../controllers/adminStats.controller.js';
import {
  getAdminStudents,
  getAdminStudentById,
  updateStudentStatusAdmin,
  updateStudentNotesAdmin,
} from '../controllers/adminStudent.controller.js';
import {
  getAdminMessages,
  updateMessageStatus,
  deleteContactMessage,
} from '../controllers/contact.controller.js';
import {
  getCourseGradebookAdmin,
  exportCourseGradebookCSVAdmin,
} from '../controllers/gradebook.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.js';
import { createCourseSchema, updateCourseSchema } from '../validators/course.validator.js';
import { adminReviewEnrollmentSchema } from '../validators/enrollment.validator.js';
import { updateSettingsSchema } from '../validators/settings.validator.js';
import {
  createSessionSchema,
  updateSessionSchema,
  updateSessionStatusSchema,
  updateAttendanceBulkSchema,
} from '../validators/session.validator.js';
import {
  createQuizSchema,
  updateQuizSchema,
  importPlainTextSchema,
} from '../validators/quiz.validator.js';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  gradeSubmissionSchema,
} from '../validators/assignment.validator.js';
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  updateStudentStatusSchema,
  updateStudentNotesSchema,
} from '../validators/announcement.validator.js';
import { updateContactMessageSchema } from '../validators/contact.validator.js';
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

// Course Sessions Management
router.get('/courses/:courseId/sessions', getCourseSessionsAdmin);
router.post('/courses/:courseId/sessions', validateBody(createSessionSchema), createSessionAdmin);

// Sessions & Attendance Management
router.get('/sessions/today', getTodaySessionsAdmin);
router.get('/sessions/:id', getSessionByIdAdmin);
router.put('/sessions/:id', validateBody(updateSessionSchema), updateSessionAdmin);
router.delete('/sessions/:id', deleteSessionAdmin);
router.patch('/sessions/:id/status', validateBody(updateSessionStatusSchema), updateSessionStatusAdmin);
router.get('/sessions/:id/attendance', getSessionAttendanceAdmin);
router.put('/sessions/:id/attendance', validateBody(updateAttendanceBulkSchema), updateSessionAttendanceAdmin);

// Course Quizzes Management
router.get('/courses/:courseId/quizzes', getAdminQuizzesByCourse);
router.post('/courses/:courseId/quizzes', validateBody(createQuizSchema), createQuizAdmin);

// Quiz Builder, Bulk Import & Analytics
router.get('/quizzes/:id', getQuizByIdAdmin);
router.put('/quizzes/:id', validateBody(updateQuizSchema), updateQuizAdmin);
router.delete('/quizzes/:id', deleteQuizAdmin);
router.post('/quizzes/:id/import', validateBody(importPlainTextSchema), importQuestionsPlainTextAdmin);
router.get('/quizzes/:id/results', getQuizResultsAdmin);
router.get('/quizzes/:id/export', exportQuizResultsCSVAdmin);

// Course Assignments Management
router.get('/courses/:courseId/assignments', getAdminAssignmentsByCourse);
router.post('/courses/:courseId/assignments', validateBody(createAssignmentSchema), createAssignmentAdmin);

// Assignment Details, Edit, Submissions & Grading
router.get('/assignments/:id', getAssignmentByIdAdmin);
router.put('/assignments/:id', validateBody(updateAssignmentSchema), updateAssignmentAdmin);
router.delete('/assignments/:id', deleteAssignmentAdmin);
router.get('/assignments/:id/submissions', getAssignmentSubmissionsAdmin);
router.patch('/submissions/:id/grade', validateBody(gradeSubmissionSchema), gradeSubmissionAdmin);
router.get('/assignments/:id/export', exportAssignmentMarksCSVAdmin);

// Admin Telemetry & Aggregated Stats
router.get('/stats', getAdminStats);

// Course Announcements Management
router.get('/courses/:courseId/announcements', getAdminAnnouncementsByCourse);
router.post(
  '/courses/:courseId/announcements',
  validateBody(createAnnouncementSchema),
  createAnnouncementAdmin
);
router.put(
  '/announcements/:id',
  validateBody(updateAnnouncementSchema),
  updateAnnouncementAdmin
);
router.delete('/announcements/:id', deleteAnnouncementAdmin);

// Student Management & Private Notes
router.get('/students', getAdminStudents);
router.get('/students/:id', getAdminStudentById);
router.patch(
  '/students/:id/status',
  validateBody(updateStudentStatusSchema),
  updateStudentStatusAdmin
);
router.put(
  '/students/:id/notes',
  validateBody(updateStudentNotesSchema),
  updateStudentNotesAdmin
);

// Cohort Gradebook & CSV Export
router.get('/courses/:courseId/gradebook', getCourseGradebookAdmin);
router.get('/courses/:courseId/gradebook/export', exportCourseGradebookCSVAdmin);

// Enrollment Management
router.get('/enrollments', getAdminEnrollments);
router.get('/enrollments/pending-count', getPendingEnrollmentCount);
router.patch('/enrollments/:id', validateBody(adminReviewEnrollmentSchema), reviewEnrollment);

// Settings Management
router.get('/settings', getAdminSettings);
router.put('/settings', validateBody(updateSettingsSchema), updateAdminSettings);

// Contact Inquiries Management
router.get('/messages', getAdminMessages);
router.patch('/messages/:id', validateBody(updateContactMessageSchema), updateMessageStatus);
router.delete('/messages/:id', deleteContactMessage);

export default router;
