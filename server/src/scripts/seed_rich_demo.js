import connectDB, { disconnectDB } from '../config/db.js';
import User from '../models/user.model.js';
import Course, { generateSlug } from '../models/course.model.js';
import Settings from '../models/settings.model.js';
import Session from '../models/session.model.js';
import Enrollment from '../models/enrollment.model.js';
import Assignment from '../models/assignment.model.js';
import Quiz from '../models/quiz.model.js';
import Announcement from '../models/announcement.model.js';

export const seedRichDemo = async () => {
  try {
    console.log('Connecting to database for rich demo seeding...');
    await connectDB();

    // 1. Ensure Admin User
    let admin = await User.findOne({ email: 'admin@codecraft.academy' });
    if (!admin) {
      admin = await User.create({
        name: 'Lead Instructor & Dean',
        email: 'admin@codecraft.academy',
        password: 'AdminSecurePass123!',
        role: 'admin',
        isActive: true,
      });
      console.log('Admin user created: admin@codecraft.academy');
    }

    // 2. Settings
    await Settings.getSettings();

    // 3. Clear existing demo courses & associated data for a clean slate
    await Course.deleteMany({});
    await Session.deleteMany({});
    await Enrollment.deleteMany({});
    await Assignment.deleteMany({});
    await Quiz.deleteMany({});
    await Announcement.deleteMany({});

    console.log('Purged stale demo data.');

    // 4. Create 4 Production-Grade Bootcamp Courses
    const coursesToCreate = [
      {
        title: 'MERN Full-Stack Engineering (Batch 04)',
        slug: generateSlug('MERN Full-Stack Engineering Batch 04'),
        tagline: 'Master modern full-stack engineering with Node.js 20, Express, MongoDB Atlas, and React 18.',
        description:
          'A comprehensive 16-week production-focused bootcamp covering asynchronous JavaScript, Node.js runtime internals, MongoDB aggregation pipelines, scalable state architecture, Jest integration testing, and zero-downtime cloud deployments.',
        level: 'Intermediate',
        durationWeeks: 16,
        schedule: 'Tue & Thu 8:00 PM - 10:00 PM PKT',
        startDate: new Date('2026-11-15T15:00:00.000Z'),
        seatsTotal: 30,
        fee: 25000,
        installmentsAllowed: true,
        installmentPlan: '2 installments of Rs. 12,500 (at registration and week 8)',
        isPublished: true,
        isEnrollmentOpen: true,
        outcomes: [
          'Architect and deploy RESTful microservices with Node.js and Express',
          'Model complex MongoDB schemas with indexing and aggregation pipelines',
          'Build scalable React frontends using clean hooks and design token systems',
          'Write automated integration tests and deploy to cloud platforms',
        ],
        requirements: [
          'Solid fundamentals of JavaScript (ES6+ syntax, arrays, objects, functions)',
          'Laptop with at least 8GB RAM and stable broadband connection',
          'Dedication to attend 4 hours of live lecture per week + 8 hours homework',
        ],
        syllabus: [
          {
            order: 1,
            title: 'Backend Architecture & Node.js Core Internals',
            topics: ['Event Loop & Non-blocking I/O', 'Express Pipeline Architecture', 'Security Headers, CORS & Rate Limiting'],
          },
          {
            order: 2,
            title: 'Database Modeling & MongoDB Aggregation',
            topics: ['Mongoose Schemas & Schema Validation', 'Index Strategies & Query Performance', 'Complex Aggregation Pipelines'],
          },
          {
            order: 3,
            title: 'Frontend Engineering with React 18 & Vite',
            topics: ['Custom Hooks & Context Architecture', 'Headless Form Validations with Zod', 'Tailwind Design Token Systems'],
          },
          {
            order: 4,
            title: 'Cloud Deployment, Presigned Storage & Security',
            topics: ['Presigned S3/Supabase Direct File Uploads', 'Reverse Proxy Trust & Production Hardening', 'Capstone Architectural Defense'],
          },
        ],
      },
      {
        title: 'Applied Generative AI & LLM Systems (Batch 01)',
        slug: generateSlug('Applied Generative AI LLM Systems Batch 01'),
        tagline: 'Build production agentic workflows, RAG pipelines, and fine-tuned embeddings with Python and LangChain.',
        description:
          '14-week rigorous program for software engineers looking to bridge into production AI. Build real-time vector search retrieval engines, function-calling agentic loops, evaluation pipelines, and deploy autonomous LLM microservices.',
        level: 'Advanced',
        durationWeeks: 14,
        schedule: 'Sat & Sun 6:00 PM - 8:30 PM PKT',
        startDate: new Date('2026-11-22T13:00:00.000Z'),
        seatsTotal: 25,
        fee: 35000,
        installmentsAllowed: true,
        installmentPlan: '2 installments of Rs. 17,500',
        isPublished: true,
        isEnrollmentOpen: true,
        outcomes: [
          'Design robust Retrieval-Augmented Generation (RAG) architectures with Qdrant / Pinecone',
          'Build autonomous reasoning agents with tool calling and multi-agent coordination',
          'Evaluate hallucination rates using LLM-as-a-judge frameworks',
          'Serve low-latency inference endpoints via FastAPI and vLLM',
        ],
        requirements: [
          'Strong proficiency in Python (OOP, typing, async)',
          'Fundamental understanding of REST APIs and relational or vector databases',
          'Passion for modern AI architectures and deep technical problem solving',
        ],
        syllabus: [
          {
            order: 1,
            title: 'Embeddings, Vector Stores & Hybrid Retrieval',
            topics: ['Dense vs Sparse Embeddings', 'Vector Indexing (HNSW / IVF)', 'Chunking & Metadata Filtering'],
          },
          {
            order: 2,
            title: 'Agentic Architectures & Function Calling',
            topics: ['Tool Definitions & Structured Outputs', 'ReAct Reasoning Loops', 'State Machines & Multi-Agent Teams'],
          },
          {
            order: 3,
            title: 'Evaluation, Observability & Guardrails',
            topics: ['RAG Triad Metrics (Faithfulness, Relevance)', 'Input/Output Content Guardrails', 'Tracing & Cost Tracking'],
          },
        ],
      },
      {
        title: 'Python for Backend Engineers & Distributed Systems (Batch 02)',
        slug: generateSlug('Python for Backend Engineers Distributed Systems Batch 02'),
        tagline: 'Deep dive into Python 3.12, async event loops, FastAPI microservices, and distributed task queues.',
        description:
          'An intensive 12-week course taking you from core Python syntax to advanced architectural patterns: generators, decorators, asyncio event loops, PyTest test suites, Celery task distribution, and high-throughput PostgreSQL backends.',
        level: 'All Levels',
        durationWeeks: 12,
        schedule: 'Mon & Wed 8:00 PM - 10:00 PM PKT',
        startDate: new Date('2026-11-28T15:00:00.000Z'),
        seatsTotal: 28,
        fee: 22000,
        installmentsAllowed: false,
        installmentPlan: '',
        isPublished: true,
        isEnrollmentOpen: true,
        outcomes: [
          'Master idiomatic modern Python 3.12, OOP, dunder protocols, and typing',
          'Write concurrent and non-blocking asynchronous services using asyncio',
          'Build high-performance REST APIs with FastAPI, Pydantic V2, and SQLAlchemy',
          'Implement asynchronous job queues with Celery and Redis',
        ],
        requirements: [
          'Basic familiarity with computer science logic in any programming language',
          'Computer capable of running VS Code and Python 3.12+',
        ],
        syllabus: [
          {
            order: 1,
            title: 'Idiomatic Python, Data Models & Metaprogramming',
            topics: ['Dunder Protocols & Iterators', 'Custom Decorators & Context Managers', 'Type Annotations & Pydantic V2'],
          },
          {
            order: 2,
            title: 'Asynchronous Programming & FastAPI Services',
            topics: ['Asyncio Event Loop & Coroutines', 'Dependency Injection & Middleware', 'Authentication & JWT Bearer Security'],
          },
        ],
      },
      {
        title: 'Cloud Native DevOps with Docker & Kubernetes (Batch 03)',
        slug: generateSlug('Cloud Native DevOps Docker Kubernetes Batch 03'),
        tagline: 'Production infrastructure automation, CI/CD pipelines, container orchestration, and observability.',
        description:
          '10 weeks of hands-on cloud native engineering. Containerize multi-tier applications, configure Kubernetes pods, ingress controllers, Helm charts, GitHub Actions automation, and Prometheus/Grafana monitoring.',
        level: 'Intermediate',
        durationWeeks: 10,
        schedule: 'Friday 7:00 PM - 10:00 PM PKT',
        startDate: new Date('2026-12-05T14:00:00.000Z'),
        seatsTotal: 20,
        fee: 26000,
        installmentsAllowed: true,
        installmentPlan: '2 installments of Rs. 13,000',
        isPublished: true,
        isEnrollmentOpen: true,
        outcomes: [
          'Write multi-stage production Dockerfiles with security hardening',
          'Deploy resilient Kubernetes clusters with custom deployments and services',
          'Construct automated CI/CD pipelines with GitHub Actions',
          'Monitor cluster telemetry with Prometheus and Grafana dashboards',
        ],
        requirements: [
          'Familiarity with Linux command line and Git basics',
          'At least 16GB RAM recommended for running local Minikube / k3s',
        ],
        syllabus: [
          {
            order: 1,
            title: 'Containerization & Image Optimization',
            topics: ['Multi-Stage Docker Builds', 'Non-Root User Execution', 'Container Networking & Volumes'],
          },
          {
            order: 2,
            title: 'Kubernetes Orchestration & Helm',
            topics: ['Pods, Deployments & Services', 'Ingress & TLS Termination', 'Helm Chart Packaging'],
          },
        ],
      },
    ];

    const createdCourses = await Course.create(coursesToCreate);
    console.log(`Successfully created ${createdCourses.length} bootcamps.`);

    const primaryCourse = createdCourses[0]; // MERN
    const aiCourse = createdCourses[1]; // AI
    const pythonCourse = createdCourses[2]; // Python

    // 5. Create Demo Students
    const studentData = [
      { name: 'Hamza Tariq', email: 'hamza.tariq@gmail.com', phone: '03001234567' },
      { name: 'Ayesha Khan', email: 'ayesha.khan@yahoo.com', phone: '03219876543' },
      { name: 'Bilal Ahmed', email: 'bilal.ahmed@outlook.com', phone: '03451122334' },
      { name: 'Zainab Fatima', email: 'zainab.fatima@gmail.com', phone: '03335566778' },
    ];

    const students = [];
    for (const s of studentData) {
      let st = await User.findOne({ email: s.email });
      if (!st) {
        st = await User.create({
          name: s.name,
          email: s.email,
          password: 'StudentPass123!',
          role: 'student',
          isActive: true,
        });
      }
      students.push(st);
    }
    console.log(`Provisioned ${students.length} demo students.`);

    // 6. Create Enrollments with PKR Payments
    const enrollments = [
      {
        student: students[0]._id,
        course: primaryCourse._id,
        status: 'approved',
        amountDue: 25000,
        amountPaid: 25000,
        paymentMethod: 'jazzcash',
        transactionId: 'JC-9821839213',
        senderName: 'Hamza Tariq',
        senderNumber: '03001234567',
        paymentNote: 'Full tuition paid upfront via JazzCash mobile account.',
      },
      {
        student: students[1]._id,
        course: primaryCourse._id,
        status: 'approved',
        amountDue: 25000,
        amountPaid: 12500,
        paymentMethod: 'easypaisa',
        transactionId: 'EP-4491028301',
        senderName: 'Ayesha Khan',
        senderNumber: '03219876543',
        paymentNote: '1st installment paid via EasyPaisa. 2nd due on week 8.',
      },
      {
        student: students[2]._id,
        course: aiCourse._id,
        status: 'approved',
        amountDue: 35000,
        amountPaid: 35000,
        paymentMethod: 'bank',
        transactionId: 'MEZN-PK77881920',
        senderName: 'Bilal Ahmed',
        senderNumber: '03451122334',
        paymentNote: 'Meezan Bank online transfer receipt verified.',
      },
      {
        student: students[3]._id,
        course: pythonCourse._id,
        status: 'pending',
        amountDue: 22000,
        amountPaid: 22000,
        paymentMethod: 'bank',
        transactionId: 'HBL-991823019',
        senderName: 'Zainab Fatima',
        senderNumber: '03335566778',
        paymentNote: 'Submitted HBL transfer receipt. Pending admin approval.',
      },
    ];

    await Enrollment.create(enrollments);
    console.log(`Created ${enrollments.length} student enrollments.`);

    // 7. Create Live Sessions
    const now = Date.now();
    const sessions = [
      {
        course: primaryCourse._id,
        week: 1,
        order: 1,
        title: 'Cohort Orientation & Monorepo Development Environment',
        description: 'Node.js v20 LTS, ESLint, Git worktrees, and project folder conventions.',
        scheduledAt: new Date(now - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        durationMinutes: 120,
        meetingLink: 'https://meet.google.com/cda-mern-session1',
        status: 'completed',
        isPublished: true,
        resources: [
          { title: 'Session 01 Slides & Notes (PDF)', fileKey: 'uploads/pdf/session-1-notes.pdf' },
        ],
      },
      {
        course: primaryCourse._id,
        week: 1,
        order: 2,
        title: 'Asynchronous JavaScript & Node.js Event Loop Architecture',
        description: 'Call stack, libuv event loop phases, microtasks vs macrotasks, and custom EventEmitters.',
        scheduledAt: new Date(now + 3 * 60 * 60 * 1000), // 3 hours from now
        durationMinutes: 120,
        meetingLink: 'https://meet.google.com/cda-mern-session2',
        status: 'upcoming',
        isPublished: true,
        resources: [
          { title: 'Event Loop Deep-Dive Reference (PDF)', fileKey: 'uploads/pdf/event-loop-deepdive.pdf' },
        ],
      },
      {
        course: primaryCourse._id,
        week: 2,
        order: 3,
        title: 'Express Routing Pipelines, Middlewares & Zod Validation',
        description: 'Designing fail-fast request validators, error handlers, and JWT authentication filters.',
        scheduledAt: new Date(now + 4 * 24 * 60 * 60 * 1000),
        durationMinutes: 120,
        meetingLink: 'https://meet.google.com/cda-mern-session3',
        status: 'upcoming',
        isPublished: true,
      },
    ];

    await Session.create(sessions);
    console.log(`Created ${sessions.length} live sessions.`);

    // 8. Create Quizzes
    const sampleQuiz = {
      course: primaryCourse._id,
      week: 1,
      title: 'Node.js Core Internals & Async Execution Quiz',
      description: 'Test your understanding of the libuv thread pool, process.nextTick, and Promise microtasks.',
      durationMinutes: 20,
      passingScore: 70,
      policy: 'after_close',
      isPublished: true,
      questions: [
        {
          text: 'In which phase of the Node.js event loop are process.nextTick callbacks executed?',
          type: 'single',
          options: [
            'Immediately after the current operation, before the event loop continues',
            'In the Check (setImmediate) phase',
            'In the Timers phase with setTimeout',
            'In the Poll phase along with I/O callbacks',
          ],
          correctIndexes: [0],
          explanation: 'process.nextTick is technically not part of the event loop. The nextTickQueue is processed right after the current operation finishes, regardless of the current phase.',
          marks: 10,
        },
        {
          text: 'Which of the following operations utilize the libuv worker thread pool by default?',
          type: 'multiple',
          options: [
            'fs filesystem calls',
            'crypto password hashing (pbkdf2, bcrypt)',
            'TCP socket listening (net / http)',
            'dns.lookup hostname resolution',
          ],
          correctIndexes: [0, 1, 3],
          explanation: 'libuv handles fs, crypto, and dns.lookup on worker threads, while network I/O (TCP/UDP) is handled via OS non-blocking notification mechanisms (epoll/kqueue).',
          marks: 10,
        },
      ],
    };

    await Quiz.create(sampleQuiz);
    console.log('Created sample quiz.');

    // 9. Create Assignment with Rubric
    const sampleAssignment = {
      course: primaryCourse._id,
      week: 1,
      title: 'Assignment 01: Robust Express Authentication & Error Handling Pipeline',
      description: 'Implement a production-grade auth module with bcryptjs hashing (cost 12), JWT issuance, and centralized ApiError middleware handling.',
      rubric: [
        { criterion: 'Password Security & Salt Cost', maxMarks: 25 },
        { criterion: 'JWT Stateless Verification & Role Middleware', maxMarks: 35 },
        { criterion: 'Zod Request Validation & Fail-Fast Error Response', maxMarks: 25 },
        { criterion: 'Code Cleanliness & Automated Unit Tests', maxMarks: 15 },
      ],
      dueAt: new Date(now + 7 * 24 * 60 * 60 * 1000),
      isPublished: true,
    };

    await Assignment.create(sampleAssignment);
    console.log('Created sample assignment with rubric.');

    // 10. Create Announcements
    await Announcement.create([
      {
        course: primaryCourse._id,
        title: 'Welcome to Batch 04! Onboarding & Live Class Joining Link Instructions',
        body: 'Please make sure your development environment is set up according to Session 01 notes. The join link unlocks 15 minutes before scheduled lecture start.',
        pinned: true,
        createdBy: admin._id,
      },
    ]);
    console.log('Created sample announcement.');

    console.log('✅ Rich demo database seeding finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
};

seedRichDemo();
