import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../models/user.model.js';
import Course from '../models/course.model.js';
import Enrollment from '../models/enrollment.model.js';
import Session from '../models/session.model.js';
import Attendance from '../models/attendance.model.js';
import Quiz from '../models/quiz.model.js';
import QuizAttempt from '../models/quizAttempt.model.js';
import Assignment from '../models/assignment.model.js';
import Submission from '../models/submission.model.js';
import Notification from '../models/notification.model.js';
import Announcement from '../models/announcement.model.js';

let mongoServer;
let adminToken;
let adminUser;
let student1Token;
let student1User;
let student2Token;
let student2User;
let unenrolledStudentToken;
let testCourse;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // 1. Admin
  const adminRes = await request(app)
    .post('/api/auth/register')
    .set('X-Forwarded-For', '10.10.0.1')
    .send({
      name: 'Admin Telemetry Instructor',
      email: 'admin.telemetry@codecraft.com',
      password: 'Password123!',
      phone: '03001112233',
    });
  await User.updateOne({ email: 'admin.telemetry@codecraft.com' }, { role: 'admin' });

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .set('X-Forwarded-For', '10.10.0.2')
    .send({
      email: 'admin.telemetry@codecraft.com',
      password: 'Password123!',
    });
  adminToken = adminLogin.body.data.token;
  adminUser = adminLogin.body.data.user;

  // 2. Student 1
  const s1Res = await request(app)
    .post('/api/auth/register')
    .set('X-Forwarded-For', '10.10.0.3')
    .send({
      name: 'Dashboard Student One',
      email: 'student1.dashboard@gmail.com',
      password: 'Password123!',
      phone: '03004445566',
    });
  student1Token = s1Res.body.data.token;
  student1User = s1Res.body.data.user;

  // 3. Student 2
  const s2Res = await request(app)
    .post('/api/auth/register')
    .set('X-Forwarded-For', '10.10.0.4')
    .send({
      name: 'Dashboard Student Two',
      email: 'student2.dashboard@gmail.com',
      password: 'Password123!',
      phone: '03007778899',
    });
  student2Token = s2Res.body.data.token;
  student2User = s2Res.body.data.user;

  // 4. Unenrolled Student
  const s3Res = await request(app)
    .post('/api/auth/register')
    .set('X-Forwarded-For', '10.10.0.5')
    .send({
      name: 'Unenrolled Student',
      email: 'student.unenrolled.dashboard@gmail.com',
      password: 'Password123!',
      phone: '03001239876',
    });
  unenrolledStudentToken = s3Res.body.data.token;

  // 5. Course with configurable gradeWeights
  testCourse = await Course.create({
    title: 'Modern Web Engineering',
    slug: 'modern-web-engineering',
    tagline: 'Production full stack with grading',
    description: 'Masterclass course.',
    level: 'All Levels',
    durationWeeks: 12,
    schedule: 'Mon & Wed 8:00 PM PKT',
    startDate: new Date(),
    seatsTotal: 30,
    fee: 30000,
    isPublished: true,
    isEnrollmentOpen: true,
    gradeWeights: {
      attendance: 20,
      quizzes: 40,
      assignments: 40,
    },
  });

  // 6. Enrollments: Student 1 (approved, 30000 paid), Student 2 (approved, 30000 paid)
  await Enrollment.create([
    {
      student: student1User._id || student1User.id,
      course: testCourse._id,
      status: 'approved',
      amountDue: 30000,
      amountPaid: 30000,
      paymentMethod: 'bank',
      senderName: 'Student 1',
      senderNumber: '03004445566',
      transactionId: 'TXN-P6-01',
      reviewedBy: adminUser._id || adminUser.id,
      reviewedAt: new Date(),
    },
    {
      student: student2User._id || student2User.id,
      course: testCourse._id,
      status: 'approved',
      amountDue: 30000,
      amountPaid: 30000,
      paymentMethod: 'jazzcash',
      senderName: 'Student 2',
      senderNumber: '03007778899',
      transactionId: 'TXN-P6-02',
      reviewedBy: adminUser._id || adminUser.id,
      reviewedAt: new Date(),
    },
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Phase 6: Dashboards, Announcements, Notifications, Students & Gradebook', () => {
  describe('Announcements & Notifications Broadcast', () => {
    let createdAnnouncement;

    it('admin creates cohort announcement and triggers notifications to approved students', async () => {
      const res = await request(app)
        .post(`/api/admin/courses/${testCourse._id}/announcements`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Guest Lecture on System Design this Saturday',
          body: 'We will cover database sharding and caching architectures.',
          pinned: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Guest Lecture on System Design this Saturday');
      expect(res.body.data.pinned).toBe(true);
      createdAnnouncement = res.body.data;

      // Verify notification document was created for student 1
      const notif = await Notification.findOne({
        user: student1User._id || student1User.id,
        type: 'announcement_created',
      });
      expect(notif).toBeDefined();
      expect(notif.title).toContain('Guest Lecture on System Design this Saturday');
    });

    it('enrolled student views course announcements', async () => {
      const res = await request(app)
        .get(`/api/courses/${testCourse._id}/announcements`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].pinned).toBe(true);
    });

    it('unenrolled student gets 403 on course announcements', async () => {
      const res = await request(app)
        .get(`/api/courses/${testCourse._id}/announcements`)
        .set('Authorization', `Bearer ${unenrolledStudentToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Notification Management & Unread Counters', () => {
    let studentNotification;

    it('student retrieves unread notification count', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBeGreaterThanOrEqual(1);
    });

    it('student lists notifications', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      studentNotification = res.body.data.items[0];
    });

    it('student marks single notification as read', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${studentNotification._id}/read`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.readAt).toBeDefined();
    });

    it('student marks all notifications as read', async () => {
      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);

      // Verify unread count is now 0
      const countRes = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(countRes.body.data.count).toBe(0);
    });
  });

  describe('Admin Telemetry & Aggregation Stats', () => {
    it('aggregates real stats without in-memory loops', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const { stats, needsAttention } = res.body.data;

      expect(stats.totalStudents).toBeGreaterThanOrEqual(2);
      expect(stats.approvedEnrollments).toBeGreaterThanOrEqual(2);
      expect(stats.totalRevenueCollected).toBe(60000); // 30,000 * 2
      expect(needsAttention).toBeDefined();
      expect(Array.isArray(needsAttention.pendingEnrollments)).toBe(true);
      expect(Array.isArray(needsAttention.ungradedSubmissions)).toBe(true);
    });
  });

  describe('Student Dashboard Aggregates', () => {
    it('returns student enrolled courses, deadlines, and next class', async () => {
      const res = await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      const data = res.body.data;

      expect(data.enrolledCourses).toHaveLength(1);
      expect(data.enrolledCourses[0].title).toBe('Modern Web Engineering');
      expect(data.enrolledCourses[0].attendancePercent).toBeDefined();
      expect(data.latestAnnouncements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Admin Student Management & Account Controls', () => {
    it('lists students with search, enrollments count, and attendance', async () => {
      const res = await request(app)
        .get('/api/admin/students')
        .query({ search: 'Dashboard Student One' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].name).toBe('Dashboard Student One');
      expect(res.body.data.items[0].approvedEnrollmentsCount).toBe(1);
    });

    it('retrieves detailed student profile', async () => {
      const res = await request(app)
        .get(`/api/admin/students/${student1User._id || student1User.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.student.email).toBe('student1.dashboard@gmail.com');
      expect(res.body.data.enrollments).toHaveLength(1);
      expect(res.body.data.attendanceSummary).toBeDefined();
    });

    it('updates private instructor notes for student', async () => {
      const res = await request(app)
        .put(`/api/admin/students/${student1User._id || student1User.id}/notes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          privateNotes: 'Strong frontend background, needs extra guidance on indexing.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.privateNotes).toBe('Strong frontend background, needs extra guidance on indexing.');
    });

    it('prevents admin from deactivating their own account', async () => {
      const res = await request(app)
        .patch(`/api/admin/students/${adminUser._id || adminUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('CANNOT_DEACTIVATE_SELF');
    });

    it('deactivates student account and blocks them from protected routes', async () => {
      // 1. Deactivate student 2
      const deactRes = await request(app)
        .patch(`/api/admin/students/${student2User._id || student2User.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false });

      expect(deactRes.status).toBe(200);
      expect(deactRes.body.data.isActive).toBe(false);

      // 2. Student 2 tries to access dashboard: should get 403
      const blockedRes = await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', `Bearer ${student2Token}`);

      expect(blockedRes.status).toBe(403);
      expect(blockedRes.body.code).toBe('ACCOUNT_DEACTIVATED');

      // 3. Reactivate student 2
      await request(app)
        .patch(`/api/admin/students/${student2User._id || student2User.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: true });
    });
  });

  describe('Cohort Gradebook & Weighted Calculations', () => {
    let testSession;
    let testQuiz;
    let testAssignment;

    beforeAll(async () => {
      // 1. Session & Attendance (Student 1 present, Student 2 absent)
      testSession = await Session.create({
        course: testCourse._id,
        week: 1,
        order: 1,
        title: 'Introduction to Architecture',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        status: 'completed',
        isPublished: true,
      });

      await Attendance.create({
        session: testSession._id,
        student: student1User._id || student1User.id,
        course: testCourse._id,
        status: 'present',
      });

      // 2. Quiz & Attempts (Student 1: 100%, Student 2: 50%)
      testQuiz = await Quiz.create({
        course: testCourse._id,
        week: 1,
        title: 'Architecture Fundamentals Quiz',
        passingPercent: 60,
        isPublished: true,
        questions: [
          { text: 'Q1', type: 'single', options: ['A', 'B'], correctIndexes: [0], marks: 10 },
        ],
      });

      await QuizAttempt.create([
        {
          quiz: testQuiz._id,
          student: student1User._id || student1User.id,
          status: 'submitted',
          score: 10,
          totalMarks: 10,
          percent: 100,
        },
        {
          quiz: testQuiz._id,
          student: student2User._id || student2User.id,
          status: 'submitted',
          score: 5,
          totalMarks: 10,
          percent: 50,
        },
      ]);

      // 3. Assignment & Submissions (Student 1: 100/100, Student 2: 70/100)
      testAssignment = await Assignment.create({
        course: testCourse._id,
        week: 1,
        title: 'Project Setup HW',
        description: 'Complete project initial setup and README.',
        dueAt: new Date(Date.now() + 86400000),
        maxMarks: 100,
        isPublished: true,
      });

      await Submission.create([
        {
          assignment: testAssignment._id,
          student: student1User._id || student1User.id,
          course: testCourse._id,
          status: 'graded',
          marks: 100,
          finalMarks: 100,
        },
        {
          assignment: testAssignment._id,
          student: student2User._id || student2User.id,
          course: testCourse._id,
          status: 'graded',
          marks: 70,
          finalMarks: 70,
        },
      ]);
    });

    it('admin views full course gradebook matrix with student rows', async () => {
      const res = await request(app)
        .get(`/api/admin/courses/${testCourse._id}/gradebook`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;

      expect(data.students).toHaveLength(2);

      const s1Row = data.students.find((s) => s.student.email === 'student1.dashboard@gmail.com');
      const s2Row = data.students.find((s) => s.student.email === 'student2.dashboard@gmail.com');

      // Student 1: 100% attendance (20 pts), 100% quiz (40 pts), 100% assignment (40 pts) = 100%
      expect(s1Row.attendance.percent).toBe(100);
      expect(s1Row.quizzes.avgPercent).toBe(100);
      expect(s1Row.assignments.avgPercent).toBe(100);
      expect(s1Row.finalOverallPercent).toBe(100);
      expect(s1Row.performanceBadge).toBe('Excellent');

      // Student 2: 0% attendance (0 pts), 50% quiz (20 pts), 70% assignment (28 pts) = 48%
      expect(s2Row.attendance.percent).toBe(0);
      expect(s2Row.quizzes.avgPercent).toBe(50);
      expect(s2Row.assignments.avgPercent).toBe(70);
      expect(s2Row.finalOverallPercent).toBe(48);
      expect(s2Row.performanceBadge).toBe('At Risk');
    });

    it('admin exports gradebook as CSV', async () => {
      const res = await request(app)
        .get(`/api/admin/courses/${testCourse._id}/gradebook/export`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Student Name,Student Email,Student Phone,Attendance %');
      expect(res.text).toContain('student1.dashboard@gmail.com');
      expect(res.text).toContain('student2.dashboard@gmail.com');
      expect(res.text).toContain('100%');
      expect(res.text).toContain('Excellent');
    });

    it('student views only their own row in gradebook breakdown', async () => {
      const res = await request(app)
        .get(`/api/student/courses/${testCourse._id}/grades`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.gradebook.student.email).toBe('student1.dashboard@gmail.com');
      expect(res.body.data.gradebook.finalOverallPercent).toBe(100);
    });

    it('unenrolled student cannot access course grades', async () => {
      const res = await request(app)
        .get(`/api/student/courses/${testCourse._id}/grades`)
        .set('Authorization', `Bearer ${unenrolledStudentToken}`);

      expect(res.status).toBe(403);
    });
  });
});
