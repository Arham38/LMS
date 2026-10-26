import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Video,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileCheck2,
  Bell,
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Lock,
  Play,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import enrollmentService from '../../services/enrollment.service';
import sessionService from '../../services/session.service';
import storageService from '../../services/storage.service';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  ProgressBar,
  Spinner,
  EmptyState,
  Skeleton,
  useToast,
} from '../../components/ui';

export const StudentCourseSpacePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('sessions');
  const [viewMode, setViewMode] = useState('roadmap'); // 'roadmap' | 'calendar'

  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [attendanceData, setAttendanceData] = useState({
    attended: 0,
    totalCompleted: 0,
    percentage: 100,
    totalCourseSessions: 0,
  });

  const [loading, setLoading] = useState(true);
  const [joiningSessionId, setJoiningSessionId] = useState(null);
  const [downloadingKey, setDownloadingKey] = useState(null);

  // Live countdown state
  const [now, setNow] = useState(new Date());

  // Month Calendar Navigation State
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Update clock every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [enrollments, sessionsRes, attendanceRes] = await Promise.all([
        enrollmentService.getMyEnrollments(),
        sessionService.getCourseSessionsStudent(courseId),
        sessionService.getMyCourseAttendanceStudent(courseId),
      ]);

      // Verify student has an approved enrollment for this course
      const matchedEnrollment = enrollments.find(
        (e) => (e.course?._id === courseId || e.course === courseId) && e.status === 'approved'
      );

      if (!matchedEnrollment) {
        toast.error('You do not have an approved tuition enrollment for this course.');
        navigate('/student/courses');
        return;
      }

      setCourse(matchedEnrollment.course);
      document.title = `${matchedEnrollment.course?.title || 'Course Space'} — CodeCraft Academy`;

      setSessions(sessionsRes.items || []);
      if (attendanceRes) {
        setAttendanceData(attendanceRes);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load live sessions and course data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [courseId]);

  // Find the Next Active/Upcoming Session
  const activeOrUpcomingSessions = sessions.filter((s) => {
    if (s.status === 'cancelled') return false;
    const endTime = new Date(s.scheduledAt).getTime() + (s.durationMinutes + 30) * 60 * 1000;
    return endTime > now.getTime();
  });
  const nextSession = activeOrUpcomingSessions[0] || null;

  // Handle Join Action
  const handleJoinSession = async (session) => {
    setJoiningSessionId(session._id);
    try {
      const res = await sessionService.joinSessionStudent(session._id);
      if (res.meetingLink) {
        window.open(res.meetingLink, '_blank', 'noopener,noreferrer');
        toast.success(`Welcome to class! Attendance marked as ${res.attendanceStatus || 'present'}.`);
        // Refresh session list to update attendance marker
        const updated = await sessionService.getCourseSessionsStudent(courseId);
        setSessions(updated.items || []);
        const attUpdated = await sessionService.getMyCourseAttendanceStudent(courseId);
        setAttendanceData(attUpdated);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to join live class.');
    } finally {
      setJoiningSessionId(null);
    }
  };

  // Handle Note PDF Download
  const handleDownloadNote = async (resource) => {
    setDownloadingKey(resource.fileKey);
    try {
      const res = await storageService.getFileUrl(resource.fileKey);
      if (res.downloadUrl) {
        window.open(res.downloadUrl, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('Unable to generate download link.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to authorize lecture note download.');
    } finally {
      setDownloadingKey(null);
    }
  };

  // Format PKT Date/Time
  const formatPKTDateTime = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleString('en-PK', {
        timeZone: 'Asia/Karachi',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  // Compute countdown to scheduledAt
  const getCountdownText = (scheduledAt) => {
    const diff = new Date(scheduledAt).getTime() - now.getTime();
    if (diff <= 0) return 'Class starting or live now';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    return parts.join(' ');
  };

  // Group by Week
  const groupedByWeek = sessions.reduce((acc, sess) => {
    const w = sess.week || 1;
    if (!acc[w]) acc[w] = [];
    acc[w].push(sess);
    return acc;
  }, {});

  // Month Calendar Helpers
  const currentMonthYearStr = calendarDate.toLocaleString('en-PK', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Karachi',
  });

  const getCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const daySessions = sessions.filter((s) => {
        try {
          const sDate = new Date(s.scheduledAt).toISOString().slice(0, 10);
          return sDate === dateStr;
        } catch {
          return false;
        }
      });
      days.push({ day: d, dateStr, sessions: daySessions });
    }
    return days;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course Space Header & Attendance Meter */}
      <div className="p-6 bg-surface border border-line rounded space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link
                to="/student/courses"
                className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
              >
                <span>&larr; All Bootcamps</span>
              </Link>
              <span className="text-ink-muted text-xs">&bull;</span>
              <Badge variant="success" dot>
                Enrolled Student
              </Badge>
            </div>
            <h1 className="font-display font-semibold text-2xl text-ink">
              {course?.title || 'Bootcamp Classroom'}
            </h1>
            <p className="text-xs text-ink-muted leading-relaxed">
              {course?.tagline || 'Live interactive masterclass series with instructor feedback.'}
            </p>
          </div>

          {/* Student Attendance Meter */}
          <div className="p-4 bg-surface-alt rounded border border-line md:w-72 shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Cohort Attendance
              </span>
              <span className="font-display font-semibold text-base text-ink tabular-nums">
                {attendanceData.percentage}%
              </span>
            </div>

            <ProgressBar value={attendanceData.percentage} />

            <div className="flex items-center justify-between text-[11px] text-ink-muted">
              <span>Attended:</span>
              <span className="font-medium text-ink">
                {attendanceData.attended} of {attendanceData.totalCompleted} completed classes
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="pt-2 flex items-center gap-1 border-t border-line overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 font-medium border-b-2 -mb-[1px] transition-colors flex items-center gap-2 ${
              activeTab === 'sessions'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Live Sessions & Notes</span>
            <span className="text-[10px] bg-primary-soft text-primary px-1.5 py-0.2 rounded font-mono">
              {sessions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quizzes')}
            className={`px-4 py-2 font-medium border-b-2 -mb-[1px] transition-colors flex items-center gap-2 ${
              activeTab === 'quizzes'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Quizzes</span>
            <span className="text-[10px] text-ink-muted bg-surface-alt px-1.5 py-0.2 rounded">
              Phase 4
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2 font-medium border-b-2 -mb-[1px] transition-colors flex items-center gap-2 ${
              activeTab === 'assignments'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Assignments</span>
            <span className="text-[10px] text-ink-muted bg-surface-alt px-1.5 py-0.2 rounded">
              Phase 5
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2 font-medium border-b-2 -mb-[1px] transition-colors flex items-center gap-2 ${
              activeTab === 'announcements'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Announcements</span>
            <span className="text-[10px] text-ink-muted bg-surface-alt px-1.5 py-0.2 rounded">
              Phase 6
            </span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT: SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          {/* NEXT CLASS CARD WITH COUNTDOWN */}
          {nextSession && (
            <Card className="border-2 border-primary/40 bg-surface shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-primary bg-primary-soft px-2 py-0.5 rounded">
                        Next Live Lecture
                      </span>
                      {nextSession.canJoinNow ? (
                        <Badge variant="danger" dot>
                          Join Window Open
                        </Badge>
                      ) : (
                        <Badge variant="primary" dot>
                          Upcoming
                        </Badge>
                      )}
                    </div>

                    <h2 className="font-display font-semibold text-xl text-ink">
                      {nextSession.title}
                    </h2>

                    {nextSession.description && (
                      <p className="text-xs text-ink-muted leading-relaxed max-w-xl">
                        {nextSession.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted pt-1">
                      <span className="flex items-center gap-1.5 font-medium text-ink">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{formatPKTDateTime(nextSession.scheduledAt)} PKT</span>
                      </span>
                      <span>&bull;</span>
                      <span>Duration: {nextSession.durationMinutes} minutes</span>
                    </div>
                  </div>

                  {/* Countdown & Join CTA */}
                  <div className="p-4 bg-surface-alt rounded border border-line text-center md:min-w-[260px] space-y-3">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-ink-muted tracking-wider block">
                        Countdown to Class
                      </span>
                      <span className="font-mono font-bold text-lg text-ink">
                        {getCountdownText(nextSession.scheduledAt)}
                      </span>
                    </div>

                    {nextSession.canJoinNow ? (
                      <Button
                        variant="primary"
                        size="md"
                        className="w-full"
                        leftIcon={Play}
                        isLoading={joiningSessionId === nextSession._id}
                        onClick={() => handleJoinSession(nextSession)}
                      >
                        Join Live Class
                      </Button>
                    ) : (
                      <div className="space-y-1">
                        <Button
                          variant="secondary"
                          size="md"
                          className="w-full opacity-60 cursor-not-allowed"
                          leftIcon={Lock}
                          disabled
                        >
                          Join Locked
                        </Button>
                        <p className="text-[10px] text-ink-muted leading-tight">
                          Join link activates 15 minutes before scheduled start time.
                        </p>
                      </div>
                    )}

                    <span className="text-[10px] text-ink-muted block">
                      Attendance automatically recorded upon entry.
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* VIEW SWITCHER BAR */}
          <div className="flex items-center justify-between pb-1">
            <span className="font-display font-semibold text-sm text-ink uppercase tracking-wider">
              Course Syllabus & Lectures
            </span>

            <div className="flex items-center p-0.5 bg-surface-alt rounded border border-line text-xs font-medium">
              <button
                type="button"
                onClick={() => setViewMode('roadmap')}
                className={`px-3 py-1 rounded transition-colors ${
                  viewMode === 'roadmap'
                    ? 'bg-surface text-ink font-semibold shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Week by Week
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1 rounded transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-surface text-ink font-semibold shadow-xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Month Calendar
              </button>
            </div>
          </div>

          {/* ROADMAP VIEW */}
          {viewMode === 'roadmap' && (
            <div className="space-y-6">
              {Object.keys(groupedByWeek).length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="No sessions scheduled yet"
                  description="Your instructor is currently preparing the curriculum schedule for this cohort."
                />
              ) : (
                Object.entries(groupedByWeek).map(([weekNum, weekSessions]) => (
                  <div key={weekNum} className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b border-line">
                      <Layers className="w-4 h-4 text-primary" />
                      <h3 className="font-display font-semibold text-sm text-ink uppercase tracking-wider">
                        Week {weekNum}
                      </h3>
                    </div>

                    <div className="grid gap-3">
                      {weekSessions.map((session) => {
                        const isAttended =
                          session.myAttendance?.status === 'present' ||
                          session.myAttendance?.status === 'late';
                        const isPast =
                          new Date(session.scheduledAt).getTime() +
                            (session.durationMinutes + 30) * 60 * 1000 <
                          now.getTime();

                        return (
                          <Card
                            key={session._id}
                            className={`border transition-all ${
                              session.canJoinNow
                                ? 'border-primary ring-1 ring-primary bg-primary-soft/10'
                                : 'border-line hover:border-line-strong'
                            }`}
                          >
                            <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-2 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[11px] font-mono text-ink-muted font-semibold bg-surface-alt px-2 py-0.5 rounded">
                                    Class {session.order}
                                  </span>

                                  {/* Session status badge */}
                                  {session.status === 'live' ? (
                                    <Badge variant="danger" dot>
                                      Live Now
                                    </Badge>
                                  ) : session.status === 'completed' ? (
                                    <Badge variant="neutral">Completed</Badge>
                                  ) : session.status === 'cancelled' ? (
                                    <Badge variant="neutral">Cancelled</Badge>
                                  ) : (
                                    <Badge variant="primary" dot>
                                      Upcoming
                                    </Badge>
                                  )}

                                  {/* Student Attendance Mark */}
                                  {session.myAttendance?.status === 'present' ? (
                                    <Badge variant="success">
                                      Attended (Present)
                                    </Badge>
                                  ) : session.myAttendance?.status === 'late' ? (
                                    <Badge variant="warning">
                                      Attended (Late)
                                    </Badge>
                                  ) : isPast && session.status !== 'cancelled' ? (
                                    <Badge variant="danger">
                                      Absent
                                    </Badge>
                                  ) : null}
                                </div>

                                <h4 className="font-display font-semibold text-base text-ink">
                                  {session.title}
                                </h4>

                                {session.description && (
                                  <p className="text-xs text-ink-muted leading-relaxed">
                                    {session.description}
                                  </p>
                                )}

                                <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted pt-1">
                                  <span className="flex items-center gap-1.5 font-medium text-ink">
                                    <Clock className="w-3.5 h-3.5 text-primary" />
                                    <span>{formatPKTDateTime(session.scheduledAt)} PKT</span>
                                  </span>
                                  <span>&bull;</span>
                                  <span>{session.durationMinutes} minutes</span>
                                </div>

                                {/* Lecture Notes / Downloads */}
                                {session.resources && session.resources.length > 0 && (
                                  <div className="pt-2 flex flex-wrap items-center gap-2">
                                    {session.resources.map((res, rIdx) => (
                                      <button
                                        key={rIdx}
                                        type="button"
                                        onClick={() => handleDownloadNote(res)}
                                        disabled={downloadingKey === res.fileKey}
                                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary-soft/50 hover:bg-primary-soft border border-primary/20 px-2.5 py-1 rounded transition-colors"
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>{res.title}</span>
                                        <Download className="w-3 h-3 ml-1" />
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Right CTA: Join button if in window */}
                              {session.canJoinNow && (
                                <div className="shrink-0 pt-2 md:pt-0">
                                  <Button
                                    variant="primary"
                                    size="md"
                                    leftIcon={Play}
                                    isLoading={joiningSessionId === session._id}
                                    onClick={() => handleJoinSession(session)}
                                  >
                                    Join Class
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* CALENDAR VIEW */}
          {viewMode === 'calendar' && (
            <Card className="border border-line">
              <CardContent className="p-6 space-y-4">
                {/* Month navigation */}
                <div className="flex items-center justify-between pb-2 border-b border-line">
                  <h3 className="font-display font-semibold text-base text-ink">
                    {currentMonthYearStr}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarDate(
                          new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1)
                        )
                      }
                      className="p-1.5 text-ink-muted hover:text-ink rounded border border-line"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarDate(
                          new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1)
                        )
                      }
                      className="p-1.5 text-ink-muted hover:text-ink rounded border border-line"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Day of Week Header */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {getCalendarDays().map((cell, idx) => {
                    if (!cell) {
                      return <div key={`empty-${idx}`} className="h-24 bg-surface-alt/20 rounded" />;
                    }

                    const hasSessions = cell.sessions.length > 0;
                    return (
                      <div
                        key={cell.dateStr}
                        className={`h-24 p-2 rounded border flex flex-col justify-between transition-colors ${
                          hasSessions
                            ? 'border-primary/40 bg-primary-soft/10'
                            : 'border-line/60 bg-surface'
                        }`}
                      >
                        <span className="font-semibold text-ink">{cell.day}</span>
                        {hasSessions && (
                          <div className="space-y-1 overflow-hidden">
                            {cell.sessions.map((s) => (
                              <div
                                key={s._id}
                                className="truncate text-[10px] font-medium text-primary bg-primary-soft px-1 rounded"
                                title={s.title}
                              >
                                {s.title}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* PLACEHOLDER TABS FOR UPCOMING PHASES */}
      {activeTab === 'quizzes' && (
        <EmptyState
          icon={HelpCircle}
          title="Interactive Quizzes Engine"
          description="Timed multiple choice questions and algorithmic knowledge checks are built in Phase 4."
        />
      )}

      {activeTab === 'assignments' && (
        <EmptyState
          icon={FileCheck2}
          title="Homework Assignments & Code Submissions"
          description="ZIP repository uploads and instructor rubrics are built in Phase 5."
        />
      )}

      {activeTab === 'announcements' && (
        <EmptyState
          icon={Bell}
          title="Cohort Notice Board"
          description="Instructor announcements and email broadcasts are built in Phase 6."
        />
      )}
    </div>
  );
};

export default StudentCourseSpacePage;
