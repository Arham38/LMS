import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/user.model.js';
import Course from '../models/course.model.js';
import Enrollment from '../models/enrollment.model.js';
import Settings from '../models/settings.model.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Enrollment.deleteMany({});
  await Course.deleteMany({});
  await User.deleteMany({});
  await Settings.deleteMany({});
});

describe('Phase 2: Courses, Enrollment and Manual Payment', () => {
  let studentUser;
  let studentToken;
  let otherStudentUser;
  let otherStudentToken;
  let adminUser;
  let adminToken;
  let sampleCourse;

  beforeEach(async () => {
    // 1. Create student
    studentUser = await User.create({
      name: 'Ahmed Tariq',
      email: 'ahmed@student.com',
      password: 'Password123!',
      role: 'student',
    });
    studentToken = studentUser.generateAuthToken();

    // 2. Create another student
    otherStudentUser = await User.create({
      name: 'Other Student',
      email: 'other@student.com',
      password: 'Password123!',
      role: 'student',
    });
    otherStudentToken = otherStudentUser.generateAuthToken();

    // 3. Create admin
    adminUser = await User.create({
      name: 'Instructor Admin',
      email: 'admin@codecraft.academy',
      password: 'AdminPassword123!',
      role: 'admin',
    });
    adminToken = adminUser.generateAuthToken();

    // 4. Create sample published course
    sampleCourse = await Course.create({
      title: 'MERN Full-Stack Bootcamp',
      slug: 'mern-full-stack-bootcamp',
      tagline: 'Master full-stack engineering',
      description: 'Comprehensive 16-week live online course.',
      durationWeeks: 16,
      schedule: 'Tue & Thu 8:00 PM - 10:00 PM PKT',
      startDate: new Date('2026-11-15'),
      seatsTotal: 2, // Small seat limit to easily test enforcement
      fee: 24000,
      isPublished: true,
      isEnrollmentOpen: true,
    });
  });

  describe('Enrollment Creation & Security Rules', () => {
    it('MUST ensure student CANNOT set amount or status (tampered payload is ignored)', async () => {
      const maliciousPayload = {
        courseId: sampleCourse._id.toString(),
        paymentMethod: 'jazzcash',
        transactionId: 'TXN-98234812',
        senderName: 'Ahmed Tariq',
        senderNumber: '03001234567',
        paymentNote: 'Testing fee tamper',
        // Malicious client tampering:
        amountDue: 0,
        amountPaid: 99999,
        status: 'approved',
      };

      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(maliciousPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const enrollment = res.body.data;
      // Server must enforce course.fee and status 'pending'
      expect(enrollment.amountDue).toBe(sampleCourse.fee); // 24000, NOT 0
      expect(enrollment.amountPaid).toBe(0); // NOT 99999
      expect(enrollment.status).toBe('pending'); // NOT 'approved'

      // Check directly in database
      const dbRecord = await Enrollment.findById(enrollment._id);
      expect(dbRecord.amountDue).toBe(24000);
      expect(dbRecord.status).toBe('pending');
    });

    it('MUST block duplicate active enrollment for the same student and course', async () => {
      const validPayload = {
        courseId: sampleCourse._id.toString(),
        paymentMethod: 'jazzcash',
        transactionId: 'TXN-001',
        senderName: 'Ahmed Tariq',
        senderNumber: '03001234567',
      };

      // 1. First enrollment succeeds
      const firstRes = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(validPayload);
      expect(firstRes.status).toBe(201);

      // 2. Second enrollment request while first is pending must fail with 409
      const secondRes = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          ...validPayload,
          transactionId: 'TXN-002',
        });

      expect(secondRes.status).toBe(409);
      expect(secondRes.body.success).toBe(false);
      expect(secondRes.body.code).toBe('DUPLICATE_ACTIVE_ENROLLMENT');
    });

    it('MUST enforce the seat limit (rejects new enrollments when seats are full)', async () => {
      // Course seatsTotal is 2. Fill both seats with approved enrollments.
      const studentA = await User.create({
        name: 'Student A',
        email: 'a@student.com',
        password: 'Password123!',
        role: 'student',
      });
      const studentB = await User.create({
        name: 'Student B',
        email: 'b@student.com',
        password: 'Password123!',
        role: 'student',
      });

      await Enrollment.create([
        {
          student: studentA._id,
          course: sampleCourse._id,
          status: 'approved',
          amountDue: 24000,
          amountPaid: 24000,
          paymentMethod: 'bank',
          transactionId: 'IBFT-A',
          senderName: 'Student A',
          senderNumber: '03001111111',
        },
        {
          student: studentB._id,
          course: sampleCourse._id,
          status: 'approved',
          amountDue: 24000,
          amountPaid: 24000,
          paymentMethod: 'bank',
          transactionId: 'IBFT-B',
          senderName: 'Student B',
          senderNumber: '03002222222',
        },
      ]);

      // Now studentUser attempts to enroll in the full course
      const res = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseId: sampleCourse._id.toString(),
          paymentMethod: 'jazzcash',
          transactionId: 'TXN-FULL',
          senderName: 'Ahmed Tariq',
          senderNumber: '03001234567',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('COHORT_FULL');
    });

    it('allows a rejected enrollment to be re-submitted', async () => {
      // 1. Create initial enrollment
      const createRes = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseId: sampleCourse._id.toString(),
          paymentMethod: 'jazzcash',
          transactionId: 'TXN-BAD',
          senderName: 'Ahmed Tariq',
          senderNumber: '03001234567',
        });
      expect(createRes.status).toBe(201);
      const enrollmentId = createRes.body.data._id;

      // 2. Admin rejects with reason
      const rejectRes = await request(app)
        .patch(`/api/admin/enrollments/${enrollmentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'reject',
          adminNote: 'Transaction ID not found in JazzCash statement. Please verify.',
        });
      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.data.status).toBe('rejected');

      // 3. Student re-submits with corrected transactionId
      const resubmitRes = await request(app)
        .post('/api/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          courseId: sampleCourse._id.toString(),
          paymentMethod: 'jazzcash',
          transactionId: 'TXN-CORRECTED-99',
          senderName: 'Ahmed Tariq',
          senderNumber: '03001234567',
        });

      expect(resubmitRes.status).toBe(201);
      expect(resubmitRes.body.data.status).toBe('pending');
      expect(resubmitRes.body.data.transactionId).toBe('TXN-CORRECTED-99');
    });
  });

  describe('Review & Access Control', () => {
    let testEnrollment;

    beforeEach(async () => {
      testEnrollment = await Enrollment.create({
        student: studentUser._id,
        course: sampleCourse._id,
        status: 'pending',
        amountDue: sampleCourse.fee,
        paymentMethod: 'jazzcash',
        transactionId: 'TXN-INITIAL',
        senderName: 'Ahmed Tariq',
        senderNumber: '03001234567',
      });
    });

    it('ONLY the admin can approve an enrollment', async () => {
      // Student attempts to approve own enrollment
      const studentAttempt = await request(app)
        .patch(`/api/admin/enrollments/${testEnrollment._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ action: 'approve' });

      expect(studentAttempt.status).toBe(403);
      expect(studentAttempt.body.code).toBe('FORBIDDEN');

      // Admin approves successfully
      const adminAttempt = await request(app)
        .patch(`/api/admin/enrollments/${testEnrollment._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'approve', amountPaid: 24000 });

      expect(adminAttempt.status).toBe(200);
      expect(adminAttempt.body.data.status).toBe('approved');
      expect(adminAttempt.body.data.amountPaid).toBe(24000);
    });

    it('a student CANNOT read another student enrollment record', async () => {
      // otherStudent attempts to access studentUser's enrollment
      const res = await request(app)
        .get(`/api/enrollments/${testEnrollment._id}`)
        .set('Authorization', `Bearer ${otherStudentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('owner student and admin CAN read the enrollment record', async () => {
      // Owner read
      const ownerRes = await request(app)
        .get(`/api/enrollments/${testEnrollment._id}`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(ownerRes.status).toBe(200);
      expect(ownerRes.body.data._id).toBe(testEnrollment._id.toString());

      // Admin read
      const adminRes = await request(app)
        .get(`/api/enrollments/${testEnrollment._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);
      expect(adminRes.body.data._id).toBe(testEnrollment._id.toString());
    });

    it('a course with existing enrollments CANNOT be deleted (only unpublished)', async () => {
      const deleteRes = await request(app)
        .delete(`/api/admin/courses/${sampleCourse._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(deleteRes.status).toBe(400);
      expect(deleteRes.body.success).toBe(false);
      expect(deleteRes.body.code).toBe('COURSE_HAS_ENROLLMENTS');
    });
  });
});
