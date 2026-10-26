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
  MessageCircle,
  HelpCircle,
  ShieldCheck,
  Check,
  X,
  Code,
  Sparkles,
} from 'lucide-react';
import { siteContent } from '../../content/site';
import courseService from '../../services/course.service';
import settingsService from '../../services/settings.service';
import { useDocumentMeta, generateCourseSchema } from '../../utils/seo';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card, { CardContent } from '../../components/ui/Card';

export const HomePage = () => {
  const [activeCourse, setActiveCourse] = useState(null);
  const [publicSettings, setPublicSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);

  // SEO & WhatsApp link previews
  useDocumentMeta({
    title: 'CodeCraft Bootcamp — Live Full Stack Software Engineering',
    description: siteContent.hero.subline,
    canonicalPath: '/',
    ogImage: '/og-image.png',
    jsonLd: generateCourseSchema({
      title: activeCourse?.title || siteContent.hero.courseInfoFallback.title,
      description: activeCourse?.tagline || siteContent.hero.subline,
      fee: activeCourse?.fee || 45000,
      startDate: activeCourse?.startDate || '2026-11-15',
    }),
  });

  // Fetch real course data and public settings
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [coursesData, settingsData] = await Promise.allSettled([
          courseService.getPublicCourses(),
          settingsService.getPublicSettings(),
        ]);

        if (mounted) {
          if (coursesData.status === 'fulfilled' && Array.isArray(coursesData.value) && coursesData.value.length > 0) {
            // Pick primary active course
            const primary = coursesData.value.find((c) => c.isEnrollmentOpen) || coursesData.value[0];
            setActiveCourse(primary);
          }
          if (settingsData.status === 'fulfilled' && settingsData.value) {
            setPublicSettings(settingsData.value);
          }
        }
      } catch (err) {
        console.warn('Using siteContent fallbacks:', err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const formatPKR = (num) => {
    if (!num) return siteContent.feeAndInstallments.tuitionPKR;
    return `PKR ${Number(num).toLocaleString('en-PK')}`;
  };

  const courseStartDate = activeCourse?.startDate
    ? new Date(activeCourse.startDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : siteContent.hero.courseInfoFallback.startDate;

  const courseSchedule = activeCourse?.schedule || siteContent.hero.courseInfoFallback.schedule;
  const courseFee = activeCourse?.fee ? formatPKR(activeCourse.fee) : siteContent.hero.courseInfoFallback.fee;
  const installmentAllowed = activeCourse ? activeCourse.installmentsAllowed : true;
  const courseEnrollUrl = activeCourse ? `/enroll/${activeCourse._id}` : '/courses';
  const whatsappLink = `https://wa.me/${siteContent.brand.whatsappDigits}?text=${encodeURIComponent(
    'Hi CodeCraft! I am interested in enrolling in the upcoming full stack cohort.'
  )}`;

  return (
    <div className="bg-paper text-ink">
      {/* ======================================================== */}
      {/* 1. HERO SECTION                                          */}
      {/* ======================================================== */}
      <section className="pt-12 pb-16 md:pt-20 md:pb-24 border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-start">
            {/* Left Column: Outcome Headline and Intent */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-primary-soft text-primary text-xs font-medium mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {siteContent.hero.badge}
              </div>

              <h1 className="font-serif font-semibold text-3xl sm:text-4xl md:text-5xl text-ink leading-[1.12] tracking-tight mb-6">
                {siteContent.hero.headline}
              </h1>

              <p className="text-base sm:text-lg text-ink-muted leading-relaxed max-w-xl mb-8">
                {siteContent.hero.subline}
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
                <a href="#next-batch">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto">
                    {siteContent.hero.primaryCta}
                  </Button>
                </a>
                <a href="#syllabus">
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                    {siteContent.hero.secondaryCta}
                  </Button>
                </a>
              </div>

              <div className="mt-8 flex items-center gap-6 text-xs text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  36 Live Sessions
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  1-on-1 Code Reviews
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  Max 25 Cohort Seats
                </span>
              </div>
            </div>

            {/* Right Column: Course Info Panel (Real API Data + Fallbacks) */}
            <div id="next-batch" className="lg:col-span-5 w-full">
              <div className="bg-surface border border-line rounded-lg p-6 sm:p-7 shadow-xs">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-line">
                  <div>
                    <span className="text-[11px] font-semibold tracking-wider text-ink-muted uppercase">
                      Next Live Cohort
                    </span>
                    <h3 className="font-serif font-semibold text-lg text-ink">
                      {activeCourse?.title || siteContent.hero.courseInfoFallback.title}
                    </h3>
                  </div>
                  <Badge variant="primary" dot>
                    Active Batch
                  </Badge>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="flex items-start justify-between">
                    <span className="text-ink-muted flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-ink-muted shrink-0" />
                      Start Date
                    </span>
                    <span className="font-semibold text-ink text-right">{courseStartDate}</span>
                  </div>

                  <div className="flex items-start justify-between">
                    <span className="text-ink-muted flex items-center gap-2">
                      <Clock className="w-4 h-4 text-ink-muted shrink-0" />
                      Class Times
                    </span>
                    <span className="font-medium text-ink text-right max-w-[200px]">
                      {courseSchedule}
                    </span>
                  </div>

                  <div className="flex items-start justify-between">
                    <span className="text-ink-muted flex items-center gap-2">
                      <Users className="w-4 h-4 text-ink-muted shrink-0" />
                      Cohort Capacity
                    </span>
                    <span className="font-medium text-ink">
                      {activeCourse?.seatsTotal ? `Max ${activeCourse.seatsTotal} students` : 'Strictly 25 seats'}
                    </span>
                  </div>

                  <div className="flex items-start justify-between pt-2 border-t border-line">
                    <span className="text-ink-muted flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-ink-muted shrink-0" />
                      Tuition Fee
                    </span>
                    <div className="text-right">
                      <span className="font-serif font-bold text-base text-ink">{courseFee}</span>
                      {installmentAllowed && (
                        <span className="block text-[11px] text-primary font-medium">
                          or 2 installments of PKR 22,500
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-1 text-[11px] text-ink-muted">
                    <span className="font-medium text-ink">Payment methods accepted: </span>
                    {publicSettings?.paymentMethods?.length > 0
                      ? publicSettings.paymentMethods.map((m) => m.type.toUpperCase()).join(', ')
                      : siteContent.hero.courseInfoFallback.paymentMethods}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-line">
                  <Link to={courseEnrollUrl}>
                    <Button variant="primary" size="lg" className="w-full" rightIcon={ArrowRight}>
                      Reserve Your Seat
                    </Button>
                  </Link>
                  <p className="text-[11px] text-ink-muted text-center mt-2.5">
                    No risk. Full 100% money-back guarantee in Week 1.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. HOW IT WORKS (Numbered steps separated by thin rules) */}
      {/* ======================================================== */}
      <section id="how-it-works" className="py-16 md:py-24 border-b border-line bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-xl mb-12">
            <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
              {siteContent.howItWorks.sectionNumber} / Process
            </span>
            <h2 className="font-serif font-semibold text-2xl sm:text-3xl text-ink mt-2">
              {siteContent.howItWorks.heading}
            </h2>
            <p className="text-sm text-ink-muted mt-2">
              {siteContent.howItWorks.subheading}
            </p>
          </div>

          {/* 4 Steps separated by clean thin rules, NOT a card grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 border-t border-b border-line divide-y md:divide-y-0 md:divide-x divide-line">
            {siteContent.howItWorks.steps.map((step) => (
              <div key={step.number} className="p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <span className="font-mono text-xs font-semibold text-ink-muted block mb-3">
                    {step.number}
                  </span>
                  <h3 className="font-semibold text-base text-ink mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. SYLLABUS PREVIEW (8 Expandable Modules)               */}
      {/* ======================================================== */}
      <section id="syllabus" className="py-16 md:py-24 border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-xl mb-12">
            <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
              {siteContent.syllabus.sectionNumber} / Curriculum
            </span>
            <h2 className="font-serif font-semibold text-2xl sm:text-3xl text-ink mt-2">
              {siteContent.syllabus.heading}
            </h2>
            <p className="text-sm text-ink-muted mt-2">
              {siteContent.syllabus.subheading}
            </p>
          </div>

          <div className="border-t border-line divide-y divide-line">
            {siteContent.syllabus.modules.map((mod, idx) => {
              const isExpanded = expandedModule === idx;
              return (
                <div key={mod.number} className="transition-colors">
                  <button
                    type="button"
                    onClick={() => setExpandedModule(isExpanded ? -1 : idx)}
                    className="w-full py-5 flex items-center justify-between text-left group hover:text-primary transition-colors focus:outline-none"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-baseline gap-4 sm:gap-6 min-w-0 pr-4">
                      <span className="font-mono text-sm font-semibold text-ink-muted group-hover:text-primary shrink-0">
                        {mod.number}
                      </span>
                      <div>
                        <h3 className="font-serif font-semibold text-base sm:text-lg text-ink group-hover:text-primary transition-colors">
                          {mod.title}
                        </h3>
                        <span className="text-xs text-ink-muted font-mono">{mod.weeks}</span>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-ink-muted transition-transform duration-200 shrink-0 ${
                        isExpanded ? 'rotate-180 text-primary' : ''
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="pb-6 pl-10 sm:pl-12 pr-4">
                      <p className="text-xs sm:text-sm text-ink-muted mb-4 leading-relaxed">
                        {mod.summary}
                      </p>
                      <div className="bg-surface border border-line rounded p-4">
                        <span className="text-[11px] font-semibold text-ink uppercase tracking-wider block mb-2 font-mono">
                          Key Module Topics:
                        </span>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-ink-muted">
                          {mod.topics.map((topic, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-primary font-bold">›</span>
                              <span>{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex items-center justify-between p-4 bg-surface-alt border border-line rounded">
            <span className="text-xs text-ink-muted">
              Want the full syllabus and weekly homework breakdown?
            </span>
            <Link to="/courses" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              Explore All Cohorts <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. CONDITIONAL SECTIONS (Strictly Hidden When Flagged)  */}
      {/* ======================================================== */}
      {siteContent.projects.showSection && (
        <section className="py-16 md:py-24 border-b border-line bg-surface">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-xl mb-12">
              <h2 className="font-serif font-semibold text-2xl text-ink">What You Will Build</h2>
              <p className="text-xs text-ink-muted mt-2">{siteContent.projects.placeholderNotice}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {siteContent.projects.items.map((proj, idx) => (
                <div key={idx} className="border border-line rounded p-6 bg-paper">
                  <h3 className="font-semibold text-base text-ink mb-2">{proj.title}</h3>
                  <p className="text-xs text-ink-muted leading-relaxed mb-4">{proj.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {proj.tech.map((t, i) => (
                      <span key={i} className="text-[10px] font-mono px-2 py-0.5 bg-surface border border-line rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {siteContent.instructor.showSection && (
        <section className="py-16 md:py-24 border-b border-line">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-xl mb-12">
              <h2 className="font-serif font-semibold text-2xl text-ink">Meet Your Instructor</h2>
              <p className="text-xs text-ink-muted mt-2">{siteContent.instructor.placeholderNotice}</p>
            </div>
            <div className="border border-line rounded p-8 bg-surface max-w-2xl">
              <h3 className="font-semibold text-lg text-ink">{siteContent.instructor.name}</h3>
              <span className="text-xs text-primary font-medium">{siteContent.instructor.role}</span>
              <p className="text-xs text-ink-muted leading-relaxed mt-3">{siteContent.instructor.bio}</p>
            </div>
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* 5. TRANSPARENT FEE & INSTALLMENTS                       */}
      {/* ======================================================== */}
      <section id="tuition" className="py-16 md:py-24 border-b border-line bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-xl mb-12">
            <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
              {siteContent.feeAndInstallments.sectionNumber} / Tuition
            </span>
            <h2 className="font-serif font-semibold text-2xl sm:text-3xl text-ink mt-2">
              {siteContent.feeAndInstallments.heading}
            </h2>
            <p className="text-sm text-ink-muted mt-2">
              {siteContent.feeAndInstallments.subheading}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Fee Card */}
            <div className="lg:col-span-6 bg-paper border border-line rounded-lg p-8">
              <span className="text-xs font-mono text-ink-muted uppercase">Full 12-Week Tuition</span>
              <div className="mt-2 mb-4">
                <span className="font-serif font-bold text-4xl text-ink">{courseFee}</span>
                <span className="text-xs text-ink-muted block mt-1">
                  {siteContent.feeAndInstallments.tuitionNote}
                </span>
              </div>

              <div className="space-y-3 pt-4 border-t border-line text-xs">
                <div className="flex items-center gap-2 text-ink">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>36 Live Evening Classes (Mon/Wed/Fri 8-10 PM PKT)</span>
                </div>
                <div className="flex items-center gap-2 text-ink">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>Line-by-line rubric feedback on all weekly assignments</span>
                </div>
                <div className="flex items-center gap-2 text-ink">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>Direct WhatsApp cohort group & instructor office hours</span>
                </div>
                <div className="flex items-center gap-2 text-ink">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span>Verified Serialized Certificate upon Capstone defense</span>
                </div>
              </div>

              {installmentAllowed && (
                <div className="mt-6 pt-6 border-t border-line bg-surface-alt -mx-8 -mb-8 p-6 rounded-b-lg">
                  <span className="text-xs font-semibold text-ink uppercase tracking-wider font-mono block mb-1">
                    {siteContent.feeAndInstallments.installmentPlan.heading}
                  </span>
                  <div className="space-y-1.5 text-xs text-ink-muted">
                    <p>• {siteContent.feeAndInstallments.installmentPlan.installment1}</p>
                    <p>• {siteContent.feeAndInstallments.installmentPlan.installment2}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Payment Methods & Refund Policy */}
            <div className="lg:col-span-6 space-y-6">
              <div className="bg-paper border border-line rounded-lg p-6">
                <h3 className="font-semibold text-sm text-ink mb-3 uppercase tracking-wider font-mono">
                  Accepted Payment Methods (Pakistan)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {siteContent.feeAndInstallments.paymentMethods.map((m, idx) => (
                    <div key={idx} className="p-3 bg-surface border border-line rounded">
                      <span className="font-semibold text-ink block">{m.name}</span>
                      <span className="text-[11px] text-ink-muted">{m.detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-primary/20 bg-primary-soft/40 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm text-ink mb-1">
                      {siteContent.feeAndInstallments.refundSummary.headline}
                    </h4>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      {siteContent.feeAndInstallments.refundSummary.body}
                    </p>
                    <Link to="/refunds" className="text-xs font-semibold text-primary hover:underline mt-2 inline-block">
                      Read full refund terms →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. WHO THIS IS FOR VS WHO THIS IS NOT FOR                */}
      {/* ======================================================== */}
      <section className="py-16 md:py-24 border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-xl mb-12">
            <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
              {siteContent.whoIsItFor.sectionNumber} / Fit
            </span>
            <h2 className="font-serif font-semibold text-2xl sm:text-3xl text-ink mt-2">
              {siteContent.whoIsItFor.heading}
            </h2>
            <p className="text-sm text-ink-muted mt-2">
              {siteContent.whoIsItFor.subheading}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Who It Is For */}
            <div className="border border-line rounded-lg p-6 sm:p-8 bg-surface">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary mb-6 font-mono">
                <Check className="w-4 h-4 text-primary" />
                Who this bootcamp is built for
              </div>
              <ul className="space-y-6">
                {siteContent.whoIsItFor.forWho.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm text-ink">{item.title}</h4>
                      <p className="text-xs text-ink-muted mt-1 leading-relaxed">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Who It Is NOT For */}
            <div className="border border-line rounded-lg p-6 sm:p-8 bg-surface">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-danger mb-6 font-mono">
                <X className="w-4 h-4 text-danger" />
                Who this bootcamp is NOT for
              </div>
              <ul className="space-y-6">
                {siteContent.whoIsItFor.notForWho.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger mt-2 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm text-ink">{item.title}</h4>
                      <p className="text-xs text-ink-muted mt-1 leading-relaxed">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 7. FAQ ACCORDION (At Least 8 Actionable Questions)       */}
      {/* ======================================================== */}
      <section id="faq" className="py-16 md:py-24 border-b border-line bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">
              Answers & Clarifications
            </span>
            <h2 className="font-serif font-semibold text-2xl sm:text-3xl text-ink mt-2">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-ink-muted mt-2">
              Straightforward answers about our admissions, class timings, and hardware requirements.
            </p>
          </div>

          <div className="border-t border-line divide-y divide-line">
            {siteContent.faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                    className="w-full flex items-center justify-between text-left group py-2 focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="font-medium text-sm sm:text-base text-ink group-hover:text-primary transition-colors pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-ink-muted transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-primary' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="pt-2 pb-3 pr-6 text-xs sm:text-sm text-ink-muted leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <p className="text-xs text-ink-muted mb-3">
              Still have questions about whether this cohort fits your goals?
            </p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
            >
              <MessageCircle className="w-4 h-4" />
              Chat directly with our admissions coordinator on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 8. FINAL CTA BAND                                        */}
      {/* ======================================================== */}
      <section className="py-16 md:py-24 bg-paper">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-primary-soft text-primary text-xs font-medium mb-4">
            Next Cohort Starts {courseStartDate}
          </div>

          <h2 className="font-serif font-semibold text-3xl sm:text-4xl text-ink leading-tight mb-4">
            {siteContent.finalCta.headline}
          </h2>

          <p className="text-sm sm:text-base text-ink-muted max-w-lg mx-auto mb-8 leading-relaxed">
            {siteContent.finalCta.subline}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={courseEnrollUrl}>
              <Button variant="primary" size="lg" rightIcon={ArrowRight}>
                {siteContent.finalCta.primaryBtn}
              </Button>
            </Link>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink px-4 py-2"
            >
              <MessageCircle className="w-4 h-4 text-primary" />
              {siteContent.finalCta.whatsappBtn}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
