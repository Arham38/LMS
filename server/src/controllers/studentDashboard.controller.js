import Enrollment from '../models/enrollment.model.js';
import Session from '../models/session.model.js';
import Attendance from '../models/attendance.model.js';
import Assignment from '../models/assignment.model.js';
import Submission from '../models/submission.model.js';
import Quiz from '../models/quiz.model.js';
import QuizAttempt from '../models/quizAttempt.model.js';
import Announcement from '../models/announcement.model.js';
import Course from '../models/course.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

/**
 * GET /api/student/dashboard
 * Aggregates personalized learning telemetry, next live lecture, deadlines, and recent grades
 */
export const getStudentDashboard = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const now = new Date();

  // 1. Get approved enrollments
  const enrollments = await Enrollment.find({
    student: studentId,
    status: 'approved',
  }).populate('course', 'title slug tagline level durationWeeks schedule startDate');

  const courseIds = enrollments.map((enr) => enr.course?._id).filter(Boolean);

  if (courseIds.length === 0) {
    return sendSuccess(res, {
      data: {
        enrolledCourses: [],
        nextSession: null,
        upcomingDeadlines: [],
        latestGrades: [],
        latestAnnouncements: [],
      },
    });
  }

  // 2. Compute course attendance & completion progress per course
  const enrolledCourses = await Promise.all(
    enrollments.map(async (enr) => {
      const course = enr.course;
      const cId = course._id;

      const totalSessions = await Session.countDocuments({
        course: cId,
        status: { $ne: 'cancelled' },
      });

      const completedSessions = await Session.countDocuments({
        course: cId,
        status: 'completed',
      });

      const myAttendanceRecords = await Attendance.find({
        student: studentId,
        course: cId,
        status: { $in: ['present', 'late'] },
      });

      const attendedCount = myAttendanceRecords.length;
      const attendancePercent = completedSessions > 0
        ? Math.round((attendedCount / completedSessions) * 100)
        : 100;

      // Quizzes completed in this course
      const courseQuizzes = await Quiz.find({ course: cId, isPublished: true });
      const completedQuizAttempts = await QuizAttempt.find({
        student: studentId,
        quiz: { $in: courseQuizzes.map((q) => q._id) },
        status: { $in: ['submitted', 'auto_submitted'] },
      });

      // Assignments submitted in this course
      const courseAssignments = await Assignment.find({ course: cId, isPublished: true });
      const mySubmissions = await Submission.find({
        student: studentId,
        assignment: { $in: courseAssignments.map((a) => a._id) },
      });

      return {
        _id: course._id,
        title: course.title,
        slug: course.slug,
        schedule: course.schedule,
        attendancePercent,
        attendedCount,
        completedSessions,
        totalSessions,
        quizzesDone: completedQuizAttempts.length,
        totalQuizzes: courseQuizzes.length,
        assignmentsDone: mySubmissions.length,
        totalAssignments: courseAssignments.length,
      };
    })
  );

  // 3. Find Next Live Session across all enrolled courses
  // Next session is either currently live / inside join window or upcoming chronologically
  const nextSession = await Session.findOne({
    course: { $in: courseIds },
    scheduledAt: { $gte: new Date(now.getTime() - 2 * 60 * 60 * 1000) }, // started in last 2 hours or in the future
    status: { $in: ['upcoming', 'live'] },
  })
    .sort({ scheduledAt: 1 })
    .populate('course', 'title slug');

  let nextSessionPayload = null;
  if (nextSession) {
    const scheduledTime = new Date(nextSession.scheduledAt).getTime();
    const durationMs = (nextSession.durationMinutes || 90) * 60 * 1000;
    const windowStart = scheduledTime - 15 * 60 * 1000;
    const windowEnd = scheduledTime + durationMs + 30 * 60 * 1000;
    const canJoinNow = now.getTime() >= windowStart && now.getTime() <= windowEnd;

    nextSessionPayload = {
      _id: nextSession._id,
      title: nextSession.title,
      scheduledAt: nextSession.scheduledAt,
      durationMinutes: nextSession.durationMinutes,
      status: nextSession.status,
      course: nextSession.course,
      canJoinNow,
    };
  }

  // 4. Upcoming Deadlines (Assignments and Quizzes)
  // 4a. Assignments not yet submitted or unclosed
  const pendingAssignments = await Assignment.find({
    course: { $in: courseIds },
    isPublished: true,
    dueAt: { $gte: now },
  })
    .sort({ dueAt: 1 })
    .limit(6)
    .populate('course', 'title');

  const assignmentDeadlines = await Promise.all(
    pendingAssignments.map(async (a) => {
      const sub = await Submission.findOne({ assignment: a._id, student: studentId });
      return {
        type: 'assignment',
        _id: a._id,
        title: a.title,
        courseTitle: a.course?.title || '',
        dueAt: a.dueAt,
        maxMarks: a.maxMarks,
        isSubmitted: Boolean(sub),
        status: sub ? sub.status : 'not_submitted',
        link: `/student/courses/${a.course?._id}`,
      };
    })
  );

  // 4b. Quizzes currently open
  const openQuizzes = await Quiz.find({
    course: { $in: courseIds },
    isPublished: true,
    $or: [{ closesAt: null }, { closesAt: { $gte: now } }],
  })
    .sort({ closesAt: 1 })
    .limit(4)
    .populate('course', 'title');

  const quizDeadlines = await Promise.all(
    openQuizzes.map(async (q) => {
      const attempt = await QuizAttempt.findOne({
        quiz: q._id,
        student: studentId,
        status: { $in: ['submitted', 'auto_submitted'] },
      });

      return {
        type: 'quiz',
        _id: q._id,
        title: q.title,
        courseTitle: q.course?.title || '',
        dueAt: q.closesAt || null,
        maxMarks: q.questions?.length || 0,
        isSubmitted: Boolean(attempt),
        status: attempt ? 'completed' : 'open',
        link: `/student/quizzes/${q._id}`,
      };
    })
  );

  // Merge and sort deadlines chronologically
  const upcomingDeadlines = [...assignmentDeadlines, ...quizDeadlines]
    .filter((d) => !d.isSubmitted)
    .sort((a, b) => {
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
    })
    .slice(0, 5);

  // 5. Latest Grades (Recent graded submissions and quiz attempts)
  const recentSubmissions = await Submission.find({
    student: studentId,
    status: 'graded',
  })
    .sort({ gradedAt: -1 })
    .limit(3)
    .populate('assignment', 'title maxMarks')
    .populate('course', 'title');

  const recentQuizAttempts = await QuizAttempt.find({
    student: studentId,
    status: { $in: ['submitted', 'auto_submitted'] },
  })
    .sort({ submittedAt: -1 })
    .limit(3)
    .populate('quiz', 'title')
    .populate('course', 'title');

  const latestGrades = [
    ...recentSubmissions.map((s) => ({
      kind: 'assignment',
      title: s.assignment?.title || 'Assignment',
      courseTitle: s.course?.title || '',
      score: s.finalMarks !== null ? s.finalMarks : s.marks,
      maxMarks: s.assignment?.maxMarks || 100,
      feedback: s.feedback,
      date: s.gradedAt,
    })),
    ...recentQuizAttempts.map((q) => ({
      kind: 'quiz',
      title: q.quiz?.title || 'Quiz',
      courseTitle: q.course?.title || '',
      score: q.score,
      maxMarks: q.totalMarks,
      percent: q.percent,
      date: q.submittedAt,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  // 6. Latest Announcements across all enrolled courses
  const latestAnnouncements = await Announcement.find({
    course: { $in: courseIds },
  })
    .sort({ pinned: -1, createdAt: -1 })
    .limit(5)
    .populate('course', 'title')
    .populate('createdBy', 'name');

  return sendSuccess(res, {
    data: {
      enrolledCourses,
      nextSession: nextSessionPayload,
      upcomingDeadlines,
      latestGrades,
      latestAnnouncements,
    },
  });
});

export default {
  getStudentDashboard,
};
