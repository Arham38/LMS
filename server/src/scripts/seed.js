import connectDB, { disconnectDB } from '../config/db.js';
import env from '../config/env.js';
import User from '../models/user.model.js';

export const seedAdmin = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await connectDB();

    const existingAdmin = await User.findOne({ email: env.ADMIN_EMAIL.toLowerCase() });

    if (existingAdmin) {
      console.log(`Admin account already exists for ${env.ADMIN_EMAIL}. No action required.`);
    } else {
      await User.create({
        name: env.ADMIN_NAME,
        email: env.ADMIN_EMAIL.toLowerCase(),
        password: env.ADMIN_PASSWORD,
        role: 'admin',
        isActive: true,
      });

      console.log(`Admin user successfully provisioned:`);
      console.log(`  Name:  ${env.ADMIN_NAME}`);
      console.log(`  Email: ${env.ADMIN_EMAIL}`);
      console.log(`  Role:  admin`);
      console.log(`(Password set from environment securely without logging)`);
    }

    await disconnectDB();
    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Failed to seed admin account:', error.message);
    process.exit(1);
  }
};

// If executed directly from CLI
if (process.argv[1]?.includes('seed.js')) {
  seedAdmin().then(() => process.exit(0));
}

export default seedAdmin;
