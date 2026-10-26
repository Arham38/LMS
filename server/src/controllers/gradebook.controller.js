import Course from '../models/course.model.js';
import Enrollment from '../models/enrollment.model.js';
import Session from '../models/session.model.js';
import Attendance from '../models/attendance.model.js';
import Quiz from '../models/quiz.model.js';
import QuizAttempt from '../models/quizAttempt.model.js';
import Assignment from '../models/assignment.model.js';
import Submission from '../models/submission.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

/**
 * Internal helper to build student gradebook rows
 */
async function buildCourseGradebookData(courseId) {
  const course = await Course.findById(courseId);
  if (!course) {
    throw ApiError.notFound('Course not found.', 'COURSE_NOT_FOUND');
  }

  const weights = course.gradeWeights || { attendance: 20, quizzes: 40, assignments: 40 };
  const totalWeight = (weights.attendance || 0) + (weights.quizzes || 0) + (weights.assignments || 0) || 100;
  const attendanceWeight = weights.attendance || 0;
  const quizzesWeight = weights.quizzes || 0;
  const assignmentsWeight = weights.assignments || 0;

  // 1. Approved enrollments
  const enrollments = await Enrollment.find({ course: courseId, status: 'approved' })
    .populate('student', 'name email phone avatar')
    .sort({ 'student.name': 1 });

  const studentIds = enrollments.map((e) => e.student?._id).filter(Boolean);

  // 2. Completed Sessions
  const completedSessions = await Session.find({ course: courseId, status: 'completed' }).sort({ order: 1 });
  const completedSessionCount = completedSessions.length;

  // 3. Quizzes & Assignments
  const quizzes = await Quiz.find({ course: courseId, isPublished: true }).sort({ week: 1, createdAt: 1 });
  const assignments = await Assignment.find({ course: courseId, isPublished: true }).sort({ week: 1, dueAt: 1 });

  // 4. Batch fetch telemetry records
  const [attendanceRecords, quizAttempts, submissions] = await Promise.all([
    Attendance.find({
      course: courseId,
      student: { $in: studentIds },
      status: { $in: ['present', 'late'] },
    }),
    QuizAttempt.find({
      student: { $in: studentIds },
      quiz: { $in: quizzes.map((q) => q._id) },
      status: { $in: ['submitted', 'auto_submitted'] },
    }).sort({ percent: -1 }), // highest attempt first
    Submission.find({
      course: courseId,
      student: { $in: studentIds },
      assignment: { $in: assignments.map((a) => a._id) },
    }),
  ]);

  // Index telemetry for O(1) row assembly
  // Student -> Set of session IDs attended
  const attendanceMap = new Map();
  attendanceRecords.forEach((att) => {
    const sId = att.student.toString();
    if (!attendanceMap.has(sId)) attendanceMap.set(sId, new Set());
    attendanceMap.get(sId).add(att.session.toString());
  });

  // (studentId + quizId) -> best attempt
  const quizMap = new Map();
  quizAttempts.forEach((qa) => {
    const key = `${qa.student.toString()}_${qa.quiz.toString()}`;
    if (!quizMap.has(key)) {
      quizMap.set(key, qa);
    }
  });

  // (studentId + assignmentId) -> submission
  const subMap = new Map();
  submissions.forEach((sub) => {
    const key = `${sub.student.toString()}_${sub.assignment.toString()}`;
    subMap.set(key, sub);
  });

  // Assemble Student Matrix Rows
  const studentRows = enrollments.map((enr) => {
    const student = enr.student;
    const sId = student?._id?.toString();

    // A. Attendance
    const attendedSet = attendanceMap.get(sId) || new Set();
    const attendedCount = attendedSet.size;
    const attendancePercent = completedSessionCount > 0
      ? Math.round((attendedCount / completedSessionCount) * 100)
      : 100;
    const weightedAttendance = (attendancePercent * attendanceWeight) / 100;

    // B. Quizzes
    let totalQuizPercents = 0;
    const quizScores = quizzes.map((q) => {
      const best = quizMap.get(`${sId}_${q._id.toString()}`);
      const score = best ? best.score : null;
      const percent = best ? best.percent : 0;
      totalQuizPercents += percent;
      return {
        quizId: q._id,
        title: q.title,
        score,
        totalMarks: best ? best.totalMarks : (q.questions?.length || 0),
        percent: best ? best.percent : 0,
        attempted: Boolean(best),
      };
    });

    const avgQuizPercent = quizzes.length > 0 ? Math.round(totalQuizPercents / quizzes.length) : 100;
    const weightedQuizzes = (avgQuizPercent * quizzesWeight) / 100;

    // C. Assignments
    let totalAssignmentPercents = 0;
    const assignmentScores = assignments.map((a) => {
      const sub = subMap.get(`${sId}_${a._id.toString()}`);
      const marks = sub ? (sub.finalMarks !== null ? sub.finalMarks : sub.marks) : null;
      const maxMarks = a.maxMarks || 100;
      const percent = marks !== null ? Math.round((marks / maxMarks) * 100) : 0;
      totalAssignmentPercents += percent;
      return {
        assignmentId: a._id,
        title: a.title,
        marks,
        maxMarks,
        percent,
        status: sub ? sub.status : 'not_submitted',
      };
    });

    const avgAssignmentPercent = assignments.length > 0
      ? Math.round(totalAssignmentPercents / assignments.length)
      : 100;
    const weightedAssignments = (avgAssignmentPercent * assignmentsWeight) / 100;

    // Overall
    const finalOverallPercent = Math.min(
      100,
      Math.round(weightedAttendance + weightedQuizzes + weightedAssignments)
    );

    let performanceBadge = 'Passing';
    if (finalOverallPercent >= 85) performanceBadge = 'Excellent';
    else if (finalOverallPercent >= 70) performanceBadge = 'Good';
    else if (finalOverallPercent < 50) performanceBadge = 'At Risk';

    return {
      student: {
        _id: student?._id,
        name: student?.name || 'Unknown',
        email: student?.email || '',
        phone: student?.phone || '',
        avatar: student?.avatar,
      },
      attendance: {
        attendedCount,
        completedSessionCount,
        percent: attendancePercent,
        weightedScore: Math.round(weightedAttendance * 10) / 10,
      },
      quizzes: {
        items: quizScores,
        avgPercent: avgQuizPercent,
        weightedScore: Math.round(weightedQuizzes * 10) / 10,
      },
      assignments: {
        items: assignmentScores,
        avgPercent: avgAssignmentPercent,
        weightedScore: Math.round(weightedAssignments * 10) / 10,
      },
      finalOverallPercent,
      performanceBadge,
    };
  });

  return {
    course: {
      _id: course._id,
      title: course.title,
      slug: course.slug,
      gradeWeights: weights,
    },
    meta: {
      quizzes: quizzes.map((q) => ({ _id: q._id, title: q.title, week: q.week })),
      assignments: assignments.map((a) => ({ _id: a._id, title: a.title, maxMarks: a.maxMarks, week: a.week })),
      completedSessionCount,
    },
    students: studentRows,
  };
}

