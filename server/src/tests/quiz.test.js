import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import User from '../models/user.model.js';
import Course from '../models/course.model.js';
import Enrollment from '../models/enrollment.model.js';
import Quiz from '../models/quiz.model.js';
import QuizAttempt from '../models/quizAttempt.model.js';

let mongoServer;
let adminToken;
let student1Token;
let student1User;
let student2Token;
let student2User;
let unenrolledStudentToken;
let testCourse;
let testQuiz;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // 1. Admin
  await request(app)
    .post('/api/auth/register')
    .set('X-Forwarded-For', '10.8.0.1')
    .send({
      name: 'Admin Instructor',
      email: 'admin.quiz@codecraft.com',
      password: 'Password123!',
      phone: '03001112233',
    });
  await User.updateOne({ email: 'admin.quiz@codecraft.com' }, { role: 'admin' });

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .set('X-Forwarded-For', '10.8.0.2')
    .send({
      email: 'admin.quiz@codecraft.com',
      password: 'Password123!',
    });
  adminToken = adminLogin.body.data.token;

  // 2. Student 1 (Enrolled)
  const s1Res = await request(app)
    .post('/api/auth/register')
    .set('X-Forwarded-For', '10.8.0.3')
    .send({
      name: 'Quiz Student One',
      email: 'student1.quiz@gmail.com',
      password: 'Password123!',
      phone: '03004445566',
    });
  student1Token = s1Res.body.data.token;
  student1User = s1Res.body.data.user;

  // 3. Student 2 (Enrolled)
  const s2Res = await request(app)
    .post('/api/auth/register')
    .set('X-Forwarded-For', '10.8.0.4')
    .send({
      name: 'Quiz Student Two',
      email: 'student2.quiz@gmail.com',
      password: 'Password123!',
      phone: '03007778899',
    });
  student2Token = s2Res.body.data.token;
  student2User = s2Res.body.data.user;

  // 4. Student 3 (Unenrolled)
  const s3Res = await request(app)
    .post('/api/auth/register')
    .set('X-Forwarded-For', '10.8.0.5')
    .send({
      name: 'Unenrolled Student',
      email: 'student.unenrolled.quiz@gmail.com',
      password: 'Password123!',
      phone: '03001239876',
    });
  unenrolledStudentToken = s3Res.body.data.token;

  // 5. Create Course
  testCourse = await Course.create({
    title: 'MERN Engineering Cohort',
    slug: 'mern-engineering-cohort',
    tagline: 'Production full stack testing',
    description: 'Learn modern software development.',
    level: 'All Levels',
    durationWeeks: 12,
    schedule: 'Tue & Thu 8 to 10 PM PKT',
    startDate: new Date(),
    seatsTotal: 25,
    fee: 20000,
    isPublished: true,
    isEnrollmentOpen: true,
  });

  // 6. Enroll Student 1 and Student 2
  await Enrollment.create({
    student: student1User.id || student1User._id,
    course: testCourse._id,
    status: 'approved',
    amountDue: 20000,
    amountPaid: 20000,
    paymentMethod: 'bank',
    transactionId: 'TXN-Q-1',
    senderName: 'Quiz Student One',
    senderNumber: '03004445566',
  });

  await Enrollment.create({
    student: student2User.id || student2User._id,
    course: testCourse._id,
    status: 'approved',
    amountDue: 20000,
    amountPaid: 20000,
    paymentMethod: 'jazzcash',
    transactionId: 'TXN-Q-2',
    senderName: 'Quiz Student Two',
    senderNumber: '03007778899',
  });

  // 7. Create Test Quiz with 3 questions (single, multiple, true_false)
  testQuiz = await Quiz.create({
    course: testCourse._id,
    week: 1,
    title: 'Node.js Internals & Asynchronous I/O',
    instructions: 'Select the best answers for each question.',
    timeLimitMinutes: 10,
    maxAttempts: 1, // Single attempt only
    passingPercent: 60,
    showAnswers: 'immediately',
    isPublished: true,
    questions: [
      {
        text: 'Which libuv phase executes setTimeout callbacks?',
        type: 'single',
        options: ['Timers phase', 'Poll phase', 'Check phase', 'Close phase'],
        correctIndexes: [0], // Option A (index 0)
        explanation: 'The timers phase handles callbacks scheduled by setTimeout() and setInterval().',
        marks: 2,
      },
      {
        text: 'Which of the following are valid Node.js built-in streams? (Select all that apply)',
        type: 'multiple',
        options: ['Readable', 'Writable', 'Transform', 'Channel'],
        correctIndexes: [0, 1, 2], // Options A, B, C
        explanation: 'Node.js provides Readable, Writable, Duplex, and Transform stream classes.',
        marks: 3,
      },
      {
        text: 'process.nextTick executes before the next event loop phase.',
        type: 'true_false',
        options: ['True', 'False'],
        correctIndexes: [0], // True
        explanation: 'process.nextTick queue is drained immediately after the current operation finishes.',
        marks: 1,
      },
    ],
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Phase 4: Quizzes Engine (Auto-Graded)', () => {
  describe('Security & Information Hiding', () => {
    it('MUST block unenrolled student from viewing or starting quizzes (returns 403)', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${testQuiz._id}/start`)
        .set('Authorization', `Bearer ${unenrolledStudentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('ENROLLMENT_REQUIRED');
    });

    it('MUST NEVER return correctIndexes or explanation before submission when starting quiz', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${testQuiz._id}/start`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.attemptId).toBeDefined();
      expect(res.body.data.deadlineAt).toBeDefined();
      expect(Array.isArray(res.body.data.questions)).toBe(true);
      expect(res.body.data.questions.length).toBe(3);

      // Verify each question is stripped of answers and explanations
      res.body.data.questions.forEach((q) => {
        expect(q.correctIndexes).toBeUndefined();
        expect(q.explanation).toBeUndefined();
        expect(q.text).toBeDefined();
        expect(q.options.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('MUST block a student from viewing another student attempt (returns 403)', async () => {
      // Student 1 starts attempt
      const startRes = await request(app)
        .post(`/api/quizzes/${testQuiz._id}/start`)
        .set('Authorization', `Bearer ${student1Token}`);

      const attemptId = startRes.body.data.attemptId;

      // Student 2 attempts to fetch Student 1's attempt
      const res = await request(app)
        .get(`/api/attempts/${attemptId}`)
        .set('Authorization', `Bearer ${student2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Attempt Limit Enforcement', () => {
    it('MUST enforce attempt limit: cannot start a new attempt when maxAttempts is reached', async () => {
      // Student 1 finishes active attempt
      const startRes = await request(app)
        .post(`/api/quizzes/${testQuiz._id}/start`)
        .set('Authorization', `Bearer ${student1Token}`);

      const attemptId = startRes.body.data.attemptId;

      // Submit attempt
      await request(app)
        .post(`/api/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ answers: [] });

      // Try starting a 2nd attempt on maxAttempts=1 quiz
      const secondAttemptRes = await request(app)
        .post(`/api/quizzes/${testQuiz._id}/start`)
        .set('Authorization', `Bearer ${student1Token}`);

      expect(secondAttemptRes.status).toBe(400);
      expect(secondAttemptRes.body.success).toBe(false);
      expect(secondAttemptRes.body.code).toBe('MAX_ATTEMPTS_REACHED');
    });
  });

  describe('Server-Side Grading & Deadline Enforcement', () => {
    it('accurately grades single, multiple, and true/false questions', async () => {
      // Student 2 starts fresh attempt
      const startRes = await request(app)
        .post(`/api/quizzes/${testQuiz._id}/start`)
        .set('Authorization', `Bearer ${student2Token}`);

      const attemptId = startRes.body.data.attemptId;
      const questions = startRes.body.data.questions;

      const q1 = questions.find((q) => q.type === 'single');
      const q2 = questions.find((q) => q.type === 'multiple');
      const q3 = questions.find((q) => q.type === 'true_false');

      // Answers:
      // Q1: correct index 0 (2 marks)
      // Q2: correct indexes [0, 1, 2] (3 marks)
      // Q3: answer WRONG index 1 (0 of 1 mark)
      // Expected total: 5 / 6 marks -> 83% (PASSED)
      const submitRes = await request(app)
        .post(`/api/attempts/${attemptId}/submit`)
        .set('Authorization', `Bearer ${student2Token}`)
        .send({
          answers: [
            { questionId: q1._id, selectedIndexes: [0] },
            { questionId: q2._id, selectedIndexes: [0, 1, 2] },
            { questionId: q3._id, selectedIndexes: [1] },
          ],
        });

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.success).toBe(true);
      expect(submitRes.body.data.score).toBe(5);
      expect(submitRes.body.data.totalMarks).toBe(6);
      expect(submitRes.body.data.percent).toBe(83);
      expect(submitRes.body.data.passed).toBe(true);

      // Review answers are now released (policy: immediately)
      expect(submitRes.body.data.review.canShowAnswers).toBe(true);
      expect(submitRes.body.data.review.questions[0].correctIndexes).toEqual([0]);
    });

    it('enforces server-side deadline: auto-submits when expired', async () => {
      // Create timed quiz with short deadline
      const shortQuiz = await Quiz.create({
        course: testCourse._id,
        week: 2,
        title: 'Timed Express Quiz',
        timeLimitMinutes: 1,
        maxAttempts: 2,
        isPublished: true,
        questions: [
          {
            text: 'Is Express unopinionated?',
            type: 'true_false',
            options: ['True', 'False'],
            correctIndexes: [0],
            marks: 5,
          },
        ],
      });

      // Student 2 starts attempt
      const startRes = await request(app)
        .post(`/api/quizzes/${shortQuiz._id}/start`)
        .set('Authorization', `Bearer ${student2Token}`);

      const attemptId = startRes.body.data.attemptId;

      // Force deadline into past on the database
      await QuizAttempt.updateOne(
        { _id: attemptId },
        { deadlineAt: new Date(Date.now() - 60 * 1000) }
      );

      // Student tries to autosave answers past deadline
      const saveRes = await request(app)
        .patch(`/api/attempts/${attemptId}/answers`)
        .set('Authorization', `Bearer ${student2Token}`)
        .send({ answers: [] });

      expect(saveRes.status).toBe(200);
      expect(saveRes.body.data.status).toBe('auto_submitted');
      expect(saveRes.body.message).toContain('Time expired');
    });
  });

  describe('Bulk Text Import & Line Error Validation', () => {
    it('parses valid question plain text format and adds to quiz', async () => {
      const textToImport = `
Q: What does npm stand for?
A) Node Package Manager  B) New Project Module  C) Next Phase Method
Answer: A
Explain: Standard package manager for Node.js.

Q: MongoDB is a relational SQL database.
A) True  B) False
Answer: B
Explain: MongoDB is a document-oriented NoSQL database.
      `;

      const res = await request(app)
        .post(`/api/admin/quizzes/${testQuiz._id}/import`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: textToImport, mode: 'append' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.importedCount).toBe(2);
    });

    it('rejects malformed plain text and returns line-level errors', async () => {
      const invalidText = `
Q: Valid Question Text
A) Opt 1  B) Opt 2
Answer: A

Q: Invalid Question Missing Answer
A) Only One Option
      `;

      const res = await request(app)
        .post(`/api/admin/quizzes/${testQuiz._id}/import`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: invalidText });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('IMPORT_PARSE_ERROR');
      expect(Array.isArray(res.body.errors)).toBe(true);
      expect(res.body.errors.length).toBeGreaterThan(0);
      expect(res.body.errors[0].line).toBeDefined();
    });
  });

  describe('Results Analytics & CSV Export', () => {
    it('returns quiz results analytics with per-question statistics', async () => {
      const res = await request(app)
        .get(`/api/admin/quizzes/${testQuiz._id}/results`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.totalSubmissions).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data.questionAnalytics)).toBe(true);
    });

    it('exports results as a downloadable CSV with proper headers', async () => {
      const res = await request(app)
        .get(`/api/admin/quizzes/${testQuiz._id}/export`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment; filename=');
      expect(res.text).toContain('Student Name,Email');
      expect(res.text).toContain('Quiz Student Two');
    });
  });
});
