import User from '../models/user.model.js';
import Enrollment from '../models/enrollment.model.js';
import Course from '../models/course.model.js';
import Session from '../models/session.model.js';
import Attendance from '../models/attendance.model.js';
import Assignment from '../models/assignment.model.js';
import Submission from '../models/submission.model.js';
import Quiz from '../models/quiz.model.js';
import QuizAttempt from '../models/quizAttempt.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

/**
 * GET /api/admin/analytics
 * Deep-dive cohort engagement, attendance consistency, and academic milestones
 */
export const getAdminAnalytics = asyncHandler(async (req, res) => {
  const { courseId } = req.query;

  // 1. Student counts
  const studentStats = await User.aggregate([
    { $match: { role: 'student' } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
      },
    },
  ]);

  const totalStudents = studentStats[0]?.total || 0;
  const activeStudents = studentStats[0]?.active || 0;
  const activeRate = totalStudents > 0 ? Math.round((activeStudents / totalStudents) * 100) : 100;

  // 2. Attendance Analytics
  const attendanceMatch = {};
  if (courseId) attendanceMatch.course = courseId;

  const attendanceAgg = await Attendance.aggregate([
    { $match: attendanceMatch },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        presentCount: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        lateCount: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
        absentCount: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
      },
    },
  ]);

  const totalAttRecords = attendanceAgg[0]?.totalRecords || 0;
  const attendedCount = (attendanceAgg[0]?.presentCount || 0) + (attendanceAgg[0]?.lateCount || 0);
  const overallAttendancePercent = totalAttRecords > 0
    ? Math.round((attendedCount / totalAttRecords) * 100)
    : 100;

  // 3. Quiz Analytics
  const quizAttemptMatch = { status: { $in: ['submitted', 'auto_submitted'] } };
  const quizAgg = await QuizAttempt.aggregate([
    { $match: quizAttemptMatch },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        avgScorePercent: { $avg: '$percent' },
        passedCount: { $sum: { $cond: [{ $gte: ['$percent', 70] }, 1, 0] } },
      },
    },
  ]);

  const totalQuizAttempts = quizAgg[0]?.totalAttempts || 0;
  const avgQuizPercent = Math.round(quizAgg[0]?.avgScorePercent || 0);
  const quizPassRate = totalQuizAttempts > 0
    ? Math.round(((quizAgg[0]?.passedCount || 0) / totalQuizAttempts) * 100)
    : 0;

  // 4. Assignment Analytics
  const subAgg = await Submission.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  let totalSubmissions = 0;
  let gradedCount = 0;
  let lateSubmissions = 0;
  let onTimeSubmissions = 0;

  subAgg.forEach((s) => {
    totalSubmissions += s.count;
    if (s._id === 'graded') gradedCount += s.count;
    if (s._id === 'late') lateSubmissions += s.count;
    if (s._id === 'submitted') onTimeSubmissions += s.count;
  });

  const onTimeRate = totalSubmissions > 0
    ? Math.round(((totalSubmissions - lateSubmissions) / totalSubmissions) * 100)
    : 100;

  // 5. Per-Course Cohort Comparison Matrix
  const courses = await Course.find({}).sort({ createdAt: -1 });

  const courseComparison = await Promise.all(
    courses.map(async (c) => {
      // Approved enrolled students
      const enrolledCount = await Enrollment.countDocuments({
        course: c._id,
        status: 'approved',
      });

      // Course attendance rate
      const courseAtt = await Attendance.aggregate([
        { $match: { course: c._id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            attended: {
              $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] },
            },
          },
        },
      ]);
      const attRate = courseAtt[0]?.total > 0
        ? Math.round((courseAtt[0].attended / courseAtt[0].total) * 100)
        : 100;

      // Course quiz average
      const courseQuizzes = await Quiz.find({ course: c._id }).select('_id');
      const quizIds = courseQuizzes.map((q) => q._id);

      const courseQuizAgg = await QuizAttempt.aggregate([
        {
          $match: {
            quiz: { $in: quizIds },
            status: { $in: ['submitted', 'auto_submitted'] },
          },
        },
        {
          $group: {
            _id: null,
            avg: { $avg: '$percent' },
            attempts: { $sum: 1 },
          },
        },
      ]);
      const quizAvg = Math.round(courseQuizAgg[0]?.avg || 0);

      // Course assignments
      const courseAssignments = await Assignment.find({ course: c._id }).select('_id');
      const assignmentIds = courseAssignments.map((a) => a._id);
      const submissionCount = await Submission.countDocuments({
        assignment: { $in: assignmentIds },
      });

      return {
        courseId: c._id,
        title: c.title,
        level: c.level,
        durationWeeks: c.durationWeeks,
        seatsTotal: c.seatsTotal,
        enrolledCount,
        attendanceRate: attRate,
        quizAvgPercent: quizAvg,
        submissionsCount: submissionCount,
        assignmentsCount: courseAssignments.length,
      };
    })
  );

  // 6. Recent Session Turnout Trend (last 10 sessions)
  const recentSessions = await Session.find({
    status: { $in: ['completed', 'live'] },
  })
    .sort({ scheduledAt: -1 })
    .limit(10)
    .populate('course', 'title');

  const sessionTrajectory = await Promise.all(
    recentSessions.reverse().map(async (sess) => {
      const records = await Attendance.find({ session: sess._id });
      const total = records.length;
      const attended = records.filter((r) => r.status === 'present' || r.status === 'late').length;
      const rate = total > 0 ? Math.round((attended / total) * 100) : 0;

      return {
        sessionId: sess._id,
        title: sess.title,
        courseTitle: sess.course?.title || '',
        week: sess.week,
        scheduledAt: sess.scheduledAt,
        attended,
        total,
        rate,
      };
    })
  );

  // 7. Student Assessment Grade Distribution
  // Distribution across quiz percent buckets
  const gradeDistribution = await QuizAttempt.aggregate([
    { $match: { status: { $in: ['submitted', 'auto_submitted'] } } },
    {
      $bucket: {
        groupBy: '$percent',
        boundaries: [0, 50, 70, 85, 101],
        default: 'other',
        output: {
          count: { $sum: 1 },
        },
      },
    },
  ]);

  const distributionFormatted = [
    { label: 'Distinction (85-100%)', count: 0, key: '85' },
    { label: 'Proficient (70-84%)', count: 0, key: '70' },
    { label: 'Passing Baseline (50-69%)', count: 0, key: '50' },
    { label: 'Needs Support (<50%)', count: 0, key: '0' },
  ];

  gradeDistribution.forEach((b) => {
    if (b._id === 85) distributionFormatted[0].count = b.count;
    if (b._id === 70) distributionFormatted[1].count = b.count;
    if (b._id === 50) distributionFormatted[2].count = b.count;
    if (b._id === 0) distributionFormatted[3].count = b.count;
  });

  return sendSuccess(res, {
    data: {
      telemetry: {
        totalStudents,
        activeStudents,
        activeRate,
        overallAttendancePercent,
        avgQuizPercent,
        quizPassRate,
        totalQuizAttempts,
        onTimeRate,
        totalSubmissions,
        gradedCount,
      },
      courseComparison,
      sessionTrajectory,
      gradeDistribution: distributionFormatted,
    },
  });
});

export default {
  getAdminAnalytics,
};
