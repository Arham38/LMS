import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../app.js';
import User from '../models/user.model.js';
import Course from '../models/course.model.js';
import Enrollment from '../models/enrollment.model.js';

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
});

describe('Phase 2.5: Supabase Storage and Access Control', () => {
  let studentUser;
  let studentToken;
  let otherStudentUser;
  let otherStudentToken;
  let adminUser;
  let adminToken;
  let sampleCourse;

  beforeEach(async () => {
    studentUser = await User.create({
      name: 'Ahmed Student',
      email: 'ahmed.storage@student.com',
      password: 'Password123!',
      role: 'student',
    });
    studentToken = studentUser.generateAuthToken();

    otherStudentUser = await User.create({
      name: 'Other Student',
      email: 'other.storage@student.com',
      password: 'Password123!',
      role: 'student',
    });
    otherStudentToken = otherStudentUser.generateAuthToken();

    adminUser = await User.create({
      name: 'Admin Instructor',
      email: 'admin.storage@codecraft.academy',
      password: 'AdminPassword123!',
      role: 'admin',
    });
    adminToken = adminUser.generateAuthToken();

    sampleCourse = await Course.create({
      title: 'MERN Bootcamp',
      slug: 'mern-bootcamp',
      tagline: 'Full-stack course',
      description: 'Course description',
      durationWeeks: 12,
      schedule: 'Tue & Thu 8 PM',
      startDate: new Date(),
      seatsTotal: 25,
      fee: 24000,
      isPublished: true,
      isEnrollmentOpen: true,
    });
  });

  describe('POST /api/uploads/presign (Upload URL Generation)', () => {
    it('MUST reject wrong MIME type for the requested kind', async () => {
      // Trying to upload an executable or text file as an image
      const res = await request(app)
        .post('/api/uploads/presign')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          kind: 'image',
          contentType: 'application/x-msdownload', // invalid exe
          size: 1024 * 100, // 100kb
          filename: 'malicious.exe',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_MIME_TYPE');
    });

    it('MUST reject oversize files exceeding kind limit', async () => {
      // Kind image limit is 5MB. Send 6MB.
      const res = await request(app)
        .post('/api/uploads/presign')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          kind: 'image',
          contentType: 'image/png',
          size: 6 * 1024 * 1024, // 6MB exceeds 5MB limit
          filename: 'huge_screenshot.png',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FILE_TOO_LARGE');
    });

    it('MUST block students from obtaining admin-only upload URLs (kind=pdf)', async () => {
      const res = await request(app)
        .post('/api/uploads/presign')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          kind: 'pdf',
          contentType: 'application/pdf',
          size: 1024 * 500, // 500kb
          filename: 'notes.pdf',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('ADMIN_ONLY_UPLOAD');
    });

    it('allows admin to obtain upload URLs for kind=pdf (notes)', async () => {
      const res = await request(app)
        .post('/api/uploads/presign')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          kind: 'pdf',
          contentType: 'application/pdf',
          size: 1024 * 500,
          filename: 'lecture_01_notes.pdf',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.uploadUrl).toBeDefined();
      expect(res.body.data.key).toMatch(/^uploads\/pdf\//);
    });

    it('allows students to obtain upload URLs for kind=image preserving original filename', async () => {
      const res = await request(app)
        .post('/api/uploads/presign')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          kind: 'image',
          contentType: 'image/png',
          size: 1024 * 300, // 300kb
          filename: 'jazzcash_receipt.png',
          courseId: sampleCourse._id.toString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.uploadUrl).toBeDefined();
      expect(res.body.data.key).toMatch(new RegExp(`^uploads/image/${sampleCourse._id}/${studentUser._id}/\\d+-jazzcash_receipt\\.png$`));
      expect(res.body.data.filename).toBe('jazzcash_receipt.png');
    });
  });

  describe('GET /api/files/url (Download / Preview Access Control)', () => {
    let paymentKey;

    beforeEach(async () => {
      paymentKey = `uploads/image/${studentUser._id}/payment-proof-uuid.png`;

      // Create enrollment with this payment proof key
      await Enrollment.create({
        student: studentUser._id,
        course: sampleCourse._id,
        status: 'pending',
        amountDue: 24000,
        paymentMethod: 'jazzcash',
        transactionId: 'TXN-PROOF-01',
        senderName: 'Ahmed Student',
        senderNumber: '03001234567',
        paymentProofKey: paymentKey,
      });
    });

    it('a student CANNOT get another student file URL (returns 403)', async () => {
      // otherStudent attempts to access Ahmed's payment proof
      const res = await request(app)
        .get(`/api/files/url?key=${encodeURIComponent(paymentKey)}`)
        .set('Authorization', `Bearer ${otherStudentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FILE_ACCESS_DENIED');
    });

    it('owner student CAN get signed download URL for their own payment proof', async () => {
      const res = await request(app)
        .get(`/api/files/url?key=${encodeURIComponent(paymentKey)}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.downloadUrl).toBeDefined();
      expect(res.body.data.expiresIn).toBe(3600);
    });

    it('admin CAN get signed download URL for any student payment proof', async () => {
      const res = await request(app)
        .get(`/api/files/url?key=${encodeURIComponent(paymentKey)}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.downloadUrl).toBeDefined();
    });
  });
});
