import Session from '../models/session.model.js';
import Attendance from '../models/attendance.model.js';
import Course from '../models/course.model.js';
import Enrollment from '../models/enrollment.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

// ==========================================
// ADMIN CONTROLLERS
// ==========================================

/**
 * GET /api/admin/courses/:courseId/sessions
 * List all sessions for a course with meeting links, attendance metrics, and resources
 */
export const getCourseSessionsAdmin = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId);
  if (!course) {
    throw ApiError.notFound('Bootcamp course not found.', 'COURSE_NOT_FOUND');
  }

  const sessions = await Session.find({ course: courseId }).sort({
    week: 1,
    order: 1,
    scheduledAt: 1,
  });

  // Calculate attendance summaries for each session
  const sessionIds = sessions.map((s) => s._id);
  const attendances = await Attendance.find({ session: { $in: sessionIds } });

  const enrolledCount = await Enrollment.countDocuments({
    course: courseId,
    status: 'approved',
  });

  const attendanceMap = {};
  attendances.forEach((att) => {
    const sId = att.session.toString();
    if (!attendanceMap[sId]) {
      attendanceMap[sId] = { present: 0, late: 0, absent: 0 };
    }
    if (att.status === 'present') attendanceMap[sId].present += 1;
    else if (att.status === 'late') attendanceMap[sId].late += 1;
    else if (att.status === 'absent') attendanceMap[sId].absent += 1;
  });

  const items = sessions.map((session) => {
    const sObj = session.toObject();
    const metrics = attendanceMap[session._id.toString()] || {
      present: 0,
      late: 0,
      absent: 0,
    };
    return {
      ...sObj,
      enrolledCount,
      attendanceSummary: {
        ...metrics,
        attendedTotal: metrics.present + metrics.late,
      },
    };
  });

  return sendSuccess(res, {
    data: {
      items,
      total: items.length,
      course: {
        _id: course._id,
        title: course.title,
        slug: course.slug,
      },
    },
  });
});

/**
 * POST /api/admin/courses/:courseId/sessions
 * Create a new live session
 */
export const createSessionAdmin = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const course = await Course.findById(courseId);
  if (!course) {
    throw ApiError.notFound('Bootcamp course not found.', 'COURSE_NOT_FOUND');
  }

  const session = await Session.create({
    ...req.body,
    course: courseId,
  });

  return sendSuccess(res, {
    statusCode: 201,
    data: session,
    message: 'Live lecture session scheduled successfully.',
  });
});

/**
 * GET /api/admin/sessions/:id
 * Retrieve a single session
 */
export const getSessionByIdAdmin = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id).populate('course', 'title slug fee schedule');
  if (!session) {
    throw ApiError.notFound('Session not found.', 'SESSION_NOT_FOUND');
  }

  return sendSuccess(res, { data: session });
});

/**
 * PUT /api/admin/sessions/:id
 * Update session details
 */
export const updateSessionAdmin = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) {
    throw ApiError.notFound('Session not found.', 'SESSION_NOT_FOUND');
  }

  const allowedUpdates = [
    'week',
    'order',
    'title',
    'description',
    'scheduledAt',
    'durationMinutes',
    'meetingLink',
    'resources',
    'status',
    'isPublished',
  ];

  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      session[field] = req.body[field];
    }
  });

  await session.save();

  return sendSuccess(res, {
    data: session,
    message: 'Session updated successfully.',
  });
});

/**
 * DELETE /api/admin/sessions/:id
 * Remove a session and its associated attendance records
 */
export const deleteSessionAdmin = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) {
    throw ApiError.notFound('Session not found.', 'SESSION_NOT_FOUND');
  }

  await Attendance.deleteMany({ session: session._id });
  await session.deleteOne();

  return sendSuccess(res, {
    message: 'Session and associated attendance records deleted.',
  });
});

/**
 * PATCH /api/admin/sessions/:id/status
 * Quick update of session status (upcoming | live | completed | cancelled)
 */
export const updateSessionStatusAdmin = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const session = await Session.findById(req.params.id);
  if (!session) {
    throw ApiError.notFound('Session not found.', 'SESSION_NOT_FOUND');
  }

  session.status = status;
  await session.save();

  return sendSuccess(res, {
    data: session,
    message: `Session status changed to ${status}.`,
  });
});

/**
 * GET /api/admin/sessions/:id/attendance
 * Retrieve roster of approved students for this session's course with current attendance
 */
