import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Video,
  Clock,
  Calendar,
  FileCheck2,
  HelpCircle,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Award,
} from 'lucide-react';
import dashboardService from '../../services/dashboard.service';
import sessionService from '../../services/session.service';
import { useAuth } from '../../context/AuthContext';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  ProgressBar,
  EmptyState,
  Skeleton,
  useToast,
} from '../../components/ui';

export const StudentDashboardPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [joiningSession, setJoiningSession] = useState(false);

  // Live countdown state
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await dashboardService.getStudentDashboard();
      setData(res);
    } catch (err) {
      toast.error('Failed to load student dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleJoinClass = async (sessionId) => {
    setJoiningSession(true);
    try {
      const res = await sessionService.joinSessionStudent(sessionId);
      if (res?.meetingLink) {
        toast.success('Attendance recorded! Opening live classroom...');
        window.open(res.meetingLink, '_blank');
      } else {
        toast.error('Meeting link unavailable.');
      }
    } catch (err) {
      toast.error(err.message || 'Unable to join session.');
    } finally {
      setJoiningSession(false);
    }
  };

  const formatPKTDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('en-PK', {
        timeZone: 'Asia/Karachi',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return String(dateStr);
    }
  };

  const getCountdownString = (dueAt) => {
    if (!dueAt) return 'No due date';
    const diff = new Date(dueAt).getTime() - now.getTime();
    if (diff <= 0) return 'Deadline passed';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `Due in ${days}d ${hours}h`;
    if (hours > 0) return `Due in ${hours}h ${mins}m`;
    return `Due in ${mins}m`;
  };

  const enrolledCourses = data?.enrolledCourses || [];
  const nextSession = data?.nextSession;
  const upcomingDeadlines = data?.upcomingDeadlines || [];
  const latestGrades = data?.latestGrades || [];
  const latestAnnouncements = data?.latestAnnouncements || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'Engineer'}`}
        subtitle="Track your enrolled masterclass cohorts, live schedules, and homework submissions."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboard}
            disabled={loading}
            icon={RefreshCw}
          >
            Refresh
          </Button>
        }
      />

      {/* Hero: Next Class Card */}
      {nextSession ? (
        <Card className="border-primary/40 bg-gradient-to-r from-surface to-paper overflow-hidden">
          <CardContent className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={nextSession.canJoinNow ? 'danger' : 'primary'} dot className="text-xs font-mono">
                  {nextSession.canJoinNow ? 'CLASS IS LIVE' : 'UPCOMING CLASS'}
                </Badge>
                <span className="text-xs text-ink-muted">•</span>
                <span className="text-xs font-semibold text-primary">{nextSession.course?.title}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-ink">
                {nextSession.title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted">
                <span className="flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatPKTDateTime(nextSession.scheduledAt)} PKT
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {nextSession.durationMinutes} Minutes
                </span>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => handleJoinClass(nextSession._id)}
                disabled={!nextSession.canJoinNow}
                loading={joiningSession}
                icon={Video}
                className={nextSession.canJoinNow ? 'animate-pulse' : ''}
              >
                {nextSession.canJoinNow ? 'Join Live Lecture' : 'Join Window Opens 15m Before'}
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => navigate(`/student/courses/${nextSession.course?._id}`)}
              >
                Course Space
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : enrolledCourses.length > 0 ? (
        <Card className="p-5 bg-surface/50 border-line">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-surface border border-line rounded-full text-ink-muted">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">No Live Sessions Scheduled Right Now</h3>
                <p className="text-xs text-ink-muted">Check back later or view your course space for upcoming batches.</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/student/schedule')}>
              View Full Schedule
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Main Grid: Enrolled Courses + Deadlines & Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Enrolled Courses & Progress (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink">
                Your Enrolled Bootcamps
              </h3>
              <Link to="/student/courses" className="text-xs text-primary hover:underline font-semibold">
                All Courses &rarr;
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            ) : enrolledCourses.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={BookOpen}
                    title="You are not enrolled in any bootcamps"
                    description="Explore available live online cohorts and submit your enrollment request."
                    action={
                      <Button variant="primary" size="sm" onClick={() => navigate('/courses')}>
                        Browse Cohorts
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {enrolledCourses.map((c) => (
                  <Card key={c._id} className="hover:border-ink/20 transition-all">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-base font-bold text-ink">
                            {c.title}
                          </h4>
                          <p className="text-xs text-ink-muted mt-0.5">
                            {c.schedule}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/student/courses/${c._id}`)}
                          className="shrink-0 text-xs"
                        >
                          Classroom Space &rarr;
                        </Button>
                      </div>

                      {/* Telemetry Progress Bars */}
                      <div className="space-y-2 pt-2 border-t border-line/60">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-ink-muted font-medium">Class Attendance</span>
                          <span className="font-mono font-bold text-ink">
                            {c.attendancePercent}% ({c.attendedCount}/{c.completedSessions} sessions)
                          </span>
                        </div>
                        <ProgressBar value={c.attendancePercent} />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
                        <div className="p-2.5 bg-surface rounded border border-line flex items-center justify-between">
                          <span className="text-ink-muted font-sans">Quizzes Done:</span>
                          <span className="font-bold text-ink">{c.quizzesDone} / {c.totalQuizzes}</span>
                        </div>
                        <div className="p-2.5 bg-surface rounded border border-line flex items-center justify-between">
                          <span className="text-ink-muted font-sans">Assignments:</span>
                          <span className="font-bold text-ink">{c.assignmentsDone} / {c.totalAssignments}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Latest Grades Snippet */}
          {latestGrades.length > 0 && (
            <Card>
              <CardHeader className="p-4 pb-2 border-b border-line flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">
                    Latest Grades & Feedback
                  </h3>
                </div>
              </CardHeader>
              <CardContent className="p-4 divide-y divide-line">
                {latestGrades.map((g, idx) => (
                  <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-semibold text-ink">{g.title}</p>
                      <p className="text-[11px] text-ink-muted">{g.courseTitle}</p>
                      {g.feedback && (
                        <p className="text-[11px] text-ink italic mt-0.5">"{g.feedback}"</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-sm font-bold text-success">
                        {g.score} / {g.maxMarks}
                      </span>
                      {g.percent !== undefined && (
                        <span className="block text-[10px] font-mono text-ink-muted">
                          {g.percent}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Deadlines & Announcements (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader className="p-4 pb-2 border-b border-line">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-warning" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">
                  Upcoming Deadlines
                </h3>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {upcomingDeadlines.length === 0 ? (
                <div className="py-6 text-center text-xs text-ink-muted">
                  No pending homework or quiz deadlines!
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {upcomingDeadlines.map((d) => (
                    <div key={d._id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Badge variant={d.type === 'quiz' ? 'warning' : 'default'} className="text-[10px]">
                            {d.type.toUpperCase()}
                          </Badge>
                          <span className="font-semibold text-ink truncate">{d.title}</span>
                        </div>
                        <span className="font-mono text-[11px] text-primary block mt-0.5">
                          {getCountdownString(d.dueAt)}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(d.link)}
                        className="text-xs shrink-0"
                      >
                        Open
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Latest Announcements Feed */}
          <Card>
            <CardHeader className="p-4 pb-2 border-b border-line flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">
                  Cohort Notices
                </h3>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {latestAnnouncements.length === 0 ? (
                <div className="py-6 text-center text-xs text-ink-muted">
                  No announcements posted yet.
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {latestAnnouncements.map((ann) => (
                    <div key={ann._id} className="py-3 first:pt-0 last:pb-0 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {ann.pinned && (
                            <Badge variant="primary" className="text-[10px]">PINNED</Badge>
                          )}
                          <h4 className="font-bold text-ink">{ann.title}</h4>
                        </div>
                        <span className="text-[10px] font-mono text-ink-muted shrink-0">
                          {formatPKTDateTime(ann.createdAt)}
                        </span>
                      </div>
                      <p className="text-ink-muted line-clamp-3 leading-relaxed">
                        {ann.body}
                      </p>
                      <p className="text-[10px] text-ink-muted font-mono">
                        {ann.course?.title} • {ann.createdBy?.name || 'Instructor'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardPage;
