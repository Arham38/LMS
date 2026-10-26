import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Calendar,
  BarChart2,
  ArrowRight,
  Video,
  BookOpen,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  CheckSquare,
} from 'lucide-react';
import dashboardService from '../../services/dashboard.service';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  EmptyState,
  Skeleton,
  useToast,
} from '../../components/ui';

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeAttentionTab, setActiveAttentionTab] = useState('payments'); // 'payments' | 'submissions' | 'today_sessions'

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await dashboardService.getAdminStats();
      setData(res);
    } catch (err) {
      toast.error('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatPKR = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatPKTTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleTimeString('en-PK', {
        timeZone: 'Asia/Karachi',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return String(dateStr);
    }
  };

  const stats = data?.stats || {};
  const needsAttention = data?.needsAttention || {};
  const attendanceTrend = data?.attendanceTrend || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Overview"
        subtitle="Real-time cohort telemetry, revenue ledger, and operational action queue."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              disabled={loading}
              icon={RefreshCw}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/admin/courses/new')}
              icon={Plus}
            >
              New Course
            </Button>
          </div>
        }
      />

      {/* Primary Telemetry Stat Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <Card className="p-4 bg-paper">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Total Revenue
          </p>
          <p className="text-xl font-bold font-mono text-ink mt-1">
            {loading ? <Skeleton className="h-6 w-24" /> : formatPKR(stats.totalRevenueCollected)}
          </p>
          <p className="text-[10px] text-ink-muted mt-1">
            {stats.approvedEnrollments || 0} paid seats
          </p>
        </Card>

        <Card className="p-4 bg-paper">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Active Students
          </p>
          <p className="text-xl font-bold font-mono text-ink mt-1">
            {loading ? <Skeleton className="h-6 w-16" /> : stats.activeStudents}
          </p>
          <p className="text-[10px] text-ink-muted mt-1">
            of {stats.totalStudents || 0} registered
          </p>
        </Card>

        <Card className={`p-4 bg-paper ${stats.pendingEnrollments > 0 ? 'border-warning/50' : ''}`}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Pending Payments
          </p>
          <p className={`text-xl font-bold font-mono mt-1 ${stats.pendingEnrollments > 0 ? 'text-warning' : 'text-ink'}`}>
            {loading ? <Skeleton className="h-6 w-12" /> : stats.pendingEnrollments}
          </p>
          <p className="text-[10px] text-ink-muted mt-1">
            Needs verification
          </p>
        </Card>

        <Card className={`p-4 bg-paper ${stats.submissionsWaitingGrading > 0 ? 'border-primary/40' : ''}`}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            To Grade
          </p>
          <p className={`text-xl font-bold font-mono mt-1 ${stats.submissionsWaitingGrading > 0 ? 'text-primary' : 'text-ink'}`}>
            {loading ? <Skeleton className="h-6 w-12" /> : stats.submissionsWaitingGrading}
          </p>
          <p className="text-[10px] text-ink-muted mt-1">
            Ungraded homework
          </p>
        </Card>

        <Card className="p-4 bg-paper">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Avg Attendance
          </p>
          <p className="text-xl font-bold font-mono text-ink mt-1">
            {loading ? <Skeleton className="h-6 w-16" /> : `${stats.averageAttendancePercent || 100}%`}
          </p>
          <p className="text-[10px] text-ink-muted mt-1">
            Cohort average
          </p>
        </Card>

        <Card className="p-4 bg-paper">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Avg Quiz Score
          </p>
          <p className="text-xl font-bold font-mono text-ink mt-1">
            {loading ? <Skeleton className="h-6 w-16" /> : `${stats.averageQuizPercent || 0}%`}
          </p>
          <p className="text-[10px] text-ink-muted mt-1">
            Passing baseline
          </p>
        </Card>
      </div>

      {/* Main Two-Column Layout: Action Queue + Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Needs Attention Queue (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader className="p-4 pb-3 border-b border-line">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-ink">
                    Action Queue (Needs Attention)
                  </h3>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-surface p-1 rounded border border-line text-xs">
                  <button
                    onClick={() => setActiveAttentionTab('payments')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      activeAttentionTab === 'payments'
                        ? 'bg-paper text-ink font-semibold shadow-xs'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    Payments ({needsAttention.pendingEnrollments?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveAttentionTab('submissions')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      activeAttentionTab === 'submissions'
                        ? 'bg-paper text-ink font-semibold shadow-xs'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    Grading ({needsAttention.ungradedSubmissions?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveAttentionTab('today_sessions')}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      activeAttentionTab === 'today_sessions'
                        ? 'bg-paper text-ink font-semibold shadow-xs'
                        : 'text-ink-muted hover:text-ink'
                    }`}
                  >
                    Today's Classes ({needsAttention.todaySessions?.length || 0})
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : activeAttentionTab === 'payments' ? (
                /* Pending Payments */
                !needsAttention.pendingEnrollments || needsAttention.pendingEnrollments.length === 0 ? (
                  <div className="py-8 text-center text-xs text-ink-muted">
                    No pending tuition payments awaiting review.
                  </div>
                ) : (
                  <div className="divide-y divide-line">
                    {needsAttention.pendingEnrollments.map((enr) => (
                      <div key={enr._id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink truncate">
                            {enr.student?.name}
                          </p>
                          <p className="text-[11px] text-ink-muted">
                            {enr.course?.title} • <span className="font-mono font-medium text-ink">{formatPKR(enr.amountDue)}</span> via{' '}
                            <span className="uppercase font-semibold">{enr.paymentMethod}</span>
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/admin/enrollments')}
                          className="text-xs shrink-0"
                        >
                          Review Payment &rarr;
                        </Button>
                      </div>
                    ))}
                  </div>
                )
              ) : activeAttentionTab === 'submissions' ? (
                /* Ungraded Submissions */
                !needsAttention.ungradedSubmissions || needsAttention.ungradedSubmissions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-ink-muted">
                    All homework submissions are graded and up to date!
                  </div>
                ) : (
                  <div className="divide-y divide-line">
                    {needsAttention.ungradedSubmissions.map((sub) => (
                      <div key={sub._id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-ink truncate">
                              {sub.student?.name}
                            </p>
                            {sub.status === 'late' && (
                              <Badge variant="warning" className="text-[10px]">LATE</Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-ink-muted">
                            Week {sub.assignment?.week}: {sub.assignment?.title}
                          </p>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => navigate(`/admin/assignments/${sub.assignment?._id}/grade`)}
                          icon={CheckSquare}
                          className="text-xs shrink-0"
                        >
                          Grade Solution
                        </Button>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* Today's Live Sessions */
                !needsAttention.todaySessions || needsAttention.todaySessions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-ink-muted">
                    No live sessions scheduled for today.
                  </div>
                ) : (
                  <div className="divide-y divide-line">
                    {needsAttention.todaySessions.map((sess) => (
                      <div key={sess._id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-ink">
                              {formatPKTTime(sess.scheduledAt)} PKT
                            </span>
                            <Badge variant={sess.status === 'live' ? 'danger' : 'default'} className="text-[10px]">
                              {sess.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-xs font-semibold text-ink truncate mt-0.5">
                            {sess.title}
                          </p>
                          <p className="text-[11px] text-ink-muted">
                            {sess.course?.title}
                          </p>
                        </div>
                        {sess.meetingLink && (
                          <a
                            href={sess.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-ink bg-surface border border-line rounded hover:bg-surface-hover shrink-0"
                          >
                            <Video className="w-3.5 h-3.5 text-primary" />
                            Open Meet
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {/* Quick Management Shortcuts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              to="/admin/courses"
              className="p-3.5 bg-paper border border-line rounded-md hover:border-ink/30 transition-all text-left group"
            >
              <BookOpen className="w-4 h-4 text-primary mb-1.5" />
              <p className="text-xs font-semibold text-ink group-hover:text-primary transition-colors">
                Courses & Cohorts
              </p>
              <p className="text-[10px] text-ink-muted">Manage curriculum</p>
            </Link>

            <Link
              to="/admin/sessions"
              className="p-3.5 bg-paper border border-line rounded-md hover:border-ink/30 transition-all text-left group"
            >
              <Video className="w-4 h-4 text-primary mb-1.5" />
              <p className="text-xs font-semibold text-ink group-hover:text-primary transition-colors">
                Live Sessions
              </p>
              <p className="text-[10px] text-ink-muted">Schedule & attendance</p>
            </Link>

            <Link
              to="/admin/assignments"
              className="p-3.5 bg-paper border border-line rounded-md hover:border-ink/30 transition-all text-left group"
            >
              <FileCheck2 className="w-4 h-4 text-primary mb-1.5" />
              <p className="text-xs font-semibold text-ink group-hover:text-primary transition-colors">
                Assignments
              </p>
              <p className="text-[10px] text-ink-muted">Rubrics & grading</p>
            </Link>

            <Link
              to="/admin/students"
              className="p-3.5 bg-paper border border-line rounded-md hover:border-ink/30 transition-all text-left group"
            >
              <Users className="w-4 h-4 text-primary mb-1.5" />
              <p className="text-xs font-semibold text-ink group-hover:text-primary transition-colors">
                Student Roster
              </p>
              <p className="text-[10px] text-ink-muted">Profiles & notes</p>
            </Link>
          </div>
        </div>

        {/* Right: Attendance Trend Chart & Activity (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Restrained Attendance Bar Chart */}
          <Card>
            <CardHeader className="p-4 pb-2 border-b border-line">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-ink">
                    Cohort Attendance Trend
                  </h3>
                  <p className="text-xs text-ink-muted">
                    Attendance rate across last 6 completed lectures
                  </p>
                </div>
                <BarChart2 className="w-4 h-4 text-ink-muted" />
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {loading ? (
                <Skeleton className="h-44 w-full" />
              ) : attendanceTrend.length === 0 ? (
                <div className="py-12 text-center text-xs text-ink-muted">
                  No completed sessions yet to display trend.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Clean SVG Bar Chart */}
                  <div className="h-40 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-line">
                    {attendanceTrend.map((item, idx) => {
                      const heightPercent = Math.max(8, item.rate);
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                          {/* Tooltip on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-1 bg-ink text-paper text-[10px] font-mono rounded pointer-events-none whitespace-nowrap z-10">
                            {item.rate}% ({item.attended}/{item.total})
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
                            L{idx + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-xs text-ink-muted">
                    <span>Average Cohort Turnout</span>
                    <strong className="font-mono text-ink font-semibold">
                      {stats.averageAttendancePercent || 100}%
                    </strong>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Links Card */}
          <Card className="p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Quick Operations
            </h4>
            <div className="space-y-2">
              <Link
                to="/admin/announcements"
                className="flex items-center justify-between p-2.5 bg-surface hover:bg-surface-hover rounded border border-line text-xs font-medium text-ink transition-colors"
              >
                <span>Broadcast Cohort Announcement</span>
                <ChevronRight className="w-4 h-4 text-ink-muted" />
              </Link>
              <Link
                to="/admin/gradebook"
                className="flex items-center justify-between p-2.5 bg-surface hover:bg-surface-hover rounded border border-line text-xs font-medium text-ink transition-colors"
              >
                <span>View Full Cohort Gradebook</span>
                <ChevronRight className="w-4 h-4 text-ink-muted" />
              </Link>
              <Link
                to="/admin/settings"
                className="flex items-center justify-between p-2.5 bg-surface hover:bg-surface-hover rounded border border-line text-xs font-medium text-ink transition-colors"
              >
                <span>Payment Accounts (JazzCash, IBFT)</span>
                <ChevronRight className="w-4 h-4 text-ink-muted" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
