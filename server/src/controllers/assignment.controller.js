import Assignment from '../models/assignment.model.js';
import Submission from '../models/submission.model.js';
import Course from '../models/course.model.js';
import Enrollment from '../models/enrollment.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import notificationService from '../services/notification.service.js';

// ==========================================
// ADMIN ASSIGNMENT CONTROLLERS
// ==========================================

/**
 * GET /api/admin/courses/:courseId/assignments
 * List all assignments for a course with submission statistics
 */
export const getAdminAssignmentsByCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId);
  if (!course) {
    throw ApiError.notFound('Bootcamp course not found.', 'COURSE_NOT_FOUND');
  }

  const assignments = await Assignment.find({ course: courseId }).sort({ week: 1, dueAt: 1 });
  const assignmentIds = assignments.map((a) => a._id);

  const totalEnrolled = await Enrollment.countDocuments({
    course: courseId,
    status: 'approved',
  });

  // Aggregate submissions per assignment
  const submissionStats = await Submission.aggregate([
    { $match: { assignment: { $in: assignmentIds } } },
    {
      $group: {
        _id: '$assignment',
        totalSubmitted: { $sum: 1 },
        gradedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'graded'] }, 1, 0] },
        },
        lateCount: {
          $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] },
        },
        avgMarks: { $avg: '$finalMarks' },
      },
    },
  ]);

  const statsMap = new Map();
  submissionStats.forEach((st) => {
    statsMap.set(st._id.toString(), {
      totalSubmitted: st.totalSubmitted,
      gradedCount: st.gradedCount,
      needsGradingCount: Math.max(0, st.totalSubmitted - st.gradedCount),
      lateCount: st.lateCount,
      avgMarks: st.avgMarks !== null ? Math.round(st.avgMarks) : null,
    });
  });

  const items = assignments.map((a) => {
    const aObj = a.toObject();
    const metrics = statsMap.get(a._id.toString()) || {
      totalSubmitted: 0,
      gradedCount: 0,
      needsGradingCount: 0,
      lateCount: 0,
      avgMarks: null,
    };

    return {
      ...aObj,
      totalEnrolled,
      metrics,
    };
  });

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
 * POST /api/admin/courses/:courseId/assignments
 * Create a new assignment with rubric and deadline
 */
export const createAssignmentAdmin = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const course = await Course.findById(courseId);
  if (!course) {
    throw ApiError.notFound('Bootcamp course not found.', 'COURSE_NOT_FOUND');
  }

  const assignment = await Assignment.create({
    ...req.body,
    course: courseId,
  });

  if (assignment.isPublished) {
    notificationService.notifyContentPublished({
      courseId,
      courseTitle: course.title,
      contentType: 'assignment',
      itemTitle: assignment.title,
    }).catch((err) => console.error('[Notification] Error creating assignment publish notice:', err.message));
  }

  return sendSuccess(res, {
    statusCode: 201,
    data: assignment,
    message: 'Assignment created successfully.',
  });
});

/**
 * GET /api/admin/assignments/:id
 * Retrieve assignment details
 */
export const getAssignmentByIdAdmin = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id).populate('course', 'title slug');
  if (!assignment) {
    throw ApiError.notFound('Assignment not found.', 'ASSIGNMENT_NOT_FOUND');
  }

  return sendSuccess(res, { data: assignment });
});

/**
 * PUT /api/admin/assignments/:id
 * Update assignment metadata and rubric
 */
export const updateAssignmentAdmin = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    throw ApiError.notFound('Assignment not found.', 'ASSIGNMENT_NOT_FOUND');
  }

  const allowedFields = [
    'week',
    'title',
    'description',
    'attachmentKey',
    'dueAt',
    'maxMarks',
    'submissionType',
    'allowLate',
    'latePenaltyPercent',
    'allowResubmit',
    'rubric',
    'isPublished',
    'session',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      assignment[field] = req.body[field];
    }
  });

  await assignment.save();

  return sendSuccess(res, {
    data: assignment,
    message: 'Assignment updated successfully.',
  });
});

/**
 * DELETE /api/admin/assignments/:id
 * Delete assignment and associated submissions
 */
