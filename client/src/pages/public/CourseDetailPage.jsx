import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CreditCard,
  Users,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import courseService from '../../services/course.service';
import { useAuth } from '../../context/AuthContext';
import { Badge, Button, Card, CardContent, Skeleton, Breadcrumbs } from '../../components/ui';
import { useDocumentMeta, generateCourseSchema } from '../../utils/seo';

export const CourseDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedModule, setExpandedModule] = useState(0);

  useDocumentMeta({
    title: course ? course.title : 'Loading Course...',
    description: course ? course.tagline : 'Live cohort details and syllabus breakdown.',
    canonicalPath: `/courses/${slug}`,
    jsonLd: course
      ? generateCourseSchema({
          title: course.title,
          description: course.tagline,
          fee: course.fee,
          startDate: course.startDate,
        })
      : null,
  });

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await courseService.getCourseBySlug(slug);
        setCourse(data);
        document.title = `${data.title} — CodeCraft Academy`;
      } catch (err) {
        setError(err.message || 'Course not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [slug]);

  const formatPKR = (amount) => {
    return `Rs. ${Number(amount).toLocaleString('en-PK')}`;
  };

  const handleEnrollClick = () => {
    if (!course) return;

    if (!isAuthenticated) {
      // Send logged-out users to Register with return URL
      navigate(`/register?redirect=/enroll/${course._id}`);
    } else {
      // Student proceeds directly to enrollment wizard
      navigate(`/enroll/${course._id}`);
    }
  };

  if (loading) {
    return (
      <div className="py-12 max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="py-16 max-w-md mx-auto px-4 text-center">
        <AlertCircle className="w-10 h-10 text-danger mx-auto mb-3 stroke-[1.5]" />
        <h2 className="font-display font-semibold text-xl text-ink">Course Not Found</h2>
        <p className="text-xs text-ink-muted mt-2 mb-6 leading-relaxed">
          {error || 'This bootcamp course is currently unavailable or unpublished.'}
        </p>
        <Link to="/courses">
          <Button variant="secondary" size="md">
            View All Bootcamps
          </Button>
        </Link>
      </div>
    );
  }

  const seatsLeft = course.seatsLeft ?? course.seatsTotal;
  const isFull = course.isFull || seatsLeft <= 0;

  return (
    <div className="py-10 md:py-16 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Bootcamps', to: '/courses' },
          { label: course.title },
        ]}
        className="mb-6"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Syllabus, Outcomes, Description */}
        <div className="lg:col-span-8 space-y-12">
          {/* Header Info */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="primary">{course.level}</Badge>
              <Badge variant="neutral">{course.durationWeeks} Weeks</Badge>
              {course.isEnrollmentOpen ? (
                <Badge variant="success" dot>Admissions Open</Badge>
              ) : (
                <Badge variant="danger" dot>Admissions Closed</Badge>
              )}
            </div>

            <h1 className="font-display font-semibold text-3xl md:text-4xl text-ink tracking-tight mb-4 leading-tight">
              {course.title}
            </h1>

            <p className="text-base text-ink-muted leading-relaxed max-w-prose">
              {course.tagline}
            </p>
          </div>

          {/* Overview Description */}
          <div className="space-y-4 pt-4 border-t border-line">
            <h3 className="font-display font-semibold text-lg text-ink">
              Program Overview
            </h3>
            <div className="text-sm text-ink-muted leading-relaxed space-y-3 max-w-prose whitespace-pre-line">
              {course.description}
            </div>
          </div>

          {/* Editorial Numbered Syllabus */}
          {course.syllabus && course.syllabus.length > 0 && (
            <div className="space-y-6 pt-4 border-t border-line">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Curriculum Breakdown
                </span>
                <h3 className="font-display font-semibold text-xl text-ink mt-1">
                  Numbered Syllabus & Weekly Topics
                </h3>
              </div>

              <div className="border-t border-line divide-y divide-line">
                {course.syllabus.map((mod, idx) => {
                  const num = String(mod.order || idx + 1).padStart(2, '0');
                  const isOpen = expandedModule === idx;

                  return (
                    <div key={mod._id || idx} className="py-5">
                      <button
                        type="button"
                        onClick={() => setExpandedModule(isOpen ? -1 : idx)}
                        className="w-full flex items-start justify-between text-left gap-4 focus:outline-none group"
                        aria-expanded={isOpen}
                      >
                        <div className="flex items-start gap-4">
                          <span className="font-mono text-sm font-bold text-accent shrink-0 pt-0.5">
                            {num}
                          </span>
                          <div>
                            <h4 className="font-display font-semibold text-base text-ink group-hover:text-primary transition-colors">
                              {mod.title}
                            </h4>
                            <span className="text-xs text-ink-muted block mt-0.5">
                              {mod.topics?.length || 0} core engineering topics
                            </span>
                          </div>
                        </div>

                        <ChevronDown
                          className={`w-4 h-4 text-ink-muted shrink-0 transition-transform duration-150 mt-1 stroke-[1.5] ${
                            isOpen ? 'rotate-180 text-ink' : ''
                          }`}
                        />
                      </button>

                      {isOpen && mod.topics && mod.topics.length > 0 && (
                        <div className="mt-4 pl-9 space-y-2">
                          <ul className="space-y-1.5 text-xs text-ink-muted">
                            {mod.topics.map((topic, tIdx) => (
                              <li key={tIdx} className="flex items-start gap-2">
                                <span className="text-primary font-bold">•</span>
                                <span>{topic}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Learning Outcomes */}
          {course.outcomes && course.outcomes.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-line">
              <h3 className="font-display font-semibold text-lg text-ink">
                What You Will Build & Master
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {course.outcomes.map((outcome, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 bg-surface border border-line rounded text-xs text-ink">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5 stroke-[1.5]" />
                    <span>{outcome}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prerequisites / Requirements */}
          {course.requirements && course.requirements.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-line">
              <h3 className="font-display font-semibold text-lg text-ink">
                Prerequisites & Hardware Requirements
              </h3>
              <ul className="space-y-2 text-xs text-ink-muted">
                {course.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-accent font-bold">—</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Real Course Info & Fee Card */}
        <div className="lg:col-span-4 sticky top-24">
          <div className="bg-surface border border-line rounded-lg shadow-card overflow-hidden">
            <div className="bg-surface-alt px-5 py-4 border-b border-line flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Admissions Pass
              </span>
              {isFull ? (
                <Badge variant="danger" dot>Cohort Full</Badge>
              ) : seatsLeft <= 5 ? (
                <Badge variant="accent" dot>{seatsLeft} seats left</Badge>
              ) : (
                <Badge variant="success" dot>{seatsLeft} seats open</Badge>
              )}
            </div>

            <div className="p-6 space-y-5">
              <div>
                <span className="text-xs text-ink-muted block mb-1">Tuition Fee</span>
                <span className="font-display font-semibold text-3xl text-ink tabular-nums tracking-tight">
                  {formatPKR(course.fee)}
                </span>
                <span className="text-xs text-ink-muted block mt-1">
                  Full access including assignments & grading
                </span>
              </div>

              {course.installmentsAllowed && course.installmentPlan && (
                <div className="p-3 bg-primary-soft/50 border border-primary/20 rounded text-xs text-primary space-y-0.5">
                  <span className="font-semibold block">Installment Plan Available</span>
                  <p className="text-[11px] leading-relaxed opacity-90">{course.installmentPlan}</p>
                </div>
              )}

              <div className="space-y-3 pt-3 border-t border-line text-xs">
                <div className="flex justify-between items-center py-1 border-b border-line/60">
                  <span className="text-ink-muted flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Cohort Start</span>
                  </span>
                  <span className="font-medium text-ink">
                    {new Date(course.startDate).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-line/60">
                  <span className="text-ink-muted flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Lecture Hours</span>
                  </span>
                  <span className="font-medium text-ink text-right max-w-[160px] truncate" title={course.schedule}>
                    {course.schedule}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-line/60">
                  <span className="text-ink-muted flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    <span>Class Size</span>
                  </span>
                  <span className="font-medium text-ink">Max {course.seatsTotal} students</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant={isFull || !course.isEnrollmentOpen ? 'secondary' : 'primary'}
                  size="lg"
                  disabled={isFull || !course.isEnrollmentOpen}
                  onClick={handleEnrollClick}
                  className="w-full"
                  rightIcon={ArrowRight}
                >
                  {isFull
                    ? 'Cohort Is Full'
                    : !course.isEnrollmentOpen
                    ? 'Admissions Closed'
                    : 'Enroll in Bootcamp'}
                </Button>

                <p className="text-[11px] text-center text-ink-muted mt-3">
                  Pay via JazzCash, Easypaisa, or direct bank transfer (IBFT).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Enrollment Bar (Mobile Viewport Only) */}
      {course && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-line px-4 py-3 sm:hidden shadow-lg flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-ink-muted font-mono uppercase block">Tuition</span>
            <span className="font-serif font-bold text-base text-ink">{formatPKR(course.fee)}</span>
          </div>
          <Button
            variant={isFull || !course.isEnrollmentOpen ? 'secondary' : 'primary'}
            size="sm"
            disabled={isFull || !course.isEnrollmentOpen}
            onClick={handleEnrollClick}
            rightIcon={ArrowRight}
          >
            {isFull ? 'Cohort Full' : !course.isEnrollmentOpen ? 'Closed' : 'Enroll Now'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CourseDetailPage;
