import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../models/user.model.js';
import ContactMessage from '../models/contactMessage.model.js';
import Notification from '../models/notification.model.js';

let mongoServer;
let adminToken;
let studentToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // 1. Create Admin
  await request(app)
    .post('/api/auth/register')
    .set('X-Forwarded-For', '10.99.0.1')
    .send({
      name: 'Admin Receiver',
      email: 'admin.contact@example.com',
      password: 'Password123!',
      phone: '03001234567',
    });
  await User.updateOne({ email: 'admin.contact@example.com' }, { role: 'admin' });

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .set('X-Forwarded-For', '10.99.0.2')
    .send({
      email: 'admin.contact@example.com',
      password: 'Password123!',
    });
  adminToken = adminLogin.body.data.token;

  // 2. Create Student
  const studentRes = await request(app)
    .post('/api/auth/register')
    .set('X-Forwarded-For', '10.99.0.3')
    .send({
      name: 'Regular Student',
      email: 'student.contact@example.com',
      password: 'Password123!',
      phone: '03007654321',
    });
  studentToken = studentRes.body.data.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Public Contact Form and Admin Inbox API', () => {
  let createdMessageId;

  it('POST /api/contact - should submit contact inquiry with valid fields', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({
        name: 'Fatima Zahra',
        email: 'fatima@example.com',
        phone: '03123456789',
        subject: 'Batch schedule query',
        message: 'Could you please confirm if classes are recorded if I miss a live session?',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.id).toBeDefined();
    createdMessageId = res.body.data.id;

    // Check notification created for admin
    const notif = await Notification.findOne({ type: 'contact_message' });
    expect(notif).toBeDefined();
    expect(notif.title).toContain('Fatima Zahra');
  });

  it('POST /api/contact - should reject invalid payloads', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({
        name: 'A', // too short
        email: 'not-an-email',
        message: 'Hi', // too short
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/admin/messages - should block unauthenticated and student users', async () => {
    const unauthRes = await request(app).get('/api/admin/messages');
    expect(unauthRes.status).toBe(401);

    const studentRes = await request(app)
      .get('/api/admin/messages')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(studentRes.status).toBe(403);
  });

  it('GET /api/admin/messages - should return messages to admin with pagination', async () => {
    const res = await request(app)
      .get('/api/admin/messages')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.messages).toBeInstanceOf(Array);
    expect(res.body.data.messages.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.pagination.unreadCount).toBeGreaterThanOrEqual(1);
  });

  it('PATCH /api/admin/messages/:id - should allow admin to mark message as read and add notes', async () => {
    const res = await request(app)
      .patch(`/api/admin/messages/${createdMessageId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        read: true,
        replySent: true,
        adminNotes: 'Answered via WhatsApp.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.read).toBe(true);
    expect(res.body.data.replySent).toBe(true);
    expect(res.body.data.adminNotes).toBe('Answered via WhatsApp.');
  });

  it('DELETE /api/admin/messages/:id - should allow admin to delete message', async () => {
    const res = await request(app)
      .delete(`/api/admin/messages/${createdMessageId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const check = await ContactMessage.findById(createdMessageId);
    expect(check).toBeNull();
  });
});