export const deleteAssignmentAdmin = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    throw ApiError.notFound('Assignment not found.', 'ASSIGNMENT_NOT_FOUND');
  }

  await Submission.deleteMany({ assignment: assignment._id });
  await assignment.deleteOne();

  return sendSuccess(res, {
    message: 'Assignment and associated submissions deleted.',
  });
});

/**
 * GET /api/admin/assignments/:id/submissions
 * Get submissions per assignment with filters, INCLUDING students who have not submitted
 */
export const getAssignmentSubmissionsAdmin = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    throw ApiError.notFound('Assignment not found.', 'ASSIGNMENT_NOT_FOUND');
  }

  // 1. Fetch all approved students in this course
  const enrollments = await Enrollment.find({
    course: assignment.course,
    status: 'approved',
  }).populate('student', 'name email phone avatar');

  // 2. Fetch all existing submissions for this assignment
  const submissions = await Submission.find({ assignment: assignment._id }).populate(
    'gradedBy',
    'name email'
  );

  const submissionMap = new Map();
  submissions.forEach((sub) => {
    submissionMap.set(sub.student.toString(), sub);
  });

  // 3. Merge: every approved student gets a row (even if not submitted)
  let roster = enrollments.map((enr) => {
    const student = enr.student;
    const sId = student?._id?.toString();
    const sub = sId ? submissionMap.get(sId) : null;

    if (sub) {
      return {
        _id: sub._id,
        isRealSubmission: true,
        assignment: assignment._id,
        student: {
          _id: student._id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          avatar: student.avatar,
        },
        course: assignment.course,
        fileKey: sub.fileKey,
        link: sub.link,
        comment: sub.comment,
        version: sub.version,
        status: sub.status,
        marks: sub.marks,
        latePenaltyApplied: sub.latePenaltyApplied,
        finalMarks: sub.finalMarks,
        rubricMarks: sub.rubricMarks,
        feedback: sub.feedback,
        submittedAt: sub.submittedAt,
        gradedAt: sub.gradedAt,
        gradedBy: sub.gradedBy,
        history: sub.history || [],
      };
    }

    // Virtual item for student who has NOT submitted
    return {
      _id: `virtual_${student?._id}`,
      isRealSubmission: false,
      isVirtual: true,
      assignment: assignment._id,
      student: {
        _id: student?._id,
        name: student?.name || 'Unknown',
        email: student?.email || '',
        phone: student?.phone || '',
        avatar: student?.avatar,
      },
      course: assignment.course,
      fileKey: null,
      link: null,
      comment: '',
      version: 0,
      status: 'not_submitted',
      marks: null,
      latePenaltyApplied: 0,
      finalMarks: null,
      rubricMarks: [],
      feedback: '',
      submittedAt: null,
      gradedAt: null,
      gradedBy: null,
      history: [],
    };
  });

  // 4. Status Filter
  if (status) {
    if (status === 'needs_grading') {
      roster = roster.filter((r) => r.status === 'submitted' || r.status === 'late');
    } else {
      roster = roster.filter((r) => r.status === status);
    }
  }

  // 5. Search Filter
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    roster = roster.filter(
      (r) =>
        r.student?.name?.toLowerCase().includes(q) ||
        r.student?.email?.toLowerCase().includes(q)
    );
  }

  // Calculate summary counts
  const allMerged = enrollments.map((enr) => {
    const sId = enr.student?._id?.toString();
    return sId ? submissionMap.get(sId)?.status || 'not_submitted' : 'not_submitted';
  });

  const summary = {
    totalEnrolled: enrollments.length,
    submittedCount: allMerged.filter((s) => s === 'submitted').length,
    lateCount: allMerged.filter((s) => s === 'late').length,
    gradedCount: allMerged.filter((s) => s === 'graded').length,
    returnedCount: allMerged.filter((s) => s === 'returned').length,
    notSubmittedCount: allMerged.filter((s) => s === 'not_submitted').length,
  };

  return sendSuccess(res, {
    data: {
      assignment: {
        _id: assignment._id,
        title: assignment.title,
        week: assignment.week,
        dueAt: assignment.dueAt,
        maxMarks: assignment.maxMarks,
        allowLate: assignment.allowLate,
        latePenaltyPercent: assignment.latePenaltyPercent,
        allowResubmit: assignment.allowResubmit,
        rubric: assignment.rubric,
      },
      items: roster,
      total: roster.length,
      summary,
    },
  });
});

