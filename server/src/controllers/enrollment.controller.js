import Enrollment from '../models/enrollment.model.js';
import Course from '../models/course.model.js';
import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, formatPagination } from '../utils/response.js';

// Student: POST /api/enrollments
export const createEnrollment = asyncHandler(async (req, res) => {
  const {
    courseId,
    paymentMethod,
    transactionId,
    senderName,
    senderNumber,
    paymentNote,
  } = req.body;

  // 1. Verify course exists and is published
  const course = await Course.findById(courseId);
  if (!course || !course.isPublished) {
    throw ApiError.notFound('Bootcamp course not found or is currently unavailable.', 'COURSE_NOT_FOUND');
  }

  // 2. Check if enrollment is open
  if (!course.isEnrollmentOpen) {
    throw ApiError.badRequest('Admissions for this cohort are currently closed.', 'ENROLLMENT_CLOSED');
  }

  // 3. Check seat limit
  const approvedCount = await Enrollment.countDocuments({
    course: course._id,
    status: 'approved',
  });

  if (approvedCount >= course.seatsTotal) {
    throw ApiError.badRequest(
      'This cohort has reached maximum capacity. All seats are filled.',
      'COHORT_FULL'
    );
  }

  // 4. Check for existing active enrollment (pending or approved)
  const activeEnrollment = await Enrollment.findOne({
    student: req.user._id,
    course: course._id,
    status: { $in: ['pending', 'approved'] },
  });

  if (activeEnrollment) {
    throw ApiError.conflict(
      activeEnrollment.status === 'approved'
        ? 'You are already enrolled and approved in this course.'
        : 'You already have a pending enrollment request awaiting verification.',
      'DUPLICATE_ACTIVE_ENROLLMENT'
    );
  }

  // 5. If student previously had a rejected or cancelled enrollment, re-activate it
  const previousEnrollment = await Enrollment.findOne({
    student: req.user._id,
    course: course._id,
    status: { $in: ['rejected', 'cancelled'] },
  });

  let enrollment;

  if (previousEnrollment) {
    // Re-submit the rejected/cancelled enrollment with new payment details
    previousEnrollment.status = 'pending';
    previousEnrollment.amountDue = course.fee; // Server-enforced
    previousEnrollment.amountPaid = 0;
    previousEnrollment.paymentMethod = paymentMethod;
    previousEnrollment.transactionId = transactionId;
    previousEnrollment.senderName = senderName;
    previousEnrollment.senderNumber = senderNumber;
    previousEnrollment.paymentNote = paymentNote || '';
    previousEnrollment.adminNote = '';
    previousEnrollment.reviewedBy = null;
    previousEnrollment.reviewedAt = null;

    await previousEnrollment.save();
    enrollment = previousEnrollment;
  } else {
    // Create new enrollment
    enrollment = await Enrollment.create({
      student: req.user._id,
      course: course._id,
      status: 'pending',
      amountDue: course.fee, // SERVER ENFORCED: Never trust client amount
      amountPaid: 0,
      paymentMethod,
      transactionId,
      senderName,
      senderNumber,
      paymentNote: paymentNote || '',
    });
  }

  await enrollment.populate('course', 'title slug fee schedule startDate durationWeeks');

  return sendSuccess(res, {
    statusCode: 201,
    data: enrollment,
    message: 'Enrollment request submitted. The instructor will verify your payment details within 24 hours.',
  });
});

// Student: GET /api/enrollments/mine
export const getMyEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id })
    .populate('course', 'title slug fee schedule startDate durationWeeks level')
    .sort({ createdAt: -1 });

  return sendSuccess(res, {
    data: enrollments,
  });
});

// Student: GET /api/enrollments/:id
export const getEnrollmentById = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id)
    .populate('course', 'title slug fee schedule startDate durationWeeks')
    .populate('student', 'name email phone');

  if (!enrollment) {
    throw ApiError.notFound('Enrollment record not found.', 'ENROLLMENT_NOT_FOUND');
  }

  // Security check: only owner or admin can read this record
  const isOwner = enrollment.student._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden('You do not have permission to view this enrollment record.', 'FORBIDDEN');
  }

  return sendSuccess(res, {
    data: enrollment,
  });
});

