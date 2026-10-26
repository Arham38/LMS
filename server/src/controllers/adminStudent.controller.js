import User from '../models/user.model.js';
import Enrollment from '../models/enrollment.model.js';
import Attendance from '../models/attendance.model.js';
import QuizAttempt from '../models/quizAttempt.model.js';
import Submission from '../models/submission.model.js';
import Session from '../models/session.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, formatPagination } from '../utils/response.js';

/**
 * GET /api/admin/students
 * Paginated student directory with search and cohort filters
 */
export const getAdminStudents = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
  const skip = (page - 1) * limit;

  const { search, isActive, courseId } = req.query;

  const query = { role: 'student' };

  if (isActive !== undefined && isActive !== '') {
    query.isActive = isActive === 'true' || isActive === true;
  }

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }

  // If filtered by courseId, find students enrolled in that course
  if (courseId) {
    const enrollments = await Enrollment.find({
      course: courseId,
      status: 'approved',
    }).select('student');
    const studentIds = enrollments.map((e) => e.student);
    query._id = { $in: studentIds };
  }

  const [students, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-passwordResetToken -passwordResetExpires +privateNotes'),
    User.countDocuments(query),
  ]);

  // Aggregate summaries for each student
  const studentIds = students.map((s) => s._id);

  const [enrollmentCounts, attendanceStats] = await Promise.all([
    Enrollment.aggregate([
      { $match: { student: { $in: studentIds }, status: 'approved' } },
      { $group: { _id: '$student', count: { $sum: 1 } } },
    ]),
    Attendance.aggregate([
      { $match: { student: { $in: studentIds } } },
      {
        $group: {
          _id: '$student',
          totalSessions: { $sum: 1 },
          attended: {
            $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const enrollmentMap = new Map(enrollmentCounts.map((e) => [e._id.toString(), e.count]));
  const attendanceMap = new Map(
    attendanceStats.map((a) => [
      a._id.toString(),
      a.totalSessions > 0 ? Math.round((a.attended / a.totalSessions) * 100) : 100,
    ])
  );

  const items = students.map((student) => {
    const sId = student._id.toString();
    const studentObj = student.toObject();
    return {
      ...studentObj,
      approvedEnrollmentsCount: enrollmentMap.get(sId) || 0,
      attendancePercent: attendanceMap.get(sId) !== undefined ? attendanceMap.get(sId) : null,
    };
  });

  return sendSuccess(res, {
    data: {
      items,
      pagination: formatPagination(page, limit, total),
    },
  });
});

/**
 * GET /api/admin/students/:id
 * Full deep profile: contact info, enrollments, attendance, quizzes, submissions, private notes
 */
export const getAdminStudentById = asyncHandler(async (req, res) => {
  const student = await User.findOne({
    _id: req.params.id,
    role: 'student',
  }).select('-passwordResetToken -passwordResetExpires +privateNotes');

  if (!student) {
    throw ApiError.notFound('Student record not found.', 'STUDENT_NOT_FOUND');
  }

  // 1. Enrollments
  const enrollments = await Enrollment.find({ student: student._id })
    .sort({ createdAt: -1 })
    .populate('course', 'title slug fee schedule startDate durationWeeks');

  // 2. Attendance History
  const attendanceRecords = await Attendance.find({ student: student._id })
    .sort({ joinedAt: -1, createdAt: -1 })
    .populate('session', 'title week scheduledAt order')
    .populate('course', 'title');

  const totalClassesTracked = attendanceRecords.length;
  const attendedClassesCount = attendanceRecords.filter(
    (a) => a.status === 'present' || a.status === 'late'
  ).length;
  const overallAttendancePercent = totalClassesTracked > 0
    ? Math.round((attendedClassesCount / totalClassesTracked) * 100)
    : 100;

  // 3. Quiz Attempts
  const quizAttempts = await QuizAttempt.find({ student: student._id })
    .sort({ submittedAt: -1, startedAt: -1 })
    .populate('quiz', 'title passingPercent course')
    .populate('course', 'title');

  // 4. Homework Submissions
  const submissions = await Submission.find({ student: student._id })
    .sort({ submittedAt: -1 })
    .populate('assignment', 'title maxMarks week dueAt')
    .populate('course', 'title');

  return sendSuccess(res, {
    data: {
      student,
      enrollments,
      attendanceSummary: {
        totalClassesTracked,
        attendedClassesCount,
        overallAttendancePercent,
        records: attendanceRecords,
      },
      quizAttempts,
      submissions,
    },
  });
});

/**
 * PATCH /api/admin/students/:id/status
 * Activate or deactivate student account (Never self-deactivation)
 */
export const updateStudentStatusAdmin = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const targetId = req.params.id;

  if (targetId === req.user._id.toString()) {
    throw ApiError.badRequest('You cannot deactivate your own account.', 'CANNOT_DEACTIVATE_SELF');
  }

  const student = await User.findOne({ _id: targetId, role: 'student' });
  if (!student) {
    throw ApiError.notFound('Student record not found.', 'STUDENT_NOT_FOUND');
  }

  student.isActive = Boolean(isActive);
  await student.save();

  return sendSuccess(res, {
    data: student,
    message: `Student account has been ${student.isActive ? 'activated' : 'deactivated'}.`,
  });
});

/**
 * PUT /api/admin/students/:id/notes
 * Update private instructor notes for student
 */
export const updateStudentNotesAdmin = asyncHandler(async (req, res) => {
  const { privateNotes = '' } = req.body;

  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) {
    throw ApiError.notFound('Student record not found.', 'STUDENT_NOT_FOUND');
  }

  student.privateNotes = privateNotes;
  await student.save();

  return sendSuccess(res, {
    data: {
      _id: student._id,
      privateNotes: student.privateNotes,
    },
    message: 'Private student notes updated.',
  });
});

export default {
  getAdminStudents,
  getAdminStudentById,
  updateStudentStatusAdmin,
  updateStudentNotesAdmin,
};
