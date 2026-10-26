import User from '../models/user.model.js';
import Enrollment from '../models/enrollment.model.js';
import Session from '../models/session.model.js';
import Submission from '../models/submission.model.js';
import Attendance from '../models/attendance.model.js';
import QuizAttempt from '../models/quizAttempt.model.js';
import Course from '../models/course.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

/**
 * GET /api/admin/stats
 * Real-time aggregated bootcamp telemetry using native MongoDB aggregations
 */
export const getAdminStats = asyncHandler(async (req, res) => {
  const now = new Date();

  // 1. Students Telemetry (total, active)
  const studentStats = await User.aggregate([
    { $match: { role: 'student' } },
    {
      $group: {
        _id: null,
        totalStudents: { $sum: 1 },
        activeStudents: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
        },
      },
    },
  ]);

  const totalStudents = studentStats[0]?.totalStudents || 0;
  const activeStudents = studentStats[0]?.activeStudents || 0;

  // 2. Enrollment Status & Revenue Aggregation
  const enrollmentStats = await Enrollment.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmountPaid: { $sum: '$amountPaid' },
      },
    },
  ]);

  let pendingEnrollments = 0;
  let approvedEnrollments = 0;
  let totalRevenueCollected = 0;

  enrollmentStats.forEach((st) => {
    if (st._id === 'pending') pendingEnrollments = st.count;
    if (st._id === 'approved') {
      approvedEnrollments = st.count;
      totalRevenueCollected = st.totalAmountPaid || 0;
    }
  });

  // 3. Upcoming Live Sessions Count
  const upcomingSessionsCount = await Session.countDocuments({
    scheduledAt: { $gte: now },
    status: { $ne: 'cancelled' },
  });

  // 4. Submissions Waiting for Grading
  const submissionsWaitingGrading = await Submission.countDocuments({
    status: { $in: ['submitted', 'late'] },
  });

  // 5. Average Cohort Attendance Rate %
  const attendanceAgg = await Attendance.aggregate([
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        attendedRecords: {
          $sum: {
            $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0],
          },
        },
      },
    },
  ]);

  const totalAttendanceRecords = attendanceAgg[0]?.totalRecords || 0;
  const attendedCount = attendanceAgg[0]?.attendedRecords || 0;
  const averageAttendancePercent = totalAttendanceRecords > 0
    ? Math.round((attendedCount / totalAttendanceRecords) * 100)
    : 100;

  // 6. Average Quiz Passing / Score %
  const quizAgg = await QuizAttempt.aggregate([
    {
      $match: {
        status: { $in: ['submitted', 'auto_submitted'] },
      },
    },
    {
      $group: {
        _id: null,
        avgScore: { $avg: '$percent' },
        totalAttempts: { $sum: 1 },
      },
    },
  ]);

  const averageQuizPercent = quizAgg[0]?.avgScore !== undefined
    ? Math.round(quizAgg[0].avgScore)
    : 0;

  // 7. Needs Attention Lists
  // 7a. Pending Enrollments awaiting verification (up to 5)
  const pendingEnrollmentItems = await Enrollment.find({ status: 'pending' })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('student', 'name email phone')
    .populate('course', 'title fee');

  // 7b. Ungraded Submissions (up to 5)
  const ungradedSubmissionItems = await Submission.find({
    status: { $in: ['submitted', 'late'] },
  })
    .sort({ submittedAt: 1 }) // oldest first for fair turnaround
    .limit(5)
    .populate('student', 'name email')
    .populate('assignment', 'title maxMarks week')
    .populate('course', 'title');

  // 7c. Today's Sessions
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const todaySessionItems = await Session.find({
    scheduledAt: { $gte: startOfDay, $lte: endOfDay },
    status: { $ne: 'cancelled' },
  })
    .sort({ scheduledAt: 1 })
    .populate('course', 'title');

  // 8. Attendance Trend (last 6 completed sessions with attendance rate)
  const recentSessions = await Session.find({
    status: 'completed',
  })
    .sort({ scheduledAt: -1 })
    .limit(6)
    .populate('course', 'title');

  const attendanceTrend = await Promise.all(
    recentSessions.reverse().map(async (sess) => {
      const records = await Attendance.find({ session: sess._id });
      const total = records.length;
      const attended = records.filter((r) => r.status === 'present' || r.status === 'late').length;
      const rate = total > 0 ? Math.round((attended / total) * 100) : 0;

      return {
        sessionId: sess._id,
        title: sess.title,
        courseTitle: sess.course?.title || '',
        scheduledAt: sess.scheduledAt,
        rate,
        attended,
        total,
      };
    })
  );

  return sendSuccess(res, {
    data: {
      stats: {
        totalStudents,
        activeStudents,
        pendingEnrollments,
        approvedEnrollments,
        totalRevenueCollected,
        upcomingSessionsCount,
        submissionsWaitingGrading,
        averageAttendancePercent,
        averageQuizPercent,
      },
      needsAttention: {
        pendingEnrollments: pendingEnrollmentItems,
        ungradedSubmissions: ungradedSubmissionItems,
        todaySessions: todaySessionItems,
      },
      attendanceTrend,
    },
  });
});

export default {
  getAdminStats,
};
