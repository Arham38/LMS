import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../models/user.model.js';
import env from '../config/env.js';

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
  await User.deleteMany({});
});

describe('Phase 1: Authentication and Account Access Control', () => {
  const studentData = {
    name: 'Hamza Tariq',
    email: 'hamza.tariq@gmail.com',
    password: 'Password123!',
    phone: '03001234567',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new student and return token and user object', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(studentData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(studentData.email);
      expect(res.body.data.user.role).toBe('student');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('MUST ignore any role=admin sent in the body and ALWAYS create student', async () => {
      const maliciousPayload = {
        ...studentData,
        email: 'malicious@example.com',
        role: 'admin', // Attempt privilege escalation
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(maliciousPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('student');

      // Verify directly in database
      const savedUser = await User.findOne({ email: 'malicious@example.com' });
      expect(savedUser.role).toBe('student');
    });

    it('should reject registration if email is already taken', async () => {
      await request(app).post('/api/auth/register').send(studentData);
      const res = await request(app).post('/api/auth/register').send(studentData);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('EMAIL_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        ...studentData,
        role: 'student',
      });
    });

    it('should return identical generic error for non-existent email vs wrong password', async () => {
      // 1. Non-existent email
      const wrongEmailRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: studentData.password });

      // 2. Existing email with wrong password
      const wrongPasswordRes = await request(app)
        .post('/api/auth/login')
        .send({ email: studentData.email, password: 'WrongPassword999!' });

      expect(wrongEmailRes.status).toBe(401);
      expect(wrongPasswordRes.status).toBe(401);
      expect(wrongEmailRes.body.message).toBe('Invalid email or password.');
      expect(wrongPasswordRes.body.message).toBe('Invalid email or password.');
      expect(wrongEmailRes.body.code).toBe('INVALID_CREDENTIALS');
      expect(wrongPasswordRes.body.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return clear message when an inactive user attempts to log in', async () => {
      await User.updateOne({ email: studentData.email }, { isActive: false });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: studentData.email, password: studentData.password });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('ACCOUNT_DEACTIVATED');
      expect(res.body.message).toMatch(/account has been deactivated/i);
    });

    it('should successfully log in and return token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: studentData.email, password: studentData.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(studentData.email);
    });
  });

  describe('Access Control and Token Invalidation', () => {
    let studentUser;
    let studentToken;

    beforeEach(async () => {
      studentUser = await User.create({
        ...studentData,
        role: 'student',
      });
      studentToken = studentUser.generateAuthToken();
    });

    it('should block an inactive user even when using a previously valid token', async () => {
      // Deactivate user in database
      studentUser.isActive = false;
      await studentUser.save();

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('ACCOUNT_DEACTIVATED');
    });

    it('should invalidate old tokens after user changes password', async () => {
      // Issue a token with an iat from 10 seconds ago
      const pastToken = jwt.sign(
        { id: studentUser._id, role: studentUser.role, iat: Math.floor(Date.now() / 1000) - 10 },
        env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Verify token works initially
      const initialRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${pastToken}`);
      expect(initialRes.status).toBe(200);

      // Change password
      const changeRes = await request(app)
        .patch('/api/auth/change-password')
        .set('Authorization', `Bearer ${pastToken}`)
        .send({
          currentPassword: studentData.password,
          newPassword: 'NewSecurePassword123!',
        });

      expect(changeRes.status).toBe(200);
      expect(changeRes.body.data.token).toBeDefined();

      // Old token should now be rejected because passwordChangedAt is after token's iat
      const oldTokenRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${pastToken}`);

      expect(oldTokenRes.status).toBe(401);
      expect(oldTokenRes.body.code).toBe('TOKEN_INVALIDATED');

      // New token should work
      const newTokenRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${changeRes.body.data.token}`);

      expect(newTokenRes.status).toBe(200);
    });

    it('should return 403 Forbidden when a student accesses an admin-only route', async () => {
      const res = await request(app)
        .get('/api/admin/ping')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should allow admin access to admin-only route', async () => {
      const adminUser = await User.create({
        name: 'Admin Tester',
        email: 'admin.test@codecraft.academy',
        password: 'AdminPassword123!',
        role: 'admin',
      });
      const adminToken = adminUser.generateAuthToken();

      const res = await request(app)
        .get('/api/admin/ping')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('admin');
    });
  });

  describe('Password Reset Flow', () => {
    const resetIp = '10.0.0.3';

    it('should generate reset token and allow password reset', async () => {
      const user = await User.create(studentData);

      // 1. Request reset
      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .set('X-Forwarded-For', resetIp)
        .send({ email: studentData.email });

      expect(forgotRes.status).toBe(200);
      expect(forgotRes.body.success).toBe(true);

      // Verify token in db
      const userWithToken = await User.findOne({ email: studentData.email }).select(
        '+passwordResetToken +passwordResetExpires'
      );
      expect(userWithToken.passwordResetToken).toBeDefined();
      expect(userWithToken.passwordResetExpires).toBeDefined();

      // Generate raw token manually to simulate email link
      const resetToken = user.createPasswordResetToken();
      await user.save();

      // 2. Submit new password with token
      const resetRes = await request(app)
        .post('/api/auth/reset-password')
        .set('X-Forwarded-For', resetIp)
        .send({
          token: resetToken,
          newPassword: 'BrandNewPassword99!',
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // 3. Verify login works with new password and fails with old
      const oldLogin = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', resetIp)
        .send({ email: studentData.email, password: studentData.password });
      expect(oldLogin.status).toBe(401);

      const newLogin = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', resetIp)
        .send({ email: studentData.email, password: 'BrandNewPassword99!' });
      expect(newLogin.status).toBe(200);
    });
  });

  describe('Rate Limiter Check on Auth Routes', () => {
    it('should enforce rate limit after exceeding 10 auth attempts in window', async () => {
      const email = 'ratelimit.test@example.com';
      const password = 'WrongPassword123!';
      const testIp = '198.51.100.42';

      // Perform 10 failed login attempts from testIp
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/auth/login')
          .set('X-Forwarded-For', testIp)
          .send({ email, password });
      }

      // The 11th request from the same testIp must be rejected with 429 Too Many Requests
      const blockedRes = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', testIp)
        .send({ email, password });

      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.success).toBe(false);
      expect(blockedRes.body.code).toBe('RATE_LIMITED_AUTH');
    });
  });
});
