import Enrollment from '../models/enrollment.model.js';
import Session from '../models/session.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Middleware: requireApprovedEnrollment
 * Enforces that non-admin callers have an approved enrollment for the target course.
 * Handles both courseId in params/query and session lookup via sessionId.
 */
export const requireApprovedEnrollment = asyncHandler(async (req, res, next) => {
  // Admin role automatically bypasses enrollment checks
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  let courseId = req.params.courseId || req.query.courseId || req.body?.courseId;

  // If courseId is not directly in params, check if route operates on a session (e.g. /api/sessions/:id/join)
  if (!courseId && req.params.id) {
    const session = await Session.findById(req.params.id).select('course');
    if (session) {
      courseId = session.course;
      req.sessionInstance = session; // Attach for controller reuse
    }
  }

  if (!courseId) {
    throw ApiError.badRequest('Course identifier is required to verify enrollment.', 'MISSING_COURSE_ID');
  }

  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
    status: 'approved',
  });

  if (!enrollment) {
    throw ApiError.forbidden(
      'Access denied. An approved tuition enrollment is required to view live sessions and classroom materials.',
      'ENROLLMENT_REQUIRED'
    );
  }

  req.enrollment = enrollment;
  req.courseId = courseId;
  next();
});

export default requireApprovedEnrollment;