/**
 * GET /api/admin/courses/:courseId/gradebook
 * Full course gradebook matrix with student rows and configurable weights
 */
export const getCourseGradebookAdmin = asyncHandler(async (req, res) => {
  const data = await buildCourseGradebookData(req.params.courseId);
  return sendSuccess(res, { data });
});

/**
 * GET /api/admin/courses/:courseId/gradebook/export
 * Bulk CSV stream of entire cohort gradebook
 */
export const exportCourseGradebookCSVAdmin = asyncHandler(async (req, res) => {
  const data = await buildCourseGradebookData(req.params.courseId);

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const quizHeaders = data.meta.quizzes.map((q) => `Quiz: ${q.title}`);
  const assignmentHeaders = data.meta.assignments.map((a) => `HW: ${a.title}`);

  const header = [
    'Student Name',
    'Student Email',
    'Student Phone',
    'Attendance %',
    ...quizHeaders,
    'Avg Quiz %',
    ...assignmentHeaders,
    'Avg HW %',
    'Overall Weighted %',
    'Performance Status',
  ].join(',');

  const rows = data.students.map((row) => {
    const qCols = row.quizzes.items.map((q) => (q.attempted ? `${q.score}/${q.totalMarks} (${q.percent}%)` : '—'));
    const aCols = row.assignments.items.map((a) => (a.marks !== null ? `${a.marks}/${a.maxMarks} (${a.percent}%)` : '—'));

    return [
      escapeCSV(row.student.name),
      escapeCSV(row.student.email),
      escapeCSV(row.student.phone),
      escapeCSV(`${row.attendance.percent}%`),
      ...qCols.map(escapeCSV),
      escapeCSV(`${row.quizzes.avgPercent}%`),
      ...aCols.map(escapeCSV),
      escapeCSV(`${row.assignments.avgPercent}%`),
      escapeCSV(`${row.finalOverallPercent}%`),
      escapeCSV(row.performanceBadge),
    ].join(',');
  });

  const csv = [header, ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="gradebook-${data.course.slug || 'cohort'}.csv"`
  );
  return res.status(200).send(csv);
});

/**
 * GET /api/student/courses/:courseId/grades
 * Student view: returns their own individual gradebook row and breakdown only
 */
export const getMyCourseGradesStudent = asyncHandler(async (req, res) => {
  const data = await buildCourseGradebookData(req.params.courseId);

  const myRow = data.students.find(
    (s) => s.student._id.toString() === req.user._id.toString()
  );

  if (!myRow) {
    throw ApiError.forbidden('You do not have approved grades in this course.', 'NO_GRADES_FOUND');
  }

  return sendSuccess(res, {
    data: {
      course: data.course,
      meta: data.meta,
      gradebook: myRow,
    },
  });
});

export default {
  getCourseGradebookAdmin,
  exportCourseGradebookCSVAdmin,
  getMyCourseGradesStudent,
};
