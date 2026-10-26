import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CreditCard,
  Users,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card, { CardContent } from '../../components/ui/Card';

export const HomePage = () => {
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    document.title = 'CodeCraft Academy — Intensive Live Software Bootcamps';
  }, []);

  const faqs = [
    {
      q: 'Are classes live or pre-recorded?',
      a: 'All sessions are strictly live and interactive on Google Meet or Zoom with direct screen sharing, code reviews, and live debugging. We do not provide recorded video libraries—attendance and live participation are required.',
    },
    {
      q: 'How does the enrollment payment work in Pakistan?',
      a: 'After submitting your registration form, you can complete the fee transfer via JazzCash, Easypaisa, or direct online bank transfer (IBFT). You upload the transaction receipt screenshot in your student portal. The instructor reviews and approves your enrollment within 24 hours.',
    },
    {
      q: 'What happens if I miss a live session?',
      a: 'Since all classes are conducted live without video recordings, missing a class requires reviewing the lecture notes, code repositories, and assignments provided after each session. You can ask questions in the next session or during the weekly office hours.',
    },
    {
      q: 'Are there any hidden charges or software license fees?',
      a: 'No. The bootcamp fee covers all lectures, assignments, quizzes, direct code grading, and access to the student portal. All tools and technologies taught use open-source software and free deployment tiers.',
    },
  ];

  const syllabus = [
    {
      number: '01',
      title: 'Modern JavaScript & Backend Architecture',
      topics: 'ES modules, asynchronous runtime, Node.js event loop, Express routing, middleware pipelines, and API security headers.',
    },
    {
      number: '02',
      title: 'Database Design & Production Modeling',
      topics: 'MongoDB Atlas schema modeling, indexing strategies, Mongoose validation, aggregation pipelines, and ACID transactions.',
    },
    {
      number: '03',
      title: 'Interactive Frontend Engineering',
      topics: 'React 18 fundamentals, component lifecycles, custom hooks, state synchronization, form validations with Zod, and Tailwind design systems.',
    },
    {
      number: '04',
      title: 'Security, Testing & Cloud Deployment',
      topics: 'JWT authentication, bcrypt hashing, automated integration testing with Jest, Docker containers, and Render/Vercel zero-downtime deployment.',
    },
  ];

  return (
    <div>
      {/* Hero Section (96px desktop, 56px mobile) */}
      <section className="py-14 md:py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          {/* Left Column: Heading and Value Proposition */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <Badge variant="primary" dot>
                Fall 2026 Admissions Open
              </Badge>
              <span className="text-xs text-ink-muted">Small cohorts • Maximum 25 students</span>
            </div>

            <h1 className="font-display font-semibold text-3xl sm:text-4xl lg:text-5xl text-ink leading-tight tracking-tight mb-6">
              Engineering bootcamps taught live by a senior practitioner.
            </h1>

            <p className="text-base text-ink-muted leading-relaxed max-w-prose mb-8">
              Rigorous, live online training in full-stack web development and applied engineering. Built for developers in Pakistan who demand real code reviews, live debugging, and production standards—not pre-recorded video tutorials.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link to="/courses">
                <Button variant="primary" size="lg" rightIcon={ArrowRight} className="w-full sm:w-auto">
                  View Syllabus & Fees
                </Button>
              </Link>
              <Link to="/admissions">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  How Admissions Work
                </Button>
              </Link>
            </div>

            {/* Quick credentials strip */}
            <div className="mt-12 pt-8 border-t border-line grid grid-cols-3 gap-6">
              <div>
                <span className="font-display font-semibold text-xl text-ink tabular-nums">100%</span>
                <p className="text-xs text-ink-muted mt-1">Live classes on Zoom/Meet</p>
              </div>
              <div>
                <span className="font-display font-semibold text-xl text-ink tabular-nums">25</span>
                <p className="text-xs text-ink-muted mt-1">Seats cap per cohort</p>
              </div>
              <div>
                <span className="font-display font-semibold text-xl text-ink tabular-nums">1-on-1</span>
                <p className="text-xs text-ink-muted mt-1">Weekly code reviews</p>
              </div>
            </div>
          </div>

          {/* Right Column: Real Course Info Panel */}
          <div className="lg:col-span-5">
            <div className="bg-surface border border-line rounded-lg shadow-card overflow-hidden">
              <div className="bg-surface-alt px-5 py-4 border-b border-line flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                    Next Available Batch
                  </span>
                  <h3 className="font-display font-semibold text-base text-ink mt-0.5">
                    MERN Full-Stack Bootcamp
                  </h3>
                </div>
                <Badge variant="accent" dot>
                  6 seats left
                </Badge>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="flex items-start gap-3 py-2 border-b border-line/60">
                  <Calendar className="w-4 h-4 text-ink-muted shrink-0 mt-0.5 stroke-[1.5]" />
                  <div className="flex-1 flex justify-between">
                    <span className="text-ink-muted">Start Date</span>
                    <span className="font-medium text-ink">November 15, 2026</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-2 border-b border-line/60">
                  <Clock className="w-4 h-4 text-ink-muted shrink-0 mt-0.5 stroke-[1.5]" />
                  <div className="flex-1 flex justify-between">
                    <span className="text-ink-muted">Class Schedule</span>
                    <span className="font-medium text-ink text-right">Tue & Thu, 8:00 PM – 10:00 PM PKT</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-2 border-b border-line/60">
                  <Users className="w-4 h-4 text-ink-muted shrink-0 mt-0.5 stroke-[1.5]" />
                  <div className="flex-1 flex justify-between">
                    <span className="text-ink-muted">Cohort Size</span>
                    <span className="font-medium text-ink">Strict limit of 25 students</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 py-2 border-b border-line/60">
                  <CreditCard className="w-4 h-4 text-ink-muted shrink-0 mt-0.5 stroke-[1.5]" />
                  <div className="flex-1 flex justify-between">
                    <span className="text-ink-muted">Tuition Fee</span>
                    <span className="font-display font-semibold text-sm text-ink tabular-nums">
                      Rs. 24,000 PKR
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link to="/register" className="block w-full">
                    <Button variant="primary" size="md" className="w-full">
                      Apply For This Cohort
                    </Button>
                  </Link>
                  <p className="text-[11px] text-center text-ink-muted mt-2">
                    Pay via JazzCash, Easypaisa, or direct bank transfer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Rule */}
      <hr className="border-t border-line" />

      {/* Section: Numbered Syllabus (01, 02, 03, 04) */}
      <section className="py-14 md:py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-12 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Curriculum Structure
          </span>
          <h2 className="font-display font-semibold text-2xl md:text-3xl text-ink mt-2 mb-3 tracking-tight">
            Designed around production systems, not toy examples.
          </h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            Every module includes live code demonstrations, required individual assignments, and direct feedback from the instructor.
          </p>
        </div>

        <div className="divide-y divide-line border-y border-line">
          {syllabus.map((item) => (
            <div key={item.number} className="py-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline">
              <div className="md:col-span-2">
                <span className="font-mono text-sm font-bold text-accent">
                  {item.number}
                </span>
              </div>
              <div className="md:col-span-4">
                <h3 className="font-display font-semibold text-lg text-ink">
                  {item.title}
                </h3>
              </div>
              <div className="md:col-span-6">
                <p className="text-sm text-ink-muted leading-relaxed">
                  {item.topics}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Editorial Rule */}
      <hr className="border-t border-line" />

      {/* Section: Admissions Process */}
      <section className="py-14 md:py-24 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-12 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Admissions & Payment Flow
          </span>
          <h2 className="font-display font-semibold text-2xl md:text-3xl text-ink mt-2 mb-3 tracking-tight">
            Straightforward registration and local payment support.
          </h2>
          <p className="text-sm text-ink-muted leading-relaxed">
            No international credit card required. We support domestic Pakistan payment channels directly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <span className="text-xs font-mono font-bold text-ink-muted">STEP 01</span>
              <h3 className="font-display font-semibold text-base text-ink mt-2 mb-2">
                Submit Online Application
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Provide your basic contact information and select the desired course cohort. An account is immediately provisioned in our student portal.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <span className="text-xs font-mono font-bold text-ink-muted">STEP 02</span>
              <h3 className="font-display font-semibold text-base text-ink mt-2 mb-2">
                Transfer Fee & Upload Proof
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Send the tuition fee via JazzCash, Easypaisa, or Bank IBFT. Submit the transaction ID and receipt screenshot directly through your dashboard.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <span className="text-xs font-mono font-bold text-ink-muted">STEP 03</span>
              <h3 className="font-display font-semibold text-base text-ink mt-2 mb-2">
                Instructor Verification
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Within 24 hours, the instructor validates your payment and issues an approved enrollment pass. Class links and notes activate automatically.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Editorial Rule */}
      <hr className="border-t border-line" />

      {/* Section: Frequently Asked Questions (Accordion) */}
      <section className="py-14 md:py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="mb-10 text-center max-w-xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Frequently Asked Questions
          </span>
          <h2 className="font-display font-semibold text-2xl md:text-3xl text-ink mt-2 mb-3 tracking-tight">
            Everything you need to know before joining.
          </h2>
        </div>

        <div className="border-t border-line divide-y divide-line">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={faq.q} className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  className="w-full flex items-center justify-between text-left gap-4 py-2 focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-sm text-ink">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-ink-muted shrink-0 transition-transform duration-150 stroke-[1.5] ${
                      isOpen ? 'rotate-180 text-ink' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="text-xs text-ink-muted leading-relaxed pt-2 pb-2 pr-6">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