export const getSessionAttendanceAdmin = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session) {
    throw ApiError.notFound('Session not found.', 'SESSION_NOT_FOUND');
  }

  // Find all approved students in this course
  const enrollments = await Enrollment.find({
    course: session.course,
    status: 'approved',
  }).populate('student', 'name email phone avatar');

  // Find existing attendance records for this session
  const attendances = await Attendance.find({ session: session._id });
  const attendanceMap = new Map();
  attendances.forEach((att) => {
    attendanceMap.set(att.student.toString(), att);
  });

  const roster = enrollments.map((enr) => {
    const student = enr.student;
    const sId = student?._id?.toString();
    const existing = sId ? attendanceMap.get(sId) : null;

    return {
      studentId: student?._id,
      name: student?.name || 'Unknown',
      email: student?.email || '',
      phone: student?.phone || '',
      status: existing ? existing.status : 'absent',
      source: existing ? existing.source : null,
      joinedAt: existing ? existing.joinedAt : null,
      marked: !!existing,
    };
  });

  return sendSuccess(res, {
    data: {
      session: {
        _id: session._id,
        title: session.title,
        scheduledAt: session.scheduledAt,
        status: session.status,
      },
      roster,
      summary: {
        totalEnrolled: roster.length,
        present: roster.filter((r) => r.status === 'present').length,
        late: roster.filter((r) => r.status === 'late').length,
        absent: roster.filter((r) => r.status === 'absent').length,
      },
    },
  });
});

/**
 * PUT /api/admin/sessions/:id/attendance
 * Bulk manual update of student attendance
 */
export const updateSessionAttendanceAdmin = asyncHandler(async (req, res) => {
  const { attendance } = req.body;
  const session = await Session.findById(req.params.id);
  if (!session) {
    throw ApiError.notFound('Session not found.', 'SESSION_NOT_FOUND');
  }

  const operations = attendance.map((item) => ({
    updateOne: {
      filter: { session: session._id, student: item.studentId },
      update: {
        $set: {
          course: session.course,
          status: item.status,
          source: 'manual', // Manual marking explicitly overrides auto attendance
        },
        $setOnInsert: {
          joinedAt: new Date(),
        },
      },
      upsert: true,
    },
  }));

  if (operations.length > 0) {
    await Attendance.bulkWrite(operations);
  }

  return sendSuccess(res, {
    message: 'Attendance sheet saved successfully.',
  });
});

/**
 * GET /api/admin/sessions/today
 * Returns all sessions scheduled for today across all courses
 */
export const getTodaySessionsAdmin = asyncHandler(async (req, res) => {
  // Compute start and end of today in Asia/Karachi (UTC + 5)
  const now = new Date();
  const pktOffsetMs = 5 * 60 * 60 * 1000;
  const pktDate = new Date(now.getTime() + pktOffsetMs);

  const year = pktDate.getUTCFullYear();
  const month = pktDate.getUTCMonth();
  const day = pktDate.getUTCDate();

  // UTC equivalent of PKT midnight to 23:59:59.999
  const startOfPktDay = new Date(Date.UTC(year, month, day, 0, 0, 0) - pktOffsetMs);
  const endOfPktDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - pktOffsetMs);

  const sessions = await Session.find({
    scheduledAt: { $gte: startOfPktDay, $lte: endOfPktDay },
  })
    .populate('course', 'title slug fee schedule')
    .sort({ scheduledAt: 1 });

  return sendSuccess(res, {
    data: {
      items: sessions,
      count: sessions.length,
      todayPkt: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    },
  });
});

// ==========================================
// STUDENT CONTROLLERS
// ==========================================

/**
 * GET /api/courses/:courseId/sessions
 * List sessions for student.
 * CRITICAL: NEVER includes meetingLink. Includes resources, canJoinNow, and attendance.
 */
