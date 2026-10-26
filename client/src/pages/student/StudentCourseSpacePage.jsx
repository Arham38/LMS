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
import quizService from '../../services/quiz.service';
import assignmentService from '../../services/assignment.service';
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
  FormField,
  Input,
  Textarea,
  Modal,
  FileUploader,
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
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [attendanceData, setAttendanceData] = useState({
    attended: 0,
    totalCompleted: 0,
    percentage: 100,
    totalCourseSessions: 0,
  });

  const [loading, setLoading] = useState(true);
  const [joiningSessionId, setJoiningSessionId] = useState(null);
  const [downloadingKey, setDownloadingKey] = useState(null);
  const [downloadingSubmissionKey, setDownloadingSubmissionKey] = useState(null);

  // Student Homework Submission Modal State
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submittingAssignment, setSubmittingAssignment] = useState(null);
  const [submissionForm, setSubmissionForm] = useState({
    fileKey: '',
    fileName: '',
    link: '',
    comment: '',
  });
  const [submittingSolution, setSubmittingSolution] = useState(false);

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
      const [enrollments, sessionsRes, attendanceRes, quizzesRes, assignmentsRes] = await Promise.all([
        enrollmentService.getMyEnrollments(),
        sessionService.getCourseSessionsStudent(courseId),
        sessionService.getMyCourseAttendanceStudent(courseId),
        quizService.getCourseQuizzesStudent(courseId),
        assignmentService.getCourseAssignmentsStudent(courseId),
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
      setQuizzes(quizzesRes.items || []);
      setAssignments(assignmentsRes.items || []);
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

  const handleOpenSubmitModal = (assignment) => {
    setSubmittingAssignment(assignment);
    const existing = assignment.mySubmission;
    setSubmissionForm({
      fileKey: existing?.fileKey || '',
      fileName: existing?.fileName || '',
      link: existing?.link || '',
      comment: '',
    });
    setSubmitModalOpen(true);
  };

  const handleSubmitSolution = async (e) => {
    e.preventDefault();
    if (!submittingAssignment) return;

    const { submissionType } = submittingAssignment;
    if (submissionType === 'file' && !submissionForm.fileKey) {
      toast.error('Please upload your project ZIP or PDF file.');
      return;
    }
    if (submissionType === 'link' && !submissionForm.link) {
      toast.error('Please provide a repository or project link URL.');
      return;
    }
    if (submissionType === 'either' && !submissionForm.fileKey && !submissionForm.link) {
      toast.error('Please either upload a file or provide a project link.');
      return;
    }

    setSubmittingSolution(true);
    try {
      await assignmentService.submitSolution(submittingAssignment._id, {
        fileKey: submissionForm.fileKey || null,
        fileName: submissionForm.fileName || null,
        link: submissionForm.link || null,
        comment: submissionForm.comment.trim(),
      });

      toast.success('Homework solution submitted successfully!');
      setSubmitModalOpen(false);

      // Refresh assignments
      const res = await assignmentService.getCourseAssignmentsStudent(courseId);
      setAssignments(res.items || []);
    } catch (err) {
      toast.error(err.message || 'Failed to submit solution.');
    } finally {
      setSubmittingSolution(false);
    }
  };

  const handleDownloadSubmissionFile = async (key) => {
    if (!key) return;
    setDownloadingSubmissionKey(key);
    try {
      const res = await storageService.getFileUrl(key);
      const url = res.downloadUrl || res.url;
      if (url) {
        window.open(url, '_blank');
      } else {
        toast.error('Download link could not be generated.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to download submission file.');
    } finally {
      setDownloadingSubmissionKey(null);
    }
  };

  const getCountdownString = (dueAt) => {
    const diff = new Date(dueAt).getTime() - now.getTime();
    if (diff <= 0) return 'Deadline passed';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${mins}m remaining`;
    return `${mins}m remaining`;
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
            <span className="text-[10px] bg-primary-soft text-primary px-1.5 py-0.2 rounded font-mono">
              {quizzes.length}
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
            <span className="text-[10px] bg-primary-soft text-primary px-1.5 py-0.2 rounded font-mono">
              {assignments.length}
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

      {/* TAB CONTENT: QUIZZES */}
      {activeTab === 'quizzes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1">
            <span className="font-display font-semibold text-sm text-ink uppercase tracking-wider">
              Knowledge Checks & Coding Quizzes
            </span>
            <span className="text-xs text-ink-muted">
              Auto-graded &bull; Review released per cohort policy
            </span>
          </div>

          {quizzes.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              title="No quizzes published yet"
              description="Your instructor has not scheduled any quizzes for this cohort yet."
            />
          ) : (
            <div className="grid gap-3">
              {quizzes.map((q) => {
                const isPassed = q.hasPassed;
                const hasAttempted = q.attemptsUsed > 0;

                return (
                  <Card key={q._id} className="border border-line hover:border-line-strong transition-all">
                    <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-mono text-ink-muted font-semibold bg-surface-alt px-2 py-0.5 rounded">
                            Week {q.week}
                          </span>

                          {q.status === 'open' ? (
                            <Badge variant="success" dot>Open</Badge>
                          ) : q.status === 'upcoming' ? (
                            <Badge variant="primary" dot>Upcoming</Badge>
                          ) : (
                            <Badge variant="neutral">Closed</Badge>
                          )}

                          {q.timeLimitMinutes ? (
                            <span className="text-[11px] text-ink-muted flex items-center gap-1">
                              <Clock className="w-3 h-3 text-primary" />
                              <span>{q.timeLimitMinutes} mins</span>
                            </span>
                          ) : (
                            <span className="text-[11px] text-ink-muted font-mono">Untimed</span>
                          )}

                          {hasAttempted && (
                            isPassed ? (
                              <Badge variant="success">Passed ({q.bestPercent}%)</Badge>
                            ) : (
                              <Badge variant="warning">Best: {q.bestPercent}%</Badge>
                            )
                          )}
                        </div>

                        <h4 className="font-display font-semibold text-base text-ink">
                          {q.title}
                        </h4>

                        {q.instructions && (
                          <p className="text-xs text-ink-muted leading-relaxed line-clamp-2">
                            {q.instructions}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted pt-1">
                          <span>
                            Questions: <strong className="text-ink font-semibold">{q.questionCount}</strong>
                          </span>
                          <span>&bull;</span>
                          <span>
                            Total Marks: <strong className="text-ink font-semibold">{q.totalMarks}</strong>
                          </span>
                          <span>&bull;</span>
                          <span>
                            Passing: <strong className="text-ink font-semibold">{q.passingPercent}%</strong>
                          </span>
                          <span>&bull;</span>
                          <span>
                            Attempts Used: <strong className="text-ink">{q.attemptsUsed} of {q.maxAttempts}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Right Action Button */}
                      <div className="shrink-0 pt-2 md:pt-0">
                        {q.inProgressAttemptId ? (
                          <Link to={`/student/quizzes/${q._id}/take`}>
                            <Button variant="primary" size="md" leftIcon={Play}>
                              Resume Quiz
                            </Button>
                          </Link>
                        ) : q.canAttempt ? (
                          <Link to={`/student/quizzes/${q._id}/take`}>
                            <Button variant="primary" size="md" leftIcon={Play}>
                              {hasAttempted ? 'Retake Quiz' : 'Start Quiz'}
                            </Button>
                          </Link>
                        ) : hasAttempted ? (
                          <Link to={`/student/quizzes/${q._id}/take`}>
                            <Button variant="secondary" size="md" leftIcon={CheckCircle2}>
                              View Results
                            </Button>
                          </Link>
                        ) : (
                          <Button variant="secondary" size="md" disabled>
                            {q.status === 'upcoming' ? 'Not Open Yet' : 'Quiz Closed'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <EmptyState
                  icon={FileCheck2}
                  title="No Assignments Posted Yet"
                  description="Your instructor has not yet posted any homework assignments or coding challenges for this cohort."
                />
              </CardContent>
            </Card>
          ) : (
            assignments.map((assignment) => {
              const mySub = assignment.mySubmission;
              const isOverdue = new Date() > new Date(assignment.dueAt);
              const countdown = getCountdownString(assignment.dueAt);

              const getSubmissionBadge = () => {
                if (!mySub) {
                  if (isOverdue && !assignment.allowLate) {
                    return <Badge variant="danger" className="text-xs">CLOSED</Badge>;
                  }
                  if (isOverdue && assignment.allowLate) {
                    return <Badge variant="warning" className="text-xs">OVERDUE</Badge>;
                  }
                  return <Badge variant="muted" className="text-xs">NOT SUBMITTED</Badge>;
                }
                switch (mySub.status) {
                  case 'graded':
                    return <Badge variant="success" className="text-xs font-semibold">GRADED</Badge>;
                  case 'returned':
                    return <Badge variant="outline" className="text-xs text-primary border-primary font-semibold">RETURNED FOR REVISION</Badge>;
                  case 'late':
                    return <Badge variant="warning" className="text-xs">SUBMITTED LATE</Badge>;
                  case 'submitted':
                  default:
                    return <Badge variant="default" className="text-xs">SUBMITTED</Badge>;
                }
              };

              return (
                <Card key={assignment._id} className="overflow-hidden">
                  <CardHeader className="border-b border-line bg-surface/30 p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            Week {assignment.week}
                          </Badge>
                          <h3 className="text-base font-semibold text-ink">
                            {assignment.title}
                          </h3>
                          {getSubmissionBadge()}
                          <Badge variant="outline" className="text-xs">
                            {assignment.submissionType === 'either'
                              ? 'File or Link'
                              : assignment.submissionType === 'file'
                              ? 'ZIP / PDF File'
                              : 'Project Link'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5" />
                            Due: {formatPKTDateTime(assignment.dueAt)} PKT
                          </span>
                          <span>•</span>
                          <span className="font-mono text-primary font-medium">
                            {countdown}
                          </span>
                          <span>•</span>
                          <span>Max Marks: <strong className="font-mono text-ink">{assignment.maxMarks}</strong></span>
                          <span>•</span>
                          <span>
                            {assignment.allowLate
                              ? `Late Submissions Allowed (${assignment.latePenaltyPercent}% deduction)`
                              : 'Strict Deadline (No Late Submissions)'}
                          </span>
                        </div>
                      </div>

                      {/* Right Action Button */}
                      <div>
                        {assignment.canSubmit && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenSubmitModal(assignment)}
                            icon={FileCheck2}
                          >
                            {mySub ? (mySub.status === 'returned' ? 'Resubmit Solution' : 'Update Solution') : 'Submit Solution'}
                          </Button>
                        )}
                        {!assignment.canSubmit && isOverdue && !mySub && (
                          <span className="text-xs font-medium text-danger bg-danger/10 px-3 py-1.5 rounded">
                            Deadline Passed — Submissions Closed
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 space-y-5">
                    {/* Instructions */}
                    {assignment.description && (
                      <div className="text-xs text-ink leading-relaxed whitespace-pre-wrap bg-paper p-4 rounded border border-line/60">
                        {assignment.description}
                      </div>
                    )}

                    {/* Rubric Breakdown */}
                    {assignment.rubric && assignment.rubric.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                          Grading Rubric
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {assignment.rubric.map((r, i) => (
                            <div
                              key={i}
                              className="p-2.5 bg-surface rounded border border-line flex items-center justify-between text-xs"
                            >
                              <span className="text-ink truncate pr-2">{r.criterion}</span>
                              <span className="font-mono font-medium text-ink-muted shrink-0">
                                {r.maxMarks} pts
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Graded Feedback Card */}
                    {mySub && mySub.status === 'graded' && (
                      <div className="p-4 bg-success/5 border border-success/30 rounded-md space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-success/20 pb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                            <div>
                              <h4 className="text-sm font-semibold text-ink">
                                Instructor Evaluation Complete
                              </h4>
                              <p className="text-[11px] text-ink-muted">
                                Graded on {formatPKTDateTime(mySub.gradedAt)} PKT
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-ink-muted block">Final Score</span>
                            <span className="font-mono text-xl font-bold text-success">
                              {mySub.finalMarks} <span className="text-sm font-normal text-ink-muted">/ {assignment.maxMarks}</span>
                            </span>
                          </div>
                        </div>

                        {/* Late penalty note */}
                        {mySub.latePenaltyApplied > 0 && (
                          <div className="text-xs text-warning bg-warning/10 p-2 rounded border border-warning/20">
                            <strong>Late Penalty Applied:</strong> -{mySub.latePenaltyApplied} marks ({assignment.latePenaltyPercent}% deduction applied to raw score of {mySub.marks}).
                          </div>
                        )}

                        {/* Rubric details */}
                        {mySub.rubricMarks && mySub.rubricMarks.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                              Rubric Breakdown
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {mySub.rubricMarks.map((rm, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-paper rounded border border-line text-xs">
                                  <span className="text-ink">{rm.criterion}</span>
                                  <span className="font-mono font-bold text-ink">{rm.marks} pts</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Instructor Feedback */}
                        {mySub.feedback && (
                          <div className="pt-2">
                            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block mb-1">
                              Instructor Feedback
                            </span>
                            <div className="p-3 bg-paper rounded border border-line text-xs text-ink leading-relaxed whitespace-pre-wrap font-sans">
                              {mySub.feedback}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Returned Notice */}
                    {mySub && mySub.status === 'returned' && (
                      <div className="p-4 bg-primary/5 border border-primary/30 rounded-md space-y-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-primary shrink-0" />
                          <h4 className="text-sm font-semibold text-ink">
                            Returned for Revision
                          </h4>
                        </div>
                        <p className="text-xs text-ink-muted">
                          Your instructor reviewed this submission and requested revisions before final grading:
                        </p>
                        {mySub.feedback && (
                          <div className="p-3 bg-paper rounded border border-line text-xs text-ink italic">
                            "{mySub.feedback}"
                          </div>
                        )}
                      </div>
                    )}

                    {/* Current Submission Info */}
                    {mySub && (
                      <div className="p-3.5 bg-surface rounded border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-ink">
                              Submission v{mySub.version}
                            </span>
                            <span>•</span>
                            <span className="text-ink-muted">
                              Submitted {formatPKTDateTime(mySub.submittedAt)} PKT
                            </span>
                          </div>
                          {mySub.comment && (
                            <p className="text-ink-muted italic">
                              "{mySub.comment}"
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {mySub.link && (
                            <a
                              href={mySub.link}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper border border-line rounded text-xs font-medium text-ink hover:border-ink/40 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-primary" />
                              View Link
                            </a>
                          )}
                          {mySub.fileKey && (
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs font-mono text-ink bg-surface px-2.5 py-1.5 rounded border border-line flex items-center gap-1.5 max-w-[240px] truncate"
                                title={mySub.fileName || storageService.getDisplayFilename(mySub.fileKey)}
                              >
                                <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span className="truncate">
                                  {mySub.fileName || storageService.getDisplayFilename(mySub.fileKey)}
                                </span>
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadSubmissionFile(mySub.fileKey)}
                                loading={downloadingSubmissionKey === mySub.fileKey}
                                icon={Download}
                              >
                                Download
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}

          {/* Submission Modal */}
          <Modal
            isOpen={submitModalOpen}
            onClose={() => setSubmitModalOpen(false)}
            title={`Submit Solution: ${submittingAssignment?.title || 'Homework'}`}
            size="md"
          >
            <form onSubmit={handleSubmitSolution} className="space-y-4">
              <div className="p-3 bg-surface border border-line rounded text-xs text-ink-muted space-y-1">
                <div className="flex items-center justify-between">
                  <span>Deadline: <strong className="text-ink font-mono">{formatPKTDateTime(submittingAssignment?.dueAt)} PKT</strong></span>
                  <span>Max Marks: <strong className="text-ink font-mono">{submittingAssignment?.maxMarks}</strong></span>
                </div>
                {submittingAssignment && new Date() > new Date(submittingAssignment.dueAt) && (
                  <div className="text-warning font-medium pt-1">
                    Late submission policy: A {submittingAssignment.latePenaltyPercent}% penalty will be deducted automatically from your final score.
                  </div>
                )}
              </div>

              {/* File Upload (for 'file' or 'either') */}
              {(submittingAssignment?.submissionType === 'file' || submittingAssignment?.submissionType === 'either') && (
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Upload Solution Archive (ZIP or PDF, max 50MB)
                    {submittingAssignment.submissionType === 'file' && <span className="text-danger ml-0.5">*</span>}
                  </label>
                  <FileUploader
                    kind="zip"
                    courseId={courseId}
                    accept=".zip,.pdf,application/zip,application/x-zip-compressed,application/pdf"
                    maxSize={50 * 1024 * 1024}
                    value={submissionForm.fileKey}
                    fileName={submissionForm.fileName}
                    onChange={(key, fileName) => setSubmissionForm({ ...submissionForm, fileKey: key, fileName })}
                  />
                </div>
              )}

              {/* Repository / Drive Link (for 'link' or 'either') */}
              {(submittingAssignment?.submissionType === 'link' || submittingAssignment?.submissionType === 'either') && (
                <FormField
                  label="Project or Repository URL Link"
                  required={submittingAssignment.submissionType === 'link'}
                  helperText="Link to your GitHub repository, pull request, or Google Drive folder"
                >
                  <Input
                    type="url"
                    value={submissionForm.link}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, link: e.target.value })}
                    placeholder="https://github.com/your-username/homework-repo"
                    className="font-mono text-xs"
                  />
                </FormField>
              )}

              {/* Comments / Notes */}
              <FormField label="Notes for Instructor (Optional)" helperText="Mention any bonus challenges completed or special instructions to run your code">
                <Textarea
                  rows={3}
                  value={submissionForm.comment}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, comment: e.target.value })}
                  placeholder="e.g. Added JWT refresh tokens and Jest integration tests..."
                  className="text-xs"
                />
              </FormField>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSubmitModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={submittingSolution}
                >
                  Submit Homework
                </Button>
              </div>
            </form>
          </Modal>
        </div>
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
