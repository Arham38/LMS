import connectDB, { disconnectDB } from '../config/db.js';
import User from '../models/user.model.js';
import Enrollment from '../models/enrollment.model.js';

async function main() {
  await connectDB();

  const users = await User.find({ role: 'student' }).sort({ createdAt: 1 });
  console.log(`=== ALL STUDENTS (${users.length}) ===`);
  users.forEach((u) => console.log(u._id.toString(), u.name, u.email));

  const enrollments = await Enrollment.find({}).populate('student', 'name email');
  console.log(`\n=== ALL ENROLLMENTS (${enrollments.length}) ===`);
  enrollments.forEach((e) =>
    console.log(e._id.toString(), e.status, e.student?.name, e.student?.email)
  );

  await disconnectDB();
}

main().catch(console.error);