export const getCourseSessionsStudent = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const sessions = await Session.find({
    course: courseId,
    isPublished: true,
  })
    .select('-meetingLink') // NEVER expose meetingLink in list responses
    .sort({ week: 1, order: 1, scheduledAt: 1 });

  // Fetch student's attendance records for this course
  const attendances = await Attendance.find({
    student: req.user._id,
    course: courseId,
  });

  const attendanceMap = new Map();
  attendances.forEach((att) => {
    attendanceMap.set(att.session.toString(), {
      status: att.status,
      joinedAt: att.joinedAt,
      source: att.source,
    });
  });

  const now = new Date();

  const items = sessions.map((session) => {
    const sObj = session.toObject();
    const scheduledTime = new Date(session.scheduledAt).getTime();
    const windowStart = new Date(scheduledTime - 15 * 60 * 1000); // 15 mins prior
    const windowEnd = new Date(scheduledTime + (session.durationMinutes + 30) * 60 * 1000); // 30 mins after end

    const canJoinNow =
      session.status !== 'cancelled' &&
      now.getTime() >= windowStart.getTime() &&
      now.getTime() <= windowEnd.getTime();

    const myAttendance = attendanceMap.get(session._id.toString()) || null;

    return {
      ...sObj,
      canJoinNow,
      windowStart,
      windowEnd,
      myAttendance,
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
 * POST /api/sessions/:id/join
 * Join live session inside join window.
 * Enforces 15m pre-start to 30m post-end window.
 * Automatically marks attendance (present, or late if > 10m).
 * Returns meetingLink.
 */
export const joinSessionStudent = asyncHandler(async (req, res) => {
  const session = await Session.findById(req.params.id);
  if (!session || !session.isPublished) {
    throw ApiError.notFound('Live session not found or currently unavailable.', 'SESSION_NOT_FOUND');
  }

  if (session.status === 'cancelled') {
    throw ApiError.badRequest('This live lecture session has been cancelled.', 'SESSION_CANCELLED');
  }

  const now = new Date();
  const scheduledTime = new Date(session.scheduledAt).getTime();
  const windowStart = new Date(scheduledTime - 15 * 60 * 1000);
  const windowEnd = new Date(scheduledTime + (session.durationMinutes + 30) * 60 * 1000);

  // 1. Check if join window has not opened yet
  if (now.getTime() < windowStart.getTime()) {
    const msUntilOpen = windowStart.getTime() - now.getTime();
    const minutesLeft = Math.ceil(msUntilOpen / (60 * 1000));
    throw ApiError.badRequest(
      `Class join window is not open yet. It opens 15 minutes before class (in ${minutesLeft} minute${
        minutesLeft === 1 ? '' : 's'
      }).`,
      'JOIN_WINDOW_NOT_OPEN',
      { opensAt: windowStart, msUntilOpen }
    );
  }

  // 2. Check if join window has expired
  if (now.getTime() > windowEnd.getTime()) {
    throw ApiError.badRequest(
      'The live join window for this class has ended (closed 30 minutes after class completion).',
      'JOIN_WINDOW_CLOSED',
      { closedAt: windowEnd }
    );
  }

  // 3. Record attendance
  let attendanceRecord = await Attendance.findOne({
    session: session._id,
    student: req.user._id,
  });

  if (!attendanceRecord) {
    // Determine auto status: late if joined more than 10 minutes after scheduled start
    const lateThreshold = scheduledTime + 10 * 60 * 1000;
    const status = now.getTime() > lateThreshold ? 'late' : 'present';

    try {
      attendanceRecord = await Attendance.create({
        session: session._id,
        student: req.user._id,
        course: session.course,
        joinedAt: now,
        source: 'auto',
        status,
      });
    } catch (err) {
      // In case of rapid concurrent double-click, handle unique constraint gracefully
      if (err.code === 11000) {
        attendanceRecord = await Attendance.findOne({
          session: session._id,
          student: req.user._id,
        });
      } else {
        throw err;
      }
    }
  }

  return sendSuccess(res, {
    data: {
      meetingLink: session.meetingLink,
      title: session.title,
      scheduledAt: session.scheduledAt,
      attendanceStatus: attendanceRecord?.status || 'present',
      joinedAt: attendanceRecord?.joinedAt || now,
    },
    message: 'Welcome to class! Opening meeting room...',
  });
});

/**
 * GET /api/courses/:courseId/my-attendance
 * Returns completed session attendance count and percentage
 */
export const getMyCourseAttendanceStudent = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  // Total completed sessions in this course
  const completedSessions = await Session.find({
    course: courseId,
    isPublished: true,
    status: 'completed',
  }).select('_id');

  const completedSessionIds = completedSessions.map((s) => s._id);
  const totalCompleted = completedSessionIds.length;

  // Student attendances for completed sessions
  const attendedCount = await Attendance.countDocuments({
    session: { $in: completedSessionIds },
    student: req.user._id,
    status: { $in: ['present', 'late'] },
  });

  const percentage =
    totalCompleted === 0 ? 100 : Math.round((attendedCount / totalCompleted) * 100);

  const totalCourseSessions = await Session.countDocuments({
    course: courseId,
    isPublished: true,
  });

  return sendSuccess(res, {
    data: {
      attended: attendedCount,
      totalCompleted,
      percentage,
      totalCourseSessions,
    },
  });
});

export default {
  getCourseSessionsAdmin,
  createSessionAdmin,
  getSessionByIdAdmin,
  updateSessionAdmin,
  deleteSessionAdmin,
  updateSessionStatusAdmin,
  getSessionAttendanceAdmin,
  updateSessionAttendanceAdmin,
  getTodaySessionsAdmin,
  getCourseSessionsStudent,
  joinSessionStudent,
  getMyCourseAttendanceStudent,
};
