import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../models/user.model.js';
import Course from '../models/course.model.js';
import Enrollment from '../models/enrollment.model.js';
import Session from '../models/session.model.js';
import Attendance from '../models/attendance.model.js';

let mongoServer;
let adminToken;
let enrolledStudentToken;
let enrolledStudentUser;
let unenrolledStudentToken;
let testCourse;
let upcomingSession;
let liveSession;
let pastSession;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // 1. Create Admin
  const adminRes = await request(app)
    .post('/api/auth/register')
    .set('X-Forwarded-For', '10.5.0.1')
    .send({
      name: 'Instructor Admin',
      email: 'instructor@codecraft.com',
      password: 'Password123!',
      phone: '03001234567',
    });
  // Promote to admin
  await User.updateOne({ email: 'instructor@codecraft.com' }, { role: 'admin' });

  const adminLoginRes = await request(app)
    .post('/api/auth/login')
    .set('X-Forwarded-For', '10.5.0.2')
    .send({
      email: 'instructor@codecraft.com',
      password: 'Password123!',
    });
  adminToken = adminLoginRes.body.data.token;

  // 2. Create Enrolled Student
  const student1Res = await request(app)
    .post('/api/auth/register')
    .set('X-Forwarded-For', '10.5.0.3')
    .send({
      name: 'Approved Student',
      email: 'student.approved@gmail.com',
      password: 'Password123!',
      phone: '03007654321',
    });
  enrolledStudentToken = student1Res.body.data.token;
  enrolledStudentUser = student1Res.body.data.user;

  // 3. Create Unenrolled Student
  const student2Res = await request(app)
    .post('/api/auth/register')
    .set('X-Forwarded-For', '10.5.0.4')
    .send({
      name: 'Unenrolled Student',
      email: 'student.unenrolled@gmail.com',
      password: 'Password123!',
      phone: '03009998877',
    });
  unenrolledStudentToken = student2Res.body.data.token;

  // 4. Create Course
  testCourse = await Course.create({
    title: 'Full Stack MERN Bootcamp',
    slug: 'full-stack-mern-bootcamp',
    tagline: 'Become a production-ready engineer',
    description: 'Deep dive into MongoDB, Express, React and Node.',
    level: 'All Levels',
    durationWeeks: 12,
    schedule: 'Mon, Wed, Fri 8 to 10 PM PKT',
    startDate: new Date(),
    seatsTotal: 30,
    fee: 25000,
    isPublished: true,
    isEnrollmentOpen: true,
  });

  // 5. Create Approved Enrollment for Student 1
  await Enrollment.create({
    student: enrolledStudentUser.id || enrolledStudentUser._id,
    course: testCourse._id,
    status: 'approved',
    amountDue: 25000,
    amountPaid: 25000,
    paymentMethod: 'jazzcash',
    transactionId: 'TXN-APPROVED-999',
    senderName: 'Approved Student',
    senderNumber: '03007654321',
  });

  // 6. Create Sessions with different schedules
  const now = Date.now();

  // Upcoming session (2 hours in the future - outside 15m join window)
  upcomingSession = await Session.create({
    course: testCourse._id,
    week: 1,
    order: 1,
    title: 'Introduction to Full Stack Architecture',
    description: 'Overview of client-server patterns',
    scheduledAt: new Date(now + 2 * 60 * 60 * 1000), // +2 hours
    durationMinutes: 120,
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    resources: [{ title: 'Week 1 Slides', fileKey: 'uploads/pdf/admin/week1.pdf' }],
    status: 'upcoming',
    isPublished: true,
  });

  // Live session (Started 5 minutes ago - inside join window: -15m to +150m)
  liveSession = await Session.create({
    course: testCourse._id,
    week: 1,
    order: 2,
    title: 'Node.js Event Loop & Async Architecture',
    description: 'Deep dive into libuv and event loop phases',
    scheduledAt: new Date(now - 5 * 60 * 1000), // -5 mins
    durationMinutes: 120,
    meetingLink: 'https://meet.google.com/live-node-deepdive',
    resources: [{ title: 'Event Loop Cheatsheet', fileKey: 'uploads/pdf/admin/event-loop.pdf' }],
    status: 'live',
    isPublished: true,
  });

  // Past completed session (Yesterday)
  pastSession = await Session.create({
    course: testCourse._id,
    week: 1,
    order: 3,
    title: 'Express REST API Design',
    description: 'Routing, middleware, and error handling',
    scheduledAt: new Date(now - 24 * 60 * 60 * 1000), // -24 hours
    durationMinutes: 120,
    meetingLink: 'https://meet.google.com/past-session',
    status: 'completed',
    isPublished: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Phase 3: Live Sessions, Notes and Attendance', () => {
  describe('Access Control & Information Hiding (Security)', () => {
    it('MUST block unapproved students from viewing course sessions (returns 403)', async () => {
      const res = await request(app)
        .get(`/api/courses/${testCourse._id}/sessions`)
        .set('Authorization', `Bearer ${unenrolledStudentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('ENROLLMENT_REQUIRED');
    });

    it('MUST NEVER include meetingLink in student session list response', async () => {
      const res = await request(app)
        .get(`/api/courses/${testCourse._id}/sessions`)
        .set('Authorization', `Bearer ${enrolledStudentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      expect(res.body.data.items.length).toBeGreaterThan(0);

      // Verify meetingLink is stripped from all session items
      res.body.data.items.forEach((sessionItem) => {
        expect(sessionItem.meetingLink).toBeUndefined();
        expect(sessionItem.resources).toBeDefined();
        expect(typeof sessionItem.canJoinNow).toBe('boolean');
      });

      // Upcoming session cannot be joined now
      const upcoming = res.body.data.items.find((s) => s._id === upcomingSession._id.toString());
      expect(upcoming.canJoinNow).toBe(false);

      // Live session can be joined now
      const live = res.body.data.items.find((s) => s._id === liveSession._id.toString());
      expect(live.canJoinNow).toBe(true);
    });

    it('allows admin to view all sessions WITH meeting links', async () => {
      const res = await request(app)
        .get(`/api/admin/courses/${testCourse._id}/sessions`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items.length).toBe(3);

      const itemWithLink = res.body.data.items.find((s) => s._id === upcomingSession._id.toString());
      expect(itemWithLink.meetingLink).toBe('https://meet.google.com/abc-defg-hij');
      expect(itemWithLink.enrolledCount).toBe(1);
    });
  });

  describe('Session Join Window & Automatic Attendance', () => {
    it('MUST fail join when attempted before the 15-minute join window (returns 400 with time left)', async () => {
      const res = await request(app)
        .post(`/api/sessions/${upcomingSession._id}/join`)
        .set('Authorization', `Bearer ${enrolledStudentToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('JOIN_WINDOW_NOT_OPEN');
      expect(res.body.message).toContain('Class join window is not open yet');
      expect(res.body.errors?.msUntilOpen).toBeGreaterThan(0);
    });

    it('MUST block unapproved students from joining even inside window (returns 403)', async () => {
      const res = await request(app)
        .post(`/api/sessions/${liveSession._id}/join`)
        .set('Authorization', `Bearer ${unenrolledStudentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('ENROLLMENT_REQUIRED');
    });

    it('successfully joins inside window, records attendance (present), and returns meetingLink', async () => {
      const res = await request(app)
        .post(`/api/sessions/${liveSession._id}/join`)
        .set('Authorization', `Bearer ${enrolledStudentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.meetingLink).toBe('https://meet.google.com/live-node-deepdive');
      expect(res.body.data.attendanceStatus).toBe('present');

      // Verify attendance row in database
      const att = await Attendance.findOne({
        session: liveSession._id,
        student: enrolledStudentUser.id || enrolledStudentUser._id,
      });
      expect(att).toBeTruthy();
      expect(att.status).toBe('present');
      expect(att.source).toBe('auto');
    });

    it('MUST NOT create two attendance rows on double join', async () => {
      // Second join call
      const res = await request(app)
        .post(`/api/sessions/${liveSession._id}/join`)
        .set('Authorization', `Bearer ${enrolledStudentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.meetingLink).toBe('https://meet.google.com/live-node-deepdive');

      // Check count in DB
      const count = await Attendance.countDocuments({
        session: liveSession._id,
        student: enrolledStudentUser.id || enrolledStudentUser._id,
      });
      expect(count).toBe(1);
    });
  });

  describe('Manual Attendance & Override Rules', () => {
    it('allows admin to manually mark attendance and override auto attendance', async () => {
      const studentId = enrolledStudentUser.id || enrolledStudentUser._id;

      // Admin manually marks student as 'late' or 'absent'
      const updateRes = await request(app)
        .put(`/api/admin/sessions/${liveSession._id}/attendance`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          attendance: [{ studentId, status: 'late' }],
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);

      const updatedAtt = await Attendance.findOne({
        session: liveSession._id,
        student: studentId,
      });
      expect(updatedAtt.status).toBe('late');
      expect(updatedAtt.source).toBe('manual');

      // Subsequent student join does NOT overwrite instructor manual marking
      const reJoinRes = await request(app)
        .post(`/api/sessions/${liveSession._id}/join`)
        .set('Authorization', `Bearer ${enrolledStudentToken}`);

      expect(reJoinRes.status).toBe(200);
      expect(reJoinRes.body.data.attendanceStatus).toBe('late');

      const reChecked = await Attendance.findOne({
        session: liveSession._id,
        student: studentId,
      });
      expect(reChecked.status).toBe('late');
      expect(reChecked.source).toBe('manual');
    });

    it('calculates student course attendance percentage correctly', async () => {
      // Mark attendance for pastSession
      await Attendance.create({
        session: pastSession._id,
        student: enrolledStudentUser.id || enrolledStudentUser._id,
        course: testCourse._id,
        status: 'present',
        source: 'manual',
      });

      const res = await request(app)
        .get(`/api/courses/${testCourse._id}/my-attendance`)
        .set('Authorization', `Bearer ${enrolledStudentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // pastSession is the only completed session, student attended it
      expect(res.body.data.totalCompleted).toBe(1);
      expect(res.body.data.attended).toBe(1);
      expect(res.body.data.percentage).toBe(100);
    });
  });

  describe('Lecture Notes Access Control (/api/files/url)', () => {
    it('allows approved student to get signed URL for session lecture note', async () => {
      const res = await request(app)
        .get('/api/files/url?key=uploads/pdf/admin/week1.pdf')
        .set('Authorization', `Bearer ${enrolledStudentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.downloadUrl).toBeDefined();
    });

    it('blocks unenrolled student from obtaining signed URL for session note (returns 403)', async () => {
      const res = await request(app)
        .get('/api/files/url?key=uploads/pdf/admin/week1.pdf')
        .set('Authorization', `Bearer ${unenrolledStudentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FILE_ACCESS_DENIED');
    });
  });
});