/**
 * PATCH /api/admin/submissions/:id/grade
 * Grade submission or return for resubmission.
 * Validates max marks and automatically deducts late penalty if late.
 */
export const gradeSubmissionAdmin = asyncHandler(async (req, res) => {
  const { marks, rubricMarks, feedback, action = 'grade' } = req.body;
  const submission = await Submission.findById(req.params.id);
  if (!submission) {
    throw ApiError.notFound('Submission not found.', 'SUBMISSION_NOT_FOUND');
  }

  const assignment = await Assignment.findById(submission.assignment);
  if (!assignment) {
    throw ApiError.notFound('Associated assignment not found.', 'ASSIGNMENT_NOT_FOUND');
  }

  const now = new Date();

  // Validate marks
  if (marks !== undefined && marks !== null) {
    if (marks < 0) {
      throw ApiError.badRequest('Marks cannot be negative.', 'INVALID_MARKS');
    }
    if (marks > assignment.maxMarks) {
      throw ApiError.badRequest(
        `Marks (${marks}) cannot exceed assignment maximum marks (${assignment.maxMarks}).`,
        'MARKS_EXCEED_MAX'
      );
    }
  }

  if (action === 'return') {
    // Return for resubmission
    submission.history.push({
      version: submission.version,
      fileKey: submission.fileKey,
      link: submission.link,
      comment: submission.comment,
      submittedAt: submission.submittedAt,
      marks: submission.marks,
      finalMarks: submission.finalMarks,
      feedback: feedback || submission.feedback,
      status: 'returned',
    });

    submission.status = 'returned';
    submission.feedback = feedback || '';
    submission.gradedAt = now;
    submission.gradedBy = req.user._id;

    await submission.save();

    return sendSuccess(res, {
      data: submission,
      message: 'Submission returned to student for revisions.',
    });
  }

  // Action is 'grade'
  const rawMarks = Number(marks);
  let latePenaltyApplied = 0;
  let finalMarks = rawMarks;

  // Compute late penalty deduction if submitted late
  if (submission.status === 'late' && assignment.latePenaltyPercent > 0) {
    latePenaltyApplied = Math.round((rawMarks * assignment.latePenaltyPercent) / 100);
    finalMarks = Math.max(0, rawMarks - latePenaltyApplied);
  }

  submission.marks = rawMarks;
  submission.latePenaltyApplied = latePenaltyApplied;
  submission.finalMarks = finalMarks;
  submission.rubricMarks = rubricMarks || [];
  submission.feedback = feedback || '';
  submission.status = 'graded';
  submission.gradedAt = now;
  submission.gradedBy = req.user._id;

  await submission.save();

  // Trigger Notification to student
  notificationService.notifyAssignmentGraded({
    studentId: submission.student,
    courseId: submission.course,
    assignmentTitle: assignment.title,
    action,
    marks: submission.finalMarks !== null ? submission.finalMarks : submission.marks,
    maxMarks: assignment.maxMarks,
    feedback: submission.feedback,
  }).catch((err) => console.error('[Notification] Error creating assignment graded notice:', err.message));

  return sendSuccess(res, {
    data: submission,
    message: 'Grade and feedback saved successfully.',
  });
});

/**
 * GET /api/admin/assignments/:id/export
 * Bulk CSV export of marks for all enrolled students
 */
