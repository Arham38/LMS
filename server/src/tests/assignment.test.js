import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../models/user.model.js';
import Course from '../models/course.model.js';
import Enrollment from '../models/enrollment.model.js';
import Assignment from '../models/assignment.model.js';
import Submission from '../models/submission.model.js';

let mongoServer;
let adminToken;
let student1Token;
let student1User;
let student2Token;
let student2User;
let unenrolledStudentToken;
let testCourse;
let testAssignment;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // 1. Admin setup
  await request(app)
    .post('/api/auth/register')
    .set('X-Forwarded-For', '10.9.0.1')
    .send({
      name: 'Admin Assignment Tester',
      email: 'admin.assignment@codecraft.com',
      password: 'Password123!',
      phone: '03001112233',
    });
  await User.updateOne({ email: 'admin.assignment@codecraft.com' }, { role: 'admin' });

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .set('X-Forwarded-For', '10.9.0.2')
    .send({
      email: 'admin.assignment@codecraft.com',
      password: 'Password123!',
    });
  adminToken = adminLogin.body.data.token;

  // 2. Student 1 (Enrolled)
  const s1Res = await request(app)
    .post('/api/auth/register')
    .set('X-Forwarded-For', '10.9.0.3')
    .send({
      name: 'Assignment Student One',
      email: 'student1.assignment@gmail.com',
      password: 'Password123!',
      phone: '03004445566',
    });
  student1Token = s1Res.body.data.token;
  student1User = s1Res.body.data.user;

  // 3. Student 2 (Enrolled)
  const s2Res = await request(app)
    .post('/api/auth/register')
    .set('X-Forwarded-For', '10.9.0.4')
    .send({
      name: 'Assignment Student Two',
      email: 'student2.assignment@gmail.com',
      password: 'Password123!',
      phone: '03007778899',
    });
  student2Token = s2Res.body.data.token;
  student2User = s2Res.body.data.user;

  // 4. Student 3 (Unenrolled)
  const s3Res = await request(app)
    .post('/api/auth/register')
    .set('X-Forwarded-For', '10.9.0.5')
    .send({
      name: 'Unenrolled Assignment Student',
      email: 'student.unenrolled.assignment@gmail.com',
      password: 'Password123!',
      phone: '03001239876',
    });
  unenrolledStudentToken = s3Res.body.data.token;

  // 5. Course
  testCourse = await Course.create({
    title: 'Full Stack Engineering Cohort',
    slug: 'full-stack-engineering-cohort',
    tagline: 'Production full stack testing',
    description: 'Learn modern software development.',
    level: 'All Levels',
    durationWeeks: 12,
    schedule: 'Mon & Wed 8 to 10 PM PKT',
    startDate: new Date(),
    seatsTotal: 25,
    fee: 25000,
    isPublished: true,
    isEnrollmentOpen: true,
  });

  // 6. Enrollments for Student 1 and Student 2
  await Enrollment.create([
    {
      student: student1User._id || student1User.id,
      course: testCourse._id,
      status: 'approved',
      amountDue: 25000,
      amountPaid: 25000,
      paymentMethod: 'bank',
      senderName: 'Student One',
      senderNumber: '03004445566',
      transactionId: 'TXN-ASSIGN-01',
    },
    {
      student: student2User._id || student2User.id,
      course: testCourse._id,
      status: 'approved',
      amountDue: 25000,
      amountPaid: 25000,
      paymentMethod: 'jazzcash',
      senderName: 'Student Two',
      senderNumber: '03007778899',
      transactionId: 'TXN-ASSIGN-02',
    },
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Phase 5: Assignment & Grading System', () => {
  describe('Admin Assignment Management', () => {
    it('creates an assignment with rubric, due date, and late penalty', async () => {
      const futureDue = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const res = await request(app)
        .post(`/api/admin/courses/${testCourse._id}/assignments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          week: 1,
          title: 'Build a REST API with Express & Mongoose',
          description: '# Task 1\nBuild authenticated CRUD endpoints.',
          dueAt: futureDue,
          maxMarks: 100,
          submissionType: 'either',
          allowLate: true,
          latePenaltyPercent: 10,
          allowResubmit: true,
          rubric: [
            { criterion: 'API Route Structure & Error Handling', maxMarks: 40 },
            { criterion: 'MongoDB Schema & Indexes', maxMarks: 30 },
            { criterion: 'Authentication & Security Best Practices', maxMarks: 30 },
          ],
          isPublished: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Build a REST API with Express & Mongoose');
      expect(res.body.data.rubric).toHaveLength(3);
      testAssignment = res.body.data;
    });

    it('lists assignments for the course with submission aggregates', async () => {
      const res = await request(app)
        .get(`/api/admin/courses/${testCourse._id}/assignments`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].title).toBe('Build a REST API with Express & Mongoose');
      expect(res.body.data.items[0].metrics.totalSubmitted).toBe(0);
    });

    it('updates assignment details', async () => {
      const res = await request(app)
        .put(`/api/admin/assignments/${testAssignment._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Build a Production REST API with Express & Mongoose',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Build a Production REST API with Express & Mongoose');
    });
  });

  describe('Student Access & Submissions', () => {
    it('blocks unenrolled students from viewing course assignments', async () => {
      const res = await request(app)
        .get(`/api/courses/${testCourse._id}/assignments`)
        .set('Authorization', `Bearer ${unenrolledStudentToken}`);

      expect(res.status).toBe(403);
    });

    it('allows enrolled student to list assignments with submission status', async () => {
      const res = await request(app)
        .get(`/api/courses/${testCourse._id}/assignments`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].mySubmission).toBeNull();
      expect(res.body.data.items[0].status).toBe('not_submitted');
    });

    it('allows enrolled student to submit a valid solution on time', async () => {
      const res = await request(app)
        .post(`/api/assignments/${testAssignment._id}/submit`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          link: 'https://github.com/codecraft/rest-api-hw',
          comment: 'Completed all CRUD routes with Jest tests.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('submitted');
      expect(res.body.data.version).toBe(1);
      expect(res.body.data.link).toBe('https://github.com/codecraft/rest-api-hw');
    });

    it('records revision history when student updates solution before grading', async () => {
      const res = await request(app)
        .post(`/api/assignments/${testAssignment._id}/submit`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          link: 'https://github.com/codecraft/rest-api-hw-v2',
          comment: 'Updated with rate limiting middleware.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.version).toBe(2);
      expect(res.body.data.history).toHaveLength(1);
      expect(res.body.data.history[0].version).toBe(1);
      expect(res.body.data.history[0].link).toBe('https://github.com/codecraft/rest-api-hw');
    });

    it('student can retrieve their own submission details', async () => {
      const res = await request(app)
        .get(`/api/assignments/${testAssignment._id}/my-submission`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.version).toBe(2);
      expect(res.body.data.comment).toBe('Updated with rate limiting middleware.');
    });
  });

  describe('Late Submissions & Penalty Enforcement', () => {
    let pastStrictAssignment;
    let pastLateAssignment;

    beforeAll(async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Strict assignment (allowLate: false)
      pastStrictAssignment = await Assignment.create({
        course: testCourse._id,
        week: 2,
        title: 'Strict Assignment: No Late Submissions',
        description: 'Hard deadline.',
        dueAt: pastDate,
        maxMarks: 100,
        submissionType: 'link',
        allowLate: false,
        latePenaltyPercent: 0,
        isPublished: true,
      });

      // Flexible assignment (allowLate: true, 15% penalty)
      pastLateAssignment = await Assignment.create({
        course: testCourse._id,
        week: 2,
        title: 'Late Assignment with 15% Penalty',
        description: 'Late submissions allowed with deduction.',
        dueAt: pastDate,
        maxMarks: 100,
        submissionType: 'link',
        allowLate: true,
        latePenaltyPercent: 15,
        isPublished: true,
      });
    });

    it('rejects late submission when allowLate is false', async () => {
      const res = await request(app)
        .post(`/api/assignments/${pastStrictAssignment._id}/submit`)
        .set('Authorization', `Bearer ${student2Token}`)
        .send({
          link: 'https://github.com/student2/strict-hw',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('LATE_SUBMISSIONS_BLOCKED');
    });

    it('accepts late submission when allowLate is true and marks status as late', async () => {
      const res = await request(app)
        .post(`/api/assignments/${pastLateAssignment._id}/submit`)
        .set('Authorization', `Bearer ${student2Token}`)
        .send({
          link: 'https://github.com/student2/flexible-hw',
          comment: 'Submitted after deadline.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('late');
    });

    it('automatically applies late penalty when admin grades a late submission', async () => {
      const student2Sub = await Submission.findOne({
        assignment: pastLateAssignment._id,
        student: student2User._id || student2User.id,
      });

      const res = await request(app)
        .patch(`/api/admin/submissions/${student2Sub._id}/grade`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          marks: 80,
          feedback: 'Solid work, but penalty applies for late submission.',
          action: 'grade',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.marks).toBe(80);
      // 15% penalty on 80 marks = 12 marks penalty
      expect(res.body.data.latePenaltyApplied).toBe(12);
      // finalMarks = 80 - 12 = 68
      expect(res.body.data.finalMarks).toBe(68);
      expect(res.body.data.status).toBe('graded');
    });
  });

  describe('Admin Grading, Resubmission & Roster View', () => {
    let student1Submission;

    it('admin views submissions list including students who have not submitted', async () => {
      const res = await request(app)
        .get(`/api/admin/assignments/${testAssignment._id}/submissions`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(2); // Student 1 submitted, Student 2 not submitted

      const s1 = res.body.data.items.find((s) => s.student.email === 'student1.assignment@gmail.com');
      const s2 = res.body.data.items.find((s) => s.student.email === 'student2.assignment@gmail.com');

      expect(s1).toBeDefined();
      expect(s1.status).toBe('submitted');
      student1Submission = s1;

      expect(s2).toBeDefined();
      expect(s2.status).toBe('not_submitted');
      expect(s2.isVirtual).toBe(true);
    });

    it('rejects grade marks that exceed assignment maxMarks', async () => {
      const res = await request(app)
        .patch(`/api/admin/submissions/${student1Submission._id}/grade`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          marks: 105,
          feedback: 'Too generous.',
          action: 'grade',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('MARKS_EXCEED_MAX');
    });

    it('admin grades submission successfully with rubric marks and feedback', async () => {
      const res = await request(app)
        .patch(`/api/admin/submissions/${student1Submission._id}/grade`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          marks: 95,
          rubricMarks: [
            { criterion: 'API Route Structure & Error Handling', marks: 38 },
            { criterion: 'MongoDB Schema & Indexes', marks: 28 },
            { criterion: 'Authentication & Security Best Practices', marks: 29 },
          ],
          feedback: 'Excellent implementation of JWT auth and indexes.',
          action: 'grade',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.marks).toBe(95);
      expect(res.body.data.finalMarks).toBe(95);
      expect(res.body.data.status).toBe('graded');
      expect(res.body.data.rubricMarks).toHaveLength(3);
    });

    it('blocks student from resubmitting once assignment has been graded and not returned', async () => {
      const res = await request(app)
        .post(`/api/assignments/${testAssignment._id}/submit`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          link: 'https://github.com/codecraft/rest-api-hw-v3',
          comment: 'Can I get extra credit?',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('ALREADY_GRADED');
    });

    it('admin can return a submission for revision with feedback', async () => {
      const res = await request(app)
        .patch(`/api/admin/submissions/${student1Submission._id}/grade`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          marks: 60,
          feedback: 'Missing rate-limiting tests. Please add and resubmit.',
          action: 'return',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('returned');
    });

    it('student is permitted to resubmit when submission has been returned', async () => {
      const res = await request(app)
        .post(`/api/assignments/${testAssignment._id}/submit`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          link: 'https://github.com/codecraft/rest-api-hw-revised',
          comment: 'Added rate limiter unit tests as requested.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.version).toBe(3);
      expect(res.body.data.status).toBe('submitted');
    });

    it('admin exports assignment marks as CSV', async () => {
      const res = await request(app)
        .get(`/api/admin/assignments/${testAssignment._id}/export`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Student Name,Email,Phone,Submission Status,Version,Raw Marks,Late Penalty Deducted,Final Marks');
      expect(res.text).toContain('student1.assignment@gmail.com');
      expect(res.text).toContain('student2.assignment@gmail.com');
    });
  });

  describe('File Download Security & Privacy', () => {
    let mockSubmission;
    let fileAssignment;

    beforeAll(async () => {
      fileAssignment = await Assignment.create({
        course: testCourse._id,
        week: 4,
        title: 'Project Architecture Archive',
        description: 'Download security test assignment',
        dueAt: new Date(Date.now() + 86400000),
        maxMarks: 50,
        submissionType: 'file',
        isPublished: true,
      });

      mockSubmission = await Submission.create({
        assignment: fileAssignment._id,
        student: student1User._id || student1User.id,
        course: testCourse._id,
        fileKey: 'submissions/student1/archive-secret-1234.zip',
        status: 'submitted',
        version: 1,
      });
    });

    it('prevents another student from obtaining signed URL to download student1 submission file', async () => {
      const res = await request(app)
        .get('/api/files/url')
        .query({ key: 'submissions/student1/archive-secret-1234.zip' })
        .set('Authorization', `Bearer ${student2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FILE_ACCESS_DENIED');
    });

    it('allows the owner student to obtain download URL', async () => {
      const res = await request(app)
        .get('/api/files/url')
        .query({ key: 'submissions/student1/archive-secret-1234.zip' })
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.downloadUrl).toBeDefined();
    });

    it('allows admin to obtain download URL for any student submission file', async () => {
      const res = await request(app)
        .get('/api/files/url')
        .query({ key: 'submissions/student1/archive-secret-1234.zip' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.downloadUrl).toBeDefined();
    });
  });
});
