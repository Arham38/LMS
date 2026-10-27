import connectDB, { disconnectDB } from '../config/db.js';
import User from '../models/user.model.js';
import Enrollment from '../models/enrollment.model.js';
import Submission from '../models/submission.model.js';
import QuizAttempt from '../models/quizAttempt.model.js';
import Attendance from '../models/attendance.model.js';

async function cleanupTestAccounts() {
  await connectDB();

  // Find all test students created by Playwright (matching @example.com or name starting with Ayesha Khan)
  const testUsers = await User.find({
    role: 'student',
    $or: [
      { email: { $regex: '@example\\.com$', $options: 'i' } },
      { name: { $regex: '^Ayesha Khan', $options: 'i' } },
    ],
  });

  console.log(`Found ${testUsers.length} automated test student accounts.`);

  const testUserIds = testUsers.map((u) => u._id);

  if (testUserIds.length > 0) {
    const [delEnr, delSub, delQA, delAtt, delUsers] = await Promise.all([
      Enrollment.deleteMany({ student: { $in: testUserIds } }),
      Submission.deleteMany({ student: { $in: testUserIds } }),
      QuizAttempt.deleteMany({ student: { $in: testUserIds } }),
      Attendance.deleteMany({ student: { $in: testUserIds } }),
      User.deleteMany({ _id: { $in: testUserIds } }),
    ]);

    console.log(`Cleaned up:
      - ${delUsers.deletedCount} Test Users
      - ${delEnr.deletedCount} Test Enrollments
      - ${delSub.deletedCount} Test Submissions
      - ${delQA.deletedCount} Test Quiz Attempts
      - ${delAtt.deletedCount} Test Attendance Records
    `);
  }

  await disconnectDB();
}

cleanupTestAccounts().catch(console.error);
