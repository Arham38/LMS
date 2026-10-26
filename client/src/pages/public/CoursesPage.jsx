import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, CreditCard, Users, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import courseService from '../../services/course.service';
import { Card, CardHeader, CardContent, CardFooter, Badge, Button, Skeleton } from '../../components/ui';
import { useDocumentMeta } from '../../utils/seo';

export const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useDocumentMeta({
    title: 'Available Software Bootcamps & Cohorts',
    description: 'Explore live software engineering cohorts in full-stack web development. Rigorous curriculum, live code reviews, and small cohort sizes.',
    canonicalPath: '/courses',
  });

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await courseService.getPublicCourses();
      setCourses(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Bootcamp Offerings — CodeCraft Academy';
    fetchCourses();
  }, []);

  const formatPKR = (amount) => {
    return `Rs. ${Number(amount).toLocaleString('en-PK')}`;
  };

  return (
    <div className="py-12 md:py-16 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Editorial Header */}
      <div className="mb-12 max-w-2xl">
        <div className="inline-flex items-center gap-2 mb-3">
          <Badge variant="primary" dot>
            Current & Upcoming Cohorts
          </Badge>
          <span className="text-xs text-ink-muted">Small groups capped at strict seat limits</span>
        </div>
        <h1 className="font-display font-semibold text-3xl md:text-4xl text-ink tracking-tight">
          Intensive live software bootcamps.
        </h1>
        <p className="text-sm text-ink-muted mt-2 leading-relaxed">
          Every program is delivered live by a senior engineer with weekly assignments, direct debugging, and personal code reviews. No pre-recorded video lectures.
        </p>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={`skeleton-${idx}`} className="h-[360px] flex flex-col justify-between p-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-12 w-full" />
              </div>
              <div className="space-y-2 pt-4 border-t border-line">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Error State with Retry */}
      {!loading && error && (
        <div className="p-8 bg-surface border border-line rounded-lg text-center max-w-md mx-auto my-8">
          <AlertCircle className="w-8 h-8 text-danger mx-auto mb-3 stroke-[1.5]" />
          <h3 className="font-display font-semibold text-base text-ink mb-1">Failed to load bootcamps</h3>
          <p className="text-xs text-ink-muted mb-4">{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchCourses} leftIcon={RefreshCw}>
            Retry Loading
          </Button>
        </div>
      )}

      {/* Courses Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const seatsLeft = course.seatsLeft ?? course.seatsTotal;
            const isFull = course.isFull || seatsLeft <= 0;

            return (
              <Card key={course._id} className="flex flex-col justify-between hover:border-line-strong transition-colors">
                <CardHeader
                  title={course.title}
                  subtitle={`${course.level} • ${course.durationWeeks} Weeks`}
                  action={
                    isFull ? (
                      <Badge variant="danger" dot>Cohort Full</Badge>
                    ) : seatsLeft <= 5 ? (
                      <Badge variant="accent" dot>{seatsLeft} seats left</Badge>
                    ) : (
                      <Badge variant="success" dot>{seatsLeft} seats open</Badge>
                    )
                  }
                />

                <CardContent className="space-y-4 flex-1">
                  <p className="text-xs text-ink-muted leading-relaxed line-clamp-3">
                    {course.tagline}
                  </p>

                  <div className="space-y-2 pt-2 text-xs border-t border-line/60">
                    <div className="flex items-center justify-between text-ink-muted">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Start Date</span>
                      </span>
                      <span className="font-medium text-ink">
                        {new Date(course.startDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-ink-muted">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Schedule</span>
                      </span>
                      <span className="font-medium text-ink truncate max-w-[180px]" title={course.schedule}>
                        {course.schedule}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-ink-muted">
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Tuition Fee</span>
                      </span>
                      <span className="font-display font-semibold text-sm text-ink tabular-nums">
                        {formatPKR(course.fee)}
                      </span>
                    </div>
                  </div>

                  {course.installmentsAllowed && (
                    <div className="text-[11px] font-mono text-primary bg-primary-soft/60 px-2 py-1 rounded">
                      Installments allowed
                    </div>
                  )}
                </CardContent>

                <CardFooter className="bg-surface-alt/30">
                  <span className="text-[11px] text-ink-muted font-mono">
                    Online via Meet/Zoom
                  </span>
                  <Link to={`/courses/${course.slug}`}>
                    <Button variant="primary" size="sm" rightIcon={ArrowRight}>
                      View Details & Syllabus
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
