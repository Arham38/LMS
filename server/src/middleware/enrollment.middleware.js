import Enrollment from '../models/enrollment.model.js';
import Session from '../models/session.model.js';
import Quiz from '../models/quiz.model.js';
import QuizAttempt from '../models/quizAttempt.model.js';
import Assignment from '../models/assignment.model.js';
import Submission from '../models/submission.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Middleware: requireApprovedEnrollment
 * Enforces that non-admin callers have an approved enrollment for the target course.
 * Handles courseId in params/query/body, and lookups via sessionId, quizId, attemptId, assignmentId, or submissionId.
 */
export const requireApprovedEnrollment = asyncHandler(async (req, res, next) => {
  // Admin role automatically bypasses enrollment checks
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  let courseId = req.params.courseId || req.query.courseId || req.body?.courseId;

  // If courseId is not directly provided, inspect req.params.id across entities
  if (!courseId && req.params.id) {
    // 1. Check Session
    const session = await Session.findById(req.params.id).select('course');
    if (session) {
      courseId = session.course;
      req.sessionInstance = session;
    } else {
      // 2. Check Quiz
      const quiz = await Quiz.findById(req.params.id).select('course');
      if (quiz) {
        courseId = quiz.course;
        req.quizInstance = quiz;
      } else {
        // 3. Check QuizAttempt
        const attempt = await QuizAttempt.findById(req.params.id).populate('quiz', 'course');
        if (attempt && attempt.quiz) {
          courseId = attempt.quiz.course;
          req.attemptInstance = attempt;
        } else {
          // 4. Check Assignment
          const assignment = await Assignment.findById(req.params.id).select('course');
          if (assignment) {
            courseId = assignment.course;
            req.assignmentInstance = assignment;
          } else {
            // 5. Check Submission
            const submission = await Submission.findById(req.params.id).select('course');
            if (submission) {
              courseId = submission.course;
              req.submissionInstance = submission;
            }
          }
        }
      }
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
      'Access denied. An approved tuition enrollment is required to view classroom materials, live sessions, quizzes, and assignments.',
      'ENROLLMENT_REQUIRED'
    );
  }

  req.enrollment = enrollment;
  req.courseId = courseId;
  next();
});

export default requireApprovedEnrollment;
