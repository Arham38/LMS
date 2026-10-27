import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart3,
  Users,
  Video,
  Award,
  FileCheck2,
  Calendar,
  Sparkles,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Layers,
  ChevronRight,
} from 'lucide-react';
import analyticsService from '../../services/analytics.service';
import courseService from '../../services/course.service';
import { useDocumentMeta } from '../../utils/seo';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  Select,
  Skeleton,
  EmptyState,
  useToast,
} from '../../components/ui';

export const AdminAnalyticsPage = () => {
  useDocumentMeta({
    title: 'Cohort Telemetry & Academic Analytics — Instructor Admin',
    description: 'Detailed analytics on learner retention, live session attendance consistency, quiz scores, and assignment turnarounds.',
  });

  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(searchParams.get('course') || '');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, coursesRes] = await Promise.all([
        analyticsService.getAdminAnalytics({
          courseId: selectedCourse || undefined,
        }),
        courseService.getAdminCourses(),
      ]);

      setData(analyticsRes);
      const safeCourses = Array.isArray(coursesRes?.items)
        ? coursesRes.items
        : Array.isArray(coursesRes)
        ? coursesRes
        : [];
      setCourses(safeCourses);
    } catch (err) {
      toast.error('Failed to load cohort analytics.');
    } finally {
      setLoading(false);
    }
  }, [selectedCourse]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const telemetry = data?.telemetry || {};
  const courseComparison = data?.courseComparison || [];
  const sessionTrajectory = data?.sessionTrajectory || [];
  const gradeDistribution = data?.gradeDistribution || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cohort Telemetry & Academic Analytics"
        subtitle="Holistic performance diagnostics across live sessions, quiz mastery, and homework turnaround."
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              size="sm"
              className="w-48"
            >
              <option value="">All Cohorts Aggregated</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchAnalytics}
              disabled={loading}
              icon={RefreshCw}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* Primary Diagnostic Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-paper">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Learner Retention
            </p>
            <Users className="w-4 h-4 text-ink-muted" />
          </div>
          <p className="text-2xl font-bold font-mono text-ink mt-1">
            {loading ? <Skeleton className="h-7 w-20" /> : `${telemetry.activeRate || 100}%`}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            {telemetry.activeStudents || 0} active of {telemetry.totalStudents || 0} enrolled
          </p>
        </Card>

        <Card className="p-4 bg-paper">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Session Turnout
            </p>
            <Video className="w-4 h-4 text-ink-muted" />
          </div>
          <p className="text-2xl font-bold font-mono text-ink mt-1">
            {loading ? <Skeleton className="h-7 w-20" /> : `${telemetry.overallAttendancePercent || 100}%`}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            Average live lecture attendance
          </p>
        </Card>

        <Card className="p-4 bg-paper">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Quiz Average Score
            </p>
            <Award className="w-4 h-4 text-ink-muted" />
          </div>
          <p className="text-2xl font-bold font-mono text-ink mt-1">
            {loading ? <Skeleton className="h-7 w-20" /> : `${telemetry.avgQuizPercent || 0}%`}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            {telemetry.totalQuizAttempts || 0} total submissions
          </p>
        </Card>

        <Card className="p-4 bg-paper">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              On-Time Homework
            </p>
            <FileCheck2 className="w-4 h-4 text-ink-muted" />
          </div>
          <p className="text-2xl font-bold font-mono text-ink mt-1">
            {loading ? <Skeleton className="h-7 w-20" /> : `${telemetry.onTimeRate || 100}%`}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            {telemetry.totalSubmissions || 0} solutions received
          </p>
        </Card>
      </div>

      {/* Cohort Comparison Matrix */}
      <Card>
        <CardHeader className="p-4 pb-2 border-b border-line">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink">
                Bootcamp Cohort Performance Matrix
              </h3>
              <p className="text-xs text-ink-muted">
                Side-by-side comparison of active cohorts across key learning milestones
              </p>
            </div>
            <TrendingUp className="w-4 h-4 text-ink-muted" />
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface border-b border-line font-mono text-ink-muted uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-4 font-medium">Cohort Title</th>
                <th className="py-2.5 px-4 font-medium">Duration</th>
                <th className="py-2.5 px-4 font-medium">Enrolled</th>
                <th className="py-2.5 px-4 font-medium">Attendance Rate</th>
                <th className="py-2.5 px-4 font-medium">Avg Quiz</th>
                <th className="py-2.5 px-4 font-medium">Homework Submissions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="py-3 px-4">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : courseComparison.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-ink-muted">
                    No active cohorts found.
                  </td>
                </tr>
              ) : (
                courseComparison.map((c) => (
                  <tr key={c.courseId} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-ink">
                      {c.title}
                    </td>
                    <td className="py-3 px-4 font-mono text-ink-muted">
                      {c.durationWeeks} weeks ({c.level})
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="font-semibold text-ink">{c.enrolledCount}</span>
                      <span className="text-ink-muted"> / {c.seatsTotal}</span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-surface-alt h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${Math.min(100, c.attendanceRate)}%` }}
                          />
                        </div>
                        <span className="font-semibold text-ink">{c.attendanceRate}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="font-semibold text-ink">{c.quizAvgPercent}%</span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="font-semibold text-ink">{c.submissionsCount}</span>
                      <span className="text-ink-muted"> across {c.assignmentsCount} tasks</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Two Column Layout: Session Attendance Trajectory + Grade Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Session Attendance Trajectory (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2 border-b border-line">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    Lecture Turnout Trajectory
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Attendance rate over recent live lecture sessions
                  </p>
                </div>
                <Video className="w-4 h-4 text-ink-muted" />
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {loading ? (
                <Skeleton className="h-48 w-full" />
              ) : sessionTrajectory.length === 0 ? (
                <div className="py-12 text-center text-xs text-ink-muted">
                  No completed sessions available for trajectory plotting.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Clean SVG Bar Chart */}
                  <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-line">
                    {sessionTrajectory.map((item, idx) => {
                      const heightPercent = Math.max(8, item.rate);
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                          {/* Tooltip on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 px-2 py-1 bg-ink text-paper text-[10px] font-mono rounded pointer-events-none whitespace-nowrap z-10 shadow-lg">
                            <p className="font-bold">{item.title}</p>
                            <p className="text-[9px] text-paper/80">
                              {item.rate}% ({item.attended}/{item.total} students)
                            </p>
                          </div>

                          {/* Bar */}
                          <div className="w-full bg-surface-alt rounded-t overflow-hidden flex items-end h-32">
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className="w-full bg-primary rounded-t transition-all duration-300 group-hover:bg-primary-hover"
                            />
                          </div>

                          {/* Label */}
                          <span className="text-[10px] font-mono text-ink-muted truncate w-full text-center">
                            W{item.week || idx + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-xs text-ink-muted">
                    <span>Overall Cohort Average Turnout</span>
                    <strong className="font-mono text-ink font-semibold">
                      {telemetry.overallAttendancePercent || 100}%
                    </strong>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Grade & Mastery Distribution (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2 border-b border-line">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    Assessment Mastery Distribution
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Student performance breakdown across all submitted quiz assessments
                  </p>
                </div>
                <Award className="w-4 h-4 text-ink-muted" />
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {loading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="space-y-4">
                  {gradeDistribution.map((tier) => {
                    const totalAttempts = telemetry.totalQuizAttempts || 1;
                    const percent = Math.round((tier.count / totalAttempts) * 100);

                    return (
                      <div key={tier.key} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-ink">{tier.label}</span>
                          <span className="font-mono text-ink-muted">
                            <strong className="text-ink">{tier.count}</strong> attempts ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-surface-alt h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              tier.key === '85'
                                ? 'bg-emerald-600'
                                : tier.key === '70'
                                ? 'bg-primary'
                                : tier.key === '50'
                                ? 'bg-amber-600'
                                : 'bg-red-600'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  <div className="p-3 bg-surface rounded border border-line text-xs text-ink-muted">
                    <p className="font-medium text-ink">Evaluation Criteria</p>
                    <p className="mt-0.5">
                      Passing baseline is 70%. Learners achieving 85%+ qualify for distinction endorsements on their graduation certificates.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