export const exportAssignmentMarksCSVAdmin = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    throw ApiError.notFound('Assignment not found.', 'ASSIGNMENT_NOT_FOUND');
  }

  const enrollments = await Enrollment.find({
    course: assignment.course,
    status: 'approved',
  }).populate('student', 'name email phone');

  const submissions = await Submission.find({ assignment: assignment._id });
  const subMap = new Map();
  submissions.forEach((s) => subMap.set(s.student.toString(), s));

  const headers = [
    'Student Name',
    'Email',
    'Phone',
    'Submission Status',
    'Version',
    'Raw Marks',
    'Late Penalty Deducted',
    'Final Marks',
    'Max Marks',
    'Submitted At (UTC)',
    'Solution Link',
    'File Key',
    'Graded At (UTC)',
    'Instructor Feedback',
  ];

  const rows = enrollments.map((enr) => {
    const student = enr.student;
    const sId = student?._id?.toString();
    const sub = sId ? subMap.get(sId) : null;

    const studentName = student?.name ? `"${student.name.replace(/"/g, '""')}"` : 'Unknown';
    const email = student?.email || '';
    const phone = student?.phone || '';
    const status = sub ? sub.status.toUpperCase() : 'NOT SUBMITTED';
    const version = sub ? sub.version : 0;
    const rawMarks = sub?.marks !== null && sub?.marks !== undefined ? sub.marks : '';
    const penalty = sub ? sub.latePenaltyApplied : '';
    const finalMarks = sub?.finalMarks !== null && sub?.finalMarks !== undefined ? sub.finalMarks : '';
    const maxMarks = assignment.maxMarks;
    const submittedAt = sub?.submittedAt ? new Date(sub.submittedAt).toISOString() : '';
    const link = sub?.link ? `"${sub.link.replace(/"/g, '""')}"` : '';
    const fileKey = sub?.fileKey || '';
    const gradedAt = sub?.gradedAt ? new Date(sub.gradedAt).toISOString() : '';
    const feedback = sub?.feedback ? `"${sub.feedback.replace(/"/g, '""')}"` : '';

    return [
      studentName,
      email,
      phone,
      status,
      version,
      rawMarks,
      penalty,
      finalMarks,
      maxMarks,
      submittedAt,
      link,
      fileKey,
      gradedAt,
      feedback,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const safeFilename = assignment.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="assignment_${safeFilename}_marks.csv"`);
  return res.status(200).send(csvContent);
});

// ==========================================
// STUDENT ASSIGNMENT CONTROLLERS
// ==========================================

/**
 * GET /api/courses/:courseId/assignments
 * List assignments for course with student's own submission status and feedback
 */
export const getCourseAssignmentsStudent = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const assignments = await Assignment.find({
    course: courseId,
    isPublished: true,
  }).sort({ week: 1, dueAt: 1 });

  const assignmentIds = assignments.map((a) => a._id);

  // Fetch this student's submissions
  const submissions = await Submission.find({
    assignment: { $in: assignmentIds },
    student: req.user._id,
  });

  const subMap = new Map();
  submissions.forEach((s) => subMap.set(s.assignment.toString(), s));

  const now = new Date();

  const items = assignments.map((assignment) => {
    const aObj = assignment.toObject();
    const sub = subMap.get(assignment._id.toString()) || null;

    const isOverdue = now.getTime() > new Date(assignment.dueAt).getTime();
    const canSubmit = !isOverdue || assignment.allowLate;

    let studentStatus = 'not_submitted';
    if (sub) {
      studentStatus = sub.status;
    } else if (isOverdue && !assignment.allowLate) {
      studentStatus = 'closed';
    }

    return {
      ...aObj,
      status: studentStatus,
      studentStatus,
      isOverdue,
      canSubmit,
      mySubmission: sub
        ? {
            _id: sub._id,
            version: sub.version,
            status: sub.status,
            fileKey: sub.fileKey,
            link: sub.link,
            comment: sub.comment,
            marks: sub.marks,
            latePenaltyApplied: sub.latePenaltyApplied,
            finalMarks: sub.finalMarks,
            feedback: sub.feedback,
            rubricMarks: sub.rubricMarks,
            submittedAt: sub.submittedAt,
            gradedAt: sub.gradedAt,
          }
        : null,
    };
  });

  return sendSuccess(res, {
    data: {
      items,
      total: items.length,
    },
  });
});

/**
 * POST /api/assignments/:id/submit
 * Submit or resubmit homework solution
 */
export const submitSolutionStudent = asyncHandler(async (req, res) => {
  const { fileKey, link, comment } = req.body;
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment || !assignment.isPublished) {
    throw ApiError.notFound('Assignment not found or unavailable.', 'ASSIGNMENT_NOT_FOUND');
  }

  // Validate submission type
  if (assignment.submissionType === 'file' && !fileKey) {
    throw ApiError.badRequest('A file upload is required for this assignment.', 'FILE_REQUIRED');
  }
  if (assignment.submissionType === 'link' && !link) {
    throw ApiError.badRequest('A repository or project URL link is required.', 'LINK_REQUIRED');
  }
  if (assignment.submissionType === 'either' && !fileKey && !link) {
    throw ApiError.badRequest('Please upload a file or provide a project link.', 'SUBMISSION_EMPTY');
  }

  const now = new Date();
  const isLate = now.getTime() > new Date(assignment.dueAt).getTime();

  // Enforce late policy
  if (isLate && !assignment.allowLate) {
    throw ApiError.badRequest(
      'Deadline has passed and late submissions are blocked for this assignment.',
      'LATE_SUBMISSIONS_BLOCKED'
    );
  }

  const status = isLate ? 'late' : 'submitted';

  // Check if student already has a submission
  let submission = await Submission.findOne({
    assignment: assignment._id,
    student: req.user._id,
  });

  if (submission) {
    // Check resubmission permissions
    if (submission.status === 'graded') {
      throw ApiError.badRequest(
        'This assignment has already been graded and cannot be resubmitted.',
        'ALREADY_GRADED'
      );
    }
    if (!assignment.allowResubmit && submission.status !== 'returned') {
      throw ApiError.badRequest(
        'Resubmission is not enabled for this assignment.',
        'RESUBMISSION_NOT_ALLOWED'
      );
    }

    // Save previous revision to history
    submission.history.push({
      version: submission.version,
      fileKey: submission.fileKey,
      link: submission.link,
      comment: submission.comment,
      submittedAt: submission.submittedAt,
      marks: submission.marks,
      finalMarks: submission.finalMarks,
      feedback: submission.feedback,
      status: submission.status,
    });

    submission.version += 1;
    submission.fileKey = fileKey || null;
    submission.link = link || null;
    submission.comment = comment || '';
    submission.status = status;
    submission.submittedAt = now;
    submission.marks = null;
    submission.latePenaltyApplied = 0;
    submission.finalMarks = null;
    submission.feedback = '';
    submission.gradedAt = null;
    submission.gradedBy = null;

    await submission.save();

    return sendSuccess(res, {
      data: submission,
      message: isLate
        ? `Revision ${submission.version} submitted (marked LATE per course deadline).`
        : `Revision ${submission.version} submitted successfully.`,
    });
  }

  // Create new submission
  submission = await Submission.create({
    assignment: assignment._id,
    student: req.user._id,
    course: assignment.course,
    fileKey: fileKey || null,
    link: link || null,
    comment: comment || '',
    version: 1,
    status,
    submittedAt: now,
  });

  return sendSuccess(res, {
    statusCode: 201,
    data: submission,
    message: isLate
      ? 'Solution submitted (marked LATE per course deadline).'
      : 'Solution submitted successfully.',
  });
});

/**
 * GET /api/assignments/:id/my-submission
 * Retrieve student's own submission with marks, late penalty, feedback, and history
 */
export const getMySubmissionStudent = asyncHandler(async (req, res) => {
  const submission = await Submission.findOne({
    assignment: req.params.id,
    student: req.user._id,
  });

  if (!submission) {
    return sendSuccess(res, { data: null });
  }

  return sendSuccess(res, { data: submission });
});

export default {
  getAdminAssignmentsByCourse,
  createAssignmentAdmin,
  getAssignmentByIdAdmin,
  updateAssignmentAdmin,
  deleteAssignmentAdmin,
  getAssignmentSubmissionsAdmin,
  gradeSubmissionAdmin,
  exportAssignmentMarksCSVAdmin,
  getCourseAssignmentsStudent,
  submitSolutionStudent,
  getMySubmissionStudent,
};
