import Notification from '../models/notification.model.js';
import Enrollment from '../models/enrollment.model.js';
import User from '../models/user.model.js';

export const notificationService = {
  /**
   * Create a single notification for a specific user
   */
  async createNotification({ user, type, title, body, link = '' }) {
    if (!user) return null;
    try {
      return await Notification.create({
        user,
        type,
        title,
        body,
        link,
      });
    } catch (err) {
      console.error('[NotificationService] Error creating notification:', err.message);
      return null;
    }
  },

  /**
   * Broadcast a notification to all approved students enrolled in a course
   */
  async createCourseBulkNotifications({ courseId, type, title, body, link = '', excludeUserId = null }) {
    if (!courseId) return [];
    try {
      const enrollments = await Enrollment.find({
        course: courseId,
        status: 'approved',
      }).select('student');

      if (!enrollments.length) return [];

      const notifications = enrollments
        .filter((enr) => !excludeUserId || enr.student.toString() !== excludeUserId.toString())
        .map((enr) => ({
          user: enr.student,
          type,
          title,
          body,
          link,
        }));

      if (!notifications.length) return [];

      return await Notification.insertMany(notifications);
    } catch (err) {
      console.error('[NotificationService] Error sending course bulk notifications:', err.message);
      return [];
    }
  },

  /**
   * Broadcast a notification to all admin users (e.g. new contact message or critical alert)
   */
  async notifyAdmins({ type, title, body, link = '' }) {
    try {
      const admins = await User.find({ role: 'admin' }).select('_id');
      if (!admins.length) return [];
      const notifications = admins.map((adm) => ({
        user: adm._id,
        type,
        title,
        body,
        link,
      }));
      return await Notification.insertMany(notifications);
    } catch (err) {
      console.error('[NotificationService] Error sending admin notification:', err.message);
      return [];
    }
  },

  /**
   * Trigger: Enrollment status updated (approved / rejected)
   */
  async notifyEnrollmentReviewed({ studentId, courseTitle, status, adminNote = '' }) {
    const isApproved = status === 'approved';
    const title = isApproved
      ? `Enrollment Approved: ${courseTitle}`
      : `Enrollment Update: ${courseTitle}`;

    const body = isApproved
      ? `Congratulations! Your tuition payment has been verified and your seat is confirmed for ${courseTitle}. You now have full access to class schedules, notes, and the student portal.`
      : `Your enrollment request for ${courseTitle} was marked as rejected.${adminNote ? ` Instructor Note: ${adminNote}` : ' Please contact support if you believe this is an error.'}`;

    const link = isApproved ? '/student/courses' : '/student/payments';

    return await this.createNotification({
      user: studentId,
      type: isApproved ? 'enrollment_approved' : 'enrollment_rejected',
      title,
      body,
      link,
    });
  },

  /**
   * Trigger: Live Session scheduled, rescheduled, or cancelled
   */
  async notifySessionEvent({ courseId, courseTitle, sessionTitle, eventType, scheduledAt = null }) {
    let type = 'session_scheduled';
    let title = `Class Session Scheduled: ${courseTitle}`;
    let body = `A new live class "${sessionTitle}" has been scheduled.`;

    if (eventType === 'rescheduled') {
      type = 'session_rescheduled';
      title = `Class Rescheduled: ${sessionTitle}`;
      body = `The live class "${sessionTitle}" for ${courseTitle} has been rescheduled. Please check your schedule for the updated time.`;
    } else if (eventType === 'cancelled') {
      type = 'session_cancelled';
      title = `Class Cancelled: ${sessionTitle}`;
      body = `Please note that the live session "${sessionTitle}" for ${courseTitle} has been cancelled.`;
    }

    return await this.createCourseBulkNotifications({
      courseId,
      type,
      title,
      body,
      link: `/student/courses/${courseId}`,
    });
  },

  /**
   * Trigger: Assignment graded or returned for revision
   */
  async notifyAssignmentGraded({ studentId, courseId, assignmentTitle, action, marks, maxMarks, feedback = '' }) {
    const isReturn = action === 'return';
    const type = isReturn ? 'assignment_returned' : 'assignment_graded';
    const title = isReturn
      ? `Assignment Revision Requested: ${assignmentTitle}`
      : `Assignment Graded: ${assignmentTitle}`;

    const body = isReturn
      ? `Your submission for "${assignmentTitle}" was returned by the instructor for revision.${feedback ? ` Feedback: "${feedback}"` : ''}`
      : `Your submission for "${assignmentTitle}" has been graded: ${marks} / ${maxMarks} marks.${feedback ? ` Feedback: "${feedback}"` : ''}`;

    return await this.createNotification({
      user: studentId,
      type,
      title,
      body,
      link: `/student/courses/${courseId}`,
    });
  },

  /**
   * Trigger: New assignment or quiz published
   */
  async notifyContentPublished({ courseId, courseTitle, contentType, itemTitle }) {
    const isQuiz = contentType === 'quiz';
    const type = isQuiz ? 'quiz_published' : 'assignment_published';
    const title = isQuiz
      ? `New Quiz Available: ${itemTitle}`
      : `New Assignment Posted: ${itemTitle}`;
    const body = `A new ${isQuiz ? 'quiz' : 'homework assignment'} "${itemTitle}" has been published in ${courseTitle}.`;

    return await this.createCourseBulkNotifications({
      courseId,
      type,
      title,
      body,
      link: `/student/courses/${courseId}`,
    });
  },

  /**
   * Trigger: New cohort announcement posted
   */
  async notifyAnnouncementPosted({ courseId, courseTitle, announcementTitle, creatorId }) {
    return await this.createCourseBulkNotifications({
      courseId,
      type: 'announcement_created',
      title: `Cohort Notice: ${announcementTitle}`,
      body: `A new announcement was posted in ${courseTitle}: "${announcementTitle}".`,
      link: `/student/courses/${courseId}`,
      excludeUserId: creatorId,
    });
  },
};

export default notificationService;