// Student: PATCH /api/enrollments/:id/cancel
export const cancelMyEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id);

  if (!enrollment) {
    throw ApiError.notFound('Enrollment record not found.', 'ENROLLMENT_NOT_FOUND');
  }

  // Security: check ownership
  if (enrollment.student.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You can only cancel your own enrollment request.', 'FORBIDDEN');
  }

  // Can only cancel while pending
  if (enrollment.status !== 'pending') {
    throw ApiError.badRequest(
      `Cannot cancel enrollment with status '${enrollment.status}'. Only pending requests can be cancelled.`,
      'CANNOT_CANCEL'
    );
  }

  enrollment.status = 'cancelled';
  await enrollment.save();

  return sendSuccess(res, {
    data: enrollment,
    message: 'Enrollment request cancelled.',
  });
});

// Admin: GET /api/admin/enrollments
export const getAdminEnrollments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, course, search } = req.query;

  const query = {};

  if (status && status !== 'all') {
    query.status = status;
  }

  if (course) {
    query.course = course;
  }

  if (search) {
    // Find matching students or courses first
    const [matchingUsers, matchingCourses] = await Promise.all([
      User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      }).select('_id'),
      Course.find({
        title: { $regex: search, $options: 'i' },
      }).select('_id'),
    ]);

    const userIds = matchingUsers.map((u) => u._id);
    const courseIds = matchingCourses.map((c) => c._id);

    query.$or = [
      { student: { $in: userIds } },
      { course: { $in: courseIds } },
      { transactionId: { $regex: search, $options: 'i' } },
      { senderName: { $regex: search, $options: 'i' } },
      { senderNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    Enrollment.find(query)
      .populate('student', 'name email phone')
      .populate('course', 'title slug fee seatsTotal')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Enrollment.countDocuments(query),
  ]);

  return sendSuccess(res, {
    data: formatPagination({ items, total, page: pageNum, limit: limitNum }),
  });
});

// Admin: GET /api/admin/enrollments/pending-count
export const getPendingEnrollmentCount = asyncHandler(async (req, res) => {
  const count = await Enrollment.countDocuments({ status: 'pending' });

  return sendSuccess(res, {
    data: { count },
  });
});

// Admin: PATCH /api/admin/enrollments/:id
export const reviewEnrollment = asyncHandler(async (req, res) => {
  const { action, amountPaid, adminNote } = req.body;

  const enrollment = await Enrollment.findById(req.params.id)
    .populate('course', 'title seatsTotal fee')
    .populate('student', 'name email');

  if (!enrollment) {
    throw ApiError.notFound('Enrollment record not found.', 'ENROLLMENT_NOT_FOUND');
  }

  if (action === 'approve') {
    // Check seats limit
    const approvedCount = await Enrollment.countDocuments({
      course: enrollment.course._id,
      status: 'approved',
      _id: { $ne: enrollment._id },
    });

    if (approvedCount >= enrollment.course.seatsTotal) {
      throw ApiError.badRequest(
        `Cannot approve: The cohort has reached its capacity limit of ${enrollment.course.seatsTotal} seats.`,
        'SEATS_FULL'
      );
    }

    enrollment.status = 'approved';
    enrollment.amountPaid = amountPaid !== undefined ? amountPaid : enrollment.amountDue;
    enrollment.adminNote = adminNote || '';
    enrollment.reviewedBy = req.user._id;
    enrollment.reviewedAt = new Date();
  } else if (action === 'reject') {
    if (!adminNote || adminNote.trim().length === 0) {
      throw ApiError.badRequest('A reason (adminNote) is required when rejecting an enrollment.', 'NOTE_REQUIRED');
    }

    enrollment.status = 'rejected';
    enrollment.adminNote = adminNote;
    enrollment.reviewedBy = req.user._id;
    enrollment.reviewedAt = new Date();
  }

  await enrollment.save();

  return sendSuccess(res, {
    data: enrollment,
    message: `Enrollment successfully ${action === 'approve' ? 'approved' : 'rejected'}.`,
  });
});

export default {
  createEnrollment,
  getMyEnrollments,
  getEnrollmentById,
  cancelMyEnrollment,
  getAdminEnrollments,
  getPendingEnrollmentCount,
  reviewEnrollment,
};
