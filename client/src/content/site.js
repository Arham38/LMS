/**
 * CodeCraft Academy - Central Site Content & Copy
 * 
 * NOTE FOR ACADEMY OWNER:
 * You can edit all public website copy, FAQ questions, pricing, contact details,
 * and syllabus modules directly in this single file without touching any code.
 * 
 * SECTIONS WITH PLACEHOLDER INFORMATION:
 * - Instructor bio (`siteContent.instructor`) is currently marked with `showSection: false`.
 *   Set `showSection: true` once your actual bio and photo are ready.
 * - Project showcases (`siteContent.projects`) are marked with `showSection: false`.
 *   Set `showSection: true` once real student projects and screenshots are uploaded.
 * - Testimonials are not included to avoid fabricated social proof.
 */

export const siteContent = {
  // Brand & Contact Coordinates
  brand: {
    name: 'CodeCraft Bootcamp',
    shortName: 'CodeCraft',
    tagline: 'An intensive, cohort-based software engineering bootcamp teaching modern full-stack development with hands-on code reviews and real production standards.',
    wordmark: 'CodeCraft',
    city: 'Lahore, Pakistan',
    timezone: 'Pakistan Standard Time (PKT / UTC+5)',
    supportEmail: 'admissions@codecraft.pk',
    whatsappDisplay: '+92 300 1234567',
    whatsappDigits: '923001234567',
    address: 'Gulberg III, Lahore, Punjab, Pakistan (All cohort classes held 100% online)',
    socials: {
      github: 'https://github.com/codecraft-pk',
      linkedin: 'https://linkedin.com/company/codecraft-pk',
      twitter: 'https://twitter.com/codecraft_pk',
    },
  },

  // Navigation Links
  nav: {
    links: [
      { label: 'Courses', href: '/courses' },
      { label: 'Syllabus', href: '/#syllabus' },
      { label: 'How It Works', href: '/#how-it-works' },
      { label: 'FAQ', href: '/faq' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
    loginText: 'Student Portal',
    ctaText: 'Enroll in the next batch',
  },

  // Hero Section
  hero: {
    badge: 'Applications Open for Next Cohort',
    headline: 'Build production-grade web applications from scratch in 12 weeks.',
    subline: 'No fluff, no outdated tutorials. A rigorous, live cohort program engineered to take you from foundational programming to shipping scalable, well-tested full-stack systems with total confidence.',
    primaryCta: 'View the next batch',
    secondaryCta: 'Read the syllabus',
    // Fallback info panel data (will be populated dynamically from API whenever courses exist)
    courseInfoFallback: {
      title: 'Full Stack Web Engineering (MERN)',
      startDate: 'November 15, 2026',
      schedule: 'Mon, Wed, Fri — 8:00 PM to 10:00 PM PKT',
      duration: '12 Weeks (36 live sessions + weekend build labs)',
      fee: 'PKR 45,000',
      installments: 'Available in 2 installments (PKR 22,500 x 2)',
      seatsLeft: '8 seats remaining',
      paymentMethods: 'JazzCash, EasyPaisa, SadaBiz & Bank Wire',
    },
  },

  // How It Works (Four numbered horizontal steps)
  howItWorks: {
    sectionNumber: '01',
    heading: 'How It Works',
    subheading: 'A transparent, disciplined path from fundamentals to production code.',
    steps: [
      {
        number: '01',
        title: 'Apply & Reserve Your Seat',
        description: 'Choose your cohort and submit your enrollment with your proof of tuition or first installment. Seats are strictly capped at 25 students per cohort to ensure individualized code review.',
      },
      {
        number: '02',
        title: 'Attend Interactive Live Sessions',
        description: 'Three live evening sessions each week over Google Meet. Live architecture design, live pair coding, and real-time debugging. Every session is recorded with downloadable notes.',
      },
      {
        number: '03',
        title: 'Ship Weekly Graded Projects',
        description: 'Solve real-world engineering prompts rather than following mindless step-by-step videos. Every submission receives detailed line-by-line rubric grading and constructive critique.',
      },
      {
        number: '04',
        title: 'Graduate With Real Software Craft',
        description: 'Complete your capstone architecture defense, verify your comprehensive course certificate, and walk away with a clean, well-tested portfolio employers actually respect.',
      },
    ],
  },

  // Comprehensive 8-Module Syllabus Preview
  syllabus: {
    sectionNumber: '02',
    heading: 'Comprehensive Curriculum',
    subheading: 'Engineered for depth. Every week builds directly upon the previous module.',
    modules: [
      {
        number: '01',
        title: 'Foundations & Modern JavaScript Internals',
        weeks: 'Weeks 1 – 2',
        summary: 'Deep-dive into the JavaScript engine, execution context, asynchronous primitives, and modern ESNext standards.',
        topics: [
          'Call stack, event loop, macrotasks and microtask execution order',
          'Deep vs shallow copies, closures, prototype chain and variable scoping',
          'Promises from first principles, async/await and robust error handling',
          'Functional programming primitives: immutability, pure functions and compose',
          'Modern TypeScript basics: static types, interfaces, union types and generics',
        ],
      },
      {
        number: '02',
        title: 'Server Architecture & RESTful API Design',
        weeks: 'Weeks 3 – 4',
        summary: 'Constructing robust backend servers with Node.js and Express using clean architectural boundaries.',
        topics: [
          'Node.js runtime mechanics, buffer streams and modular codebases',
          'Layered architecture: controllers, services, repositories and models',
          'Zod schema validation, fail-fast input sanitation and custom ApiError',
          'State-of-the-art authentication: JWT tokens, password hashing, and role RBAC',
          'Security posture: Helmet, rate limiters, Mongo sanitize and CORS policies',
        ],
      },
      {
        number: '03',
        title: 'Database Engineering & Schema Modeling',
        weeks: 'Weeks 5 – 6',
        summary: 'Data persistence, relational vs document models, indexing strategies, and database aggregations.',
        topics: [
          'MongoDB schema design with Mongoose: validation, defaults and hooks',
          'Compound indexes, explain plans, query optimization and collation',
          'Aggregation framework pipelines: $match, $lookup, $group and $facet',
          'Data integrity, referential constraints, and multi-document transactions',
          'Database seeding, programmatic backups and environment isolation',
        ],
      },
      {
        number: '04',
        title: 'Modern Frontends with React & Tailwind CSS',
        weeks: 'Weeks 7 – 8',
        summary: 'Component ergonomics, custom design systems, state boundaries, and accessible interfaces.',
        topics: [
          'Component composition, pure rendering and the virtual DOM reconciliation',
          'Design tokens, Tailwind CSS custom themes and responsive typography',
          'Custom React hooks for data fetching, debouncing and local storage',
          'Declarative routing with React Router v6, dynamic segments and auth guards',
          'Accessible markup: ARIA attributes, semantic HTML and keyboard navigation',
        ],
      },
      {
        number: '05',
        title: 'State Management & Real-Time Interactions',
        weeks: 'Weeks 9 – 10',
        summary: 'Managing complex client state, optimistic UI feedback, and cloud media pipelines.',
        topics: [
          'Context API patterns and scalable client-state stores (Zustand)',
          'Optimistic updates, cache invalidation and loading skeleton states',
          'Cloud storage pipelines: presigned URLs with Supabase Storage and AWS S3',
          'Real-time communication concepts, polling fallbacks and notifications',
          'Robust modal dialogs, drawers, and mobile touch interactions',
        ],
      },
      {
        number: '06',
        title: 'Automated Testing, CI/CD & Reliability',
        weeks: 'Week 10 – 11',
        summary: 'Writing testable code, automated integration suites, and defensive resilience.',
        topics: [
          'Unit testing business logic with Jest and test-driven best practices',
          'End-to-end HTTP API testing with Supertest and mongodb-memory-server',
          'Frontend component verification and user interaction testing',
          'Centralized error monitoring, graceful degradation and defensive fallbacks',
          'GitHub Actions setup for automated test runs on pull requests',
        ],
      },
      {
        number: '07',
        title: 'Security Hardening, SEO & Web Performance',
        weeks: 'Week 11',
        summary: 'Bulletproofing applications for real-world traffic, speed, and discoverability.',
        topics: [
          'OWASP top 10 security mitigations: XSS, CSRF, NoSQL injection and timing attacks',
          'Core Web Vitals: Zero Cumulative Layout Shift (CLS), LCP, and INP metrics',
          'Asset optimization, route-level code splitting and dynamic lazy imports',
          'Social previews (Open Graph, Twitter card), WhatsApp metadata and JSON-LD schema',
        ],
      },
      {
        number: '08',
        title: 'Production Deployment & Capstone Defense',
        weeks: 'Week 12',
        summary: 'Packaging, containerization, hosting infrastructure, and portfolio capstone defense.',
        topics: [
          'Environment management, production build pipelines and minification',
          'Deployment on Render, Vercel, and Supabase',
          'Reverse proxies, SSL termination, and custom domain setup',
          'Capstone project presentation: live code walkthrough and architectural defense',
          'Course certificate issuance and next-steps guidance',
        ],
      },
    ],
  },

  // "What You Will Build" Projects (Marked hidden until real student projects are provided)
  projects: {
    showSection: false, // DO NOT SHOW UNTIL REAL PROJECTS ARE AVAILABLE
    placeholderNotice: 'Student capstone projects will be showcased here once the first cohort defends their architectures.',
    items: [
      {
        title: 'Distributed LMS & Assessment Platform',
        description: 'Cohort management, timed auto-graded quizzes, line-by-line assignment rubric reviews, and Supabase Storage.',
        tech: ['React', 'Node.js', 'MongoDB', 'Supabase Storage', 'Tailwind CSS'],
      },
      {
        title: 'Real-Time Inventory & Invoicing System',
        description: 'Multi-tenant warehouse management with offline receipt reconciliation, stock alerts, and automated PDF export.',
        tech: ['React', 'Express', 'Aggregation Pipelines', 'PDFKit'],
      },
      {
        title: 'Full-Stack Developer Community & Job Board',
        description: 'Markdown articles, discussion threads, email digest triggers, and salary benchmark aggregations.',
        tech: ['React', 'Node.js', 'MongoDB', 'Tailwind CSS'],
      },
    ],
  },

  // Instructor Section (Marked hidden until real instructor bio & photo are provided)
  instructor: {
    showSection: false, // DO NOT SHOW UNTIL REAL INSTRUCTOR BIO IS PROVIDED
    placeholderNotice: 'Instructor biography and credentials will appear here upon cohort confirmation.',
    name: 'Lead Instructor',
    role: 'Principal Software Engineer & Educator',
    bio: 'Over 8 years of production engineering experience building scalable cloud backends, designing high-concurrency databases, and mentoring software developers across Pakistan.',
    photoUrl: '/images/instructor-placeholder.jpg',
    credentials: [
      '8+ years in full-stack web and cloud systems',
      'Architected systems serving hundreds of thousands of active users',
      'Passionate about clean code, strong typing, and direct mentorship',
    ],
  },

  // Transparent Fee & Installments
  feeAndInstallments: {
    sectionNumber: '03',
    heading: 'Transparent Tuition & Payment Options',
    subheading: 'No hidden admission fees. No subscription traps. Everything included.',
    tuitionPKR: 'PKR 45,000',
    tuitionNote: 'One-time payment for the full 12-week cohort',
    installmentsAllowed: true,
    installmentPlan: {
      heading: 'Pay in 2 Equal Installments',
      installment1: 'PKR 22,500 due upon registration to reserve your seat.',
      installment2: 'PKR 22,500 due midway through the cohort (end of Week 6).',
    },
    paymentMethods: [
      { name: 'JazzCash', detail: 'Instant mobile account transfer' },
      { name: 'EasyPaisa', detail: 'Instant mobile account transfer' },
      { name: 'Nayapay / SadaBiz', detail: 'Zero fee local bank & debit card transfers' },
      { name: 'Online Bank Transfer', detail: 'Direct IBFT transfer from any Pakistani bank' },
    ],
    refundSummary: {
      headline: 'Full 100% Money-Back Guarantee (First Week)',
      body: 'Attend the entire first week of live sessions. If you feel the teaching style, pacing, or curriculum is not the right fit for you, email us by Sunday midnight of Week 1 for an immediate, full 100% refund without questions.',
    },
  },

  // Who This Is For vs Who This Is Not For
  whoIsItFor: {
    sectionNumber: '04',
    heading: 'Is This Bootcamp Right For You?',
    subheading: 'We believe in honest alignment over empty sales promises.',
    forWho: [
      {
        title: 'Self-taught coders stuck in tutorial hell',
        detail: 'You have watched videos and built simple clones, but struggle when faced with a blank editor, complex business logic, or full-stack architectural decisions.',
      },
      {
        title: 'Computer Science students and fresh graduates',
        detail: 'You have theoretical knowledge from university coursework, but need hands-on experience with modern industry tools, Git workflows, clean testing, and production deployments.',
      },
      {
        title: 'Junior developers looking to level up',
        detail: 'You currently write basic frontend or backend code and want to master full-stack mechanics, indexing, security hardening, and scalable system design.',
      },
      {
        title: 'Committed individuals ready to work',
        detail: 'You can dedicate 10 to 15 hours each week to attending live lectures, completing assignments, and writing real code.',
      },
    ],
    notForWho: [
      {
        title: 'People expecting a magic shortcut',
        detail: 'We do not sell get-rich-quick fantasies or guaranteed employment overnight. Becoming a competent developer takes consistent grit and focused problem-solving.',
      },
      {
        title: 'Passive video watchers',
        detail: 'If you only intend to listen with your camera off and never write code, submit homework, or engage in code reviews, this cohort will not work for you.',
      },
      {
        title: 'Those seeking no-code or drag-and-drop builders',
        detail: 'This is a professional engineering bootcamp. You will write handwritten JavaScript, TypeScript, schema models, and tests in VS Code from day one.',
      },
      {
        title: 'Anyone who cannot commit to the schedule',
        detail: 'If you cannot commit to attending classes or spending time debugging on weekends, you will quickly fall behind.',
      },
    ],
  },

  // 8+ Actionable Real FAQs for Prospective Students
  faqs: [
    {
      question: 'What are the technical prerequisites for this bootcamp?',
      answer: 'You should have a basic understanding of computer literacy and fundamental logic (variables, loops, conditional statements in any programming language). Prior professional web development experience is NOT required; we will build your foundations systematically from Week 1.',
    },
    {
      question: 'What kind of computer hardware or laptop do I need?',
      answer: 'Any modern laptop or desktop computer running Windows 10/11, macOS, or Linux with at least 8 GB of RAM (16 GB recommended) and a stable internet connection capable of streaming live video on Google Meet. An SSD is strongly recommended for faster build and compilation times.',
    },
    {
      question: 'What are the class timings in Pakistan Standard Time (PKT)?',
      answer: 'Live classes take place every Monday, Wednesday, and Friday from 8:00 PM to 10:00 PM PKT. These evening hours are specifically chosen so university students and working professionals can attend live without schedule conflicts.',
    },
    {
      question: 'What happens if I have an emergency or miss a live session?',
      answer: 'Every live session is recorded in high definition and uploaded to your student portal within 3 hours alongside the instructor’s session notes, source code repository, and slides. You can watch the recording and ask questions asynchronously in our cohort group.',
    },
    {
      question: 'What payment methods do you accept, and can I pay in installments?',
      answer: 'We accept JazzCash, EasyPaisa, SadaBiz/Nayapay, and direct IBFT transfers from any Pakistani bank. Yes, installment plans are supported: you can pay 50% upon registration to confirm your seat, and the remaining 50% at the midpoint of the course (Week 6).',
    },
    {
      question: 'What is your refund policy?',
      answer: 'We offer an unconditional 100% money-back guarantee throughout the entire first week. If after attending Week 1 classes you decide this program is not right for you, inform us before Sunday 11:59 PM PKT and you will receive a prompt, full refund of whatever tuition you paid.',
    },
    {
      question: 'Will I receive a verified certificate upon completion?',
      answer: 'Yes. Students who maintain at least 80% class attendance, submit all weekly assignments with passing grades, and successfully present their final capstone project receive a verified, uniquely serialized CodeCraft Certificate of Completion.',
    },
    {
      question: 'Do you offer career guidance and job search support?',
      answer: 'Yes. In the final weeks, we conduct dedicated sessions on building a credible technical GitHub presence, resume reviews tailored for software engineering roles, technical interview preparation (data structures and system design fundamentals), and freelancing contract mechanics.',
    },
    {
      question: 'How many students are enrolled in each cohort?',
      answer: 'Each cohort is strictly capped at 25 students. This ensures the instructor and teaching assistants can conduct thorough, individual line-by-line reviews on every single assignment you submit rather than relying on automated grading alone.',
    },
  ],

  // Final Call to Action Band
  finalCta: {
    headline: 'Take the next step in your software engineering journey.',
    subline: 'Enrollment for the upcoming cohort is currently open. Seats are filled on a first-come, first-served basis.',
    primaryBtn: 'Enroll in the next batch',
    whatsappBtn: 'Ask a question on WhatsApp',
  },

  // Plain-Language Legal & Informational Pages
  about: {
    headline: 'Engineering craft, clear pedagogy, and zero artificial fluff.',
    paragraphs: [
      'CodeCraft was founded with a singular conviction: learning software engineering requires hands-on craftsmanship, rigorous feedback loops, and real-world tools—not pre-recorded video libraries or superficial certificates.',
      'In a market flooded with exaggerated promises and outdated academic curriculums, we focus on what modern engineering teams actually demand: clean Git workflows, robust automated testing, relational and document database modeling, and scalable full-stack architecture.',
      'Our cohorts are intentionally small. Every student receives line-by-line code critique on their assignments, live interactive mentorship during class, and direct access to instructors who write production software daily.',
    ],
    principles: [
      {
        title: 'Depth Over Shortcuts',
        description: 'We do not skip fundamentals or rely on copy-paste code snippets. We explain how the runtime works under the hood so you can solve problems independently.',
      },
      {
        title: 'Rigorous Feedback',
        description: 'Writing code is only half the battle; reading critiques of your code is how you grow. Every submission is graded against a clear, professional rubric.',
      },
      {
        title: 'Honest Expectations',
        description: 'We never fabricate success statistics, partner logos, or fake testimonials. We hold ourselves to the same standard of integrity we teach our students.',
      },
    ],
  },

  terms: {
    lastUpdated: 'October 2026',
    headline: 'Terms of Service',
    summary: 'These terms outline the agreement between you (the student) and CodeCraft Academy regarding cohort enrollment, student conduct, and intellectual property.',
    sections: [
      {
        title: '1. Enrollment & Seat Confirmation',
        content: 'Your enrollment in a cohort is confirmed once your registration form and proof of tuition (or first installment) have been reviewed and approved by the admissions team. Because cohort capacity is strictly limited, unpaid reservations expire after 48 hours.',
      },
      {
        title: '2. Code of Conduct & Academic Integrity',
        content: 'Students are expected to treat peers and instructors with professional respect in all live sessions and discussion groups. Plagiarism, copying homework from other students, or submitting work that is not your own may result in immediate dismissal without refund.',
      },
      {
        title: '3. Intellectual Property',
        content: 'All live lectures, curriculum slides, proprietary assignments, and course notes provided by CodeCraft are the intellectual property of CodeCraft Academy. Students may not redistribute, publicly broadcast, or resell course materials. Any software or projects authored by the student remain the sole property of the student.',
      },
      {
        title: '4. Attendance & Certification Requirements',
        content: 'To receive the verified Certificate of Completion, a student must maintain at least 80% attendance (live or recorded session reviews), achieve passing marks on required homework assignments, and complete the final capstone project.',
      },
    ],
  },

  privacy: {
    lastUpdated: 'October 2026',
    headline: 'Privacy Policy',
    summary: 'We believe in minimal, transparent data collection. We do not sell your personal data or use invasive third-party tracking scripts.',
    sections: [
      {
        title: '1. Information We Collect',
        content: 'We only collect the personal information you explicitly provide: your name, email address, phone number, and transaction verification details for enrollment or contact inquiries. We do not store banking credentials or payment card numbers.',
      },
      {
        title: '2. How We Use Your Information',
        content: 'Your contact details are used strictly to communicate cohort updates, class links, assignment feedback, and admissions notifications. We will never sell, rent, or trade your personal data with third-party marketers.',
      },
      {
        title: '3. Storage & Security',
        content: 'All user data is stored in secured, password-protected databases with encrypted connections. File uploads (such as assignment submissions) are securely isolated in private object storage buckets.',
      },
      {
        title: '4. Cookies & Analytics',
        content: 'The CodeCraft public website is cookie-free by default. We do not load marketing trackers, pixel beacons, or invasive third-party analytics scripts.',
      },
    ],
  },

  refundPolicy: {
    lastUpdated: 'October 2026',
    headline: 'Tuition Refund Policy',
    summary: 'We offer an honest, risk-free trial period during Week 1 of every cohort.',
    sections: [
      {
        title: '1. 100% Full Refund Guarantee (Week 1)',
        content: 'We want every student to be entirely confident in their investment. You can attend all live sessions during the first calendar week of the cohort. If you feel the program is not the right fit for your schedule or learning goals, notify us via email (admissions@codecraft.pk) or WhatsApp before Sunday 11:59 PM PKT of Week 1 for a prompt, 100% full refund.',
      },
      {
        title: '2. Post-Week 1 Withdrawals',
        content: 'After the completion of Week 1, seats cannot be reassigned to other applicants. Therefore, tuition payments and installments become non-refundable after Sunday midnight of Week 1. In cases of documented medical emergencies, students may request to defer their enrollment to the subsequent cohort.',
      },
      {
        title: '3. Refund Processing Timeline',
        content: 'Approved refunds are processed via the original payment method (JazzCash, EasyPaisa, or direct bank transfer) within 3 to 5 business days.',
      },
    ],
  },

  // Footer Navigation
  footer: {
    copyright: `© ${new Date().getFullYear()} CodeCraft Bootcamp. All rights reserved.`,
    groups: [
      {
        title: 'Course',
        links: [
          { label: 'All Courses', href: '/courses' },
          { label: 'Syllabus Breakdown', href: '/#syllabus' },
          { label: 'How It Works', href: '/#how-it-works' },
          { label: 'Tuition & Pricing', href: '/#tuition' },
        ],
      },
      {
        title: 'Academy',
        links: [
          { label: 'About Us', href: '/about' },
          { label: 'Frequently Asked Questions', href: '/faq' },
          { label: 'Contact & Inquiries', href: '/contact' },
        ],
      },
      {
        title: 'Support',
        links: [
          { label: 'Chat on WhatsApp', href: 'https://wa.me/923001234567' },
          { label: 'Admissions Email', href: 'mailto:admissions@codecraft.pk' },
          { label: 'Student Portal', href: '/login' },
        ],
      },
      {
        title: 'Legal',
        links: [
          { label: 'Terms of Service', href: '/terms' },
          { label: 'Privacy Policy', href: '/privacy' },
          { label: 'Refund Policy', href: '/refunds' },
        ],
      },
    ],
  },
};

export default siteContent;
