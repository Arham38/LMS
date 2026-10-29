import connectDB, { disconnectDB } from '../config/db.js';
import env from '../config/env.js';
import User from '../models/user.model.js';
import Course, { generateSlug } from '../models/course.model.js';
import Settings from '../models/settings.model.js';
import Session from '../models/session.model.js';

export const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await connectDB();

    // 1. Seed Admin User
    const existingAdmin = await User.findOne({ email: env.ADMIN_EMAIL.toLowerCase() });
    if (existingAdmin) {
      console.log(`Admin account already exists for ${env.ADMIN_EMAIL}.`);
    } else {
      await User.create({
        name: env.ADMIN_NAME,
        email: env.ADMIN_EMAIL.toLowerCase(),
        password: env.ADMIN_PASSWORD,
        role: 'admin',
        isActive: true,
      });
      console.log(`Admin user successfully provisioned: ${env.ADMIN_EMAIL}`);
    }

    // 2. Seed Default Settings
    await Settings.getSettings();
    console.log('Default settings and domestic payment methods verified.');

    // 3. Seed Sample Initial Bootcamps if none exist
    const courseCount = await Course.countDocuments();
    if (courseCount === 0) {
      const sampleCourses = [
        {
          title: 'MERN Full-Stack Bootcamp (Batch 04)',
          slug: generateSlug('MERN Full-Stack Bootcamp Batch 04'),
          tagline: 'Master modern full-stack web engineering with Node.js, Express, MongoDB Atlas, and React 18.',
          description:
            'A 16-week production-focused bootcamp covering asynchronous JavaScript, Node.js internals, MongoDB aggregation pipelines, state architecture, testing with Jest, and zero-downtime deployment. Every session is conducted live with direct debugging and code reviews.',
          level: 'Intermediate',
          durationWeeks: 16,
          schedule: 'Tue & Thu 8:00 PM - 10:00 PM PKT',
          startDate: new Date('2026-11-15T15:00:00.000Z'),
          seatsTotal: 25,
          fee: 24000,
          installmentsAllowed: true,
          installmentPlan: '2 installments of Rs. 12,000 (at registration and week 8)',
          isPublished: true,
          isEnrollmentOpen: true,
          outcomes: [
            'Build and deploy RESTful microservices with Node.js and Express',
            'Model complex MongoDB schemas with indexing and aggregation pipelines',
            'Architect scalable React frontends using clean hooks and design systems',
            'Write integration tests and deploy to cloud platforms (Render, Atlas)',
          ],
          requirements: [
            'Basic knowledge of JavaScript (ES6 syntax and functions)',
            'Laptop with at least 8GB RAM and stable broadband connection',
            'Dedication to attend 4 hours of live lecture per week + 6 hours homework',
          ],
          syllabus: [
            {
              order: 1,
              title: 'Backend Architecture & Node.js Core',
              topics: ['Event Loop and Asynchronous I/O', 'Express Router Pipelines', 'Security Middlewares and Error Handling'],
            },
            {
              order: 2,
              title: 'Database Modeling & MongoDB Atlas',
              topics: ['Document Validation with Mongoose', 'Indexing Strategies', 'Aggregation Pipelines and Relations'],
            },
            {
              order: 3,
              title: 'Frontend Engineering with React 18',
              topics: ['Component Lifecycles & Custom Hooks', 'Form Architectures & Zod Validation', 'Tailwind Design Token Systems'],
            },
            {
              order: 4,
              title: 'Testing, Cloud Deployment & Security',
              topics: ['Automated Integration Testing with Jest', 'Dockerized Node Runtimes', 'Production Monitoring & Zero Downtime'],
            },
          ],
        },
        {
          title: 'Python for Software Engineers (Batch 02)',
          slug: generateSlug('Python for Software Engineers Batch 02'),
          tagline: 'Deep dive into Python 3, object-oriented design, concurrency, and FastAPI backend engineering.',
          description:
            'Intensive 12-week course taking you from core Python syntax to advanced architectural patterns: generators, decorators, async/await event loops, typing, testing with PyTest, and building high-performance REST APIs with FastAPI and PostgreSQL.',
          level: 'All Levels',
          durationWeeks: 12,
          schedule: 'Mon & Wed 8:00 PM - 10:00 PM PKT',
          startDate: new Date('2026-11-20T15:00:00.000Z'),
          seatsTotal: 20,
          fee: 20000,
          installmentsAllowed: false,
          installmentPlan: '',
          isPublished: true,
          isEnrollmentOpen: true,
          outcomes: [
            'Master idiomatic Python 3, OOP, and data structures',
            'Write concurrent and asynchronous programs using asyncio',
            'Build production-grade APIs with FastAPI and SQLModel',
            'Containerize Python microservices with Docker',
          ],
          requirements: [
            'Familiarity with basic programming logic in any language',
            'Computer capable of running VS Code and Python 3.12+',
          ],
          syllabus: [
            {
              order: 1,
              title: 'Idiomatic Python & OOP',
              topics: ['Data Models & Dunder Methods', 'Generators and Iterators', 'Context Managers and Decorators'],
            },
            {
              order: 2,
              title: 'Concurrency & Fast Web APIs',
              topics: ['AsyncIO Runtime', 'FastAPI Dependency Injection', 'Pydantic V2 Serialization & Validation'],
            },
          ],
        },
      ];

      await Course.create(sampleCourses);
      console.log(`Sample bootcamps created (${sampleCourses.length} courses).`);
    }

    // 4. Seed Sample Sessions if none exist
    const sessionCount = await Session.countDocuments();
    if (sessionCount === 0) {
      const primaryCourse = await Course.findOne();
      if (primaryCourse) {
        const now = Date.now();
        const sampleSessions = [
          {
            course: primaryCourse._id,
            week: 1,
            order: 1,
            title: 'Cohort Orientation & Development Environment Setup',
            description: 'Installing Node.js v20, VS Code, Git conventions, and monorepo structure.',
            scheduledAt: new Date(now - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            durationMinutes: 120,
            meetingLink: 'https://meet.google.com/cda-mern-session1',
            status: 'completed',
            isPublished: true,
            resources: [
              {
                title: 'Week 1 Setup Guide (PDF)',
                fileKey: 'uploads/pdf/admin/sample-setup.pdf',
              },
            ],
          },
          {
            course: primaryCourse._id,
            week: 1,
            order: 2,
            title: 'Asynchronous JavaScript & Node.js Event Loop',
            description: 'Microtasks, macrotasks, process.nextTick, timers, and custom EventEmitter patterns.',
            scheduledAt: new Date(now + 2 * 60 * 60 * 1000), // 2 hours from now
            durationMinutes: 120,
            meetingLink: 'https://meet.google.com/cda-mern-session2',
            status: 'upcoming',
            isPublished: true,
            resources: [
              {
                title: 'Event Loop Deep-Dive Slides (PDF)',
                fileKey: 'uploads/pdf/admin/event-loop-slides.pdf',
              },
            ],
          },
          {
            course: primaryCourse._id,
            week: 2,
            order: 3,
            title: 'Express Routing Pipelines & Middleware Architecture',
            description: 'Error handler chains, Zod validation, JWT verification, and rate limiting.',
            scheduledAt: new Date(now + 3 * 24 * 60 * 60 * 1000), // 3 days from now
            durationMinutes: 120,
            meetingLink: 'https://meet.google.com/cda-mern-session3',
            status: 'upcoming',
            isPublished: true,
          },
        ];

        await Session.create(sampleSessions);
        console.log(`Sample live sessions created (${sampleSessions.length} sessions).`);
      }
    }

    await disconnectDB();
    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Failed to seed database:', error.message);
    process.exit(1);
  }
};

if (process.argv[1]?.includes('seed.js')) {
  seedDatabase().then(() => process.exit(0));
}

export default seedDatabase;
