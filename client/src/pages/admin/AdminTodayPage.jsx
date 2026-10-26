import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  Clock,
  Calendar,
  ExternalLink,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Users,
  Play,
} from 'lucide-react';
import sessionService from '../../services/session.service';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  Modal,
  Spinner,
  EmptyState,
  Skeleton,
  useToast,
} from '../../components/ui';

export const AdminTodayPage = () => {
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [todayPkt, setTodayPkt] = useState('');

  // Attendance Sheet Modal State
  const [activeSessionForAttendance, setActiveSessionForAttendance] = useState(null);
  const [attendanceRoster, setAttendanceRoster] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  const fetchTodaySessions = async () => {
    setLoading(true);
    try {
      const res = await sessionService.getTodaySessionsAdmin();
      setSessions(res.items || []);
      setTodayPkt(res.todayPkt || '');
    } catch (err) {
      toast.error(err.message || 'Failed to load today’s live sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Today’s Live Classes — Admin Workspace';
    fetchTodaySessions();
  }, []);

  const openAttendanceModal = async (session) => {
    setActiveSessionForAttendance(session);
    setAttendanceLoading(true);
    try {
      const res = await sessionService.getSessionAttendanceAdmin(session._id);
      setAttendanceRoster(res.roster || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load attendance roster.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleAttendanceStatusChange = (studentId, newStatus) => {
    setAttendanceRoster((prev) =>
      prev.map((item) =>
        item.studentId === studentId ? { ...item, status: newStatus } : item
      )
    );
  };

  const saveAttendanceSheet = async () => {
    if (!activeSessionForAttendance) return;
    setSavingAttendance(true);
    try {
      await sessionService.updateSessionAttendanceAdmin(
        activeSessionForAttendance._id,
        attendanceRoster.map((r) => ({
          studentId: r.studentId,
          status: r.status,
        }))
      );
      toast.success('Attendance records updated successfully.');
      setActiveSessionForAttendance(null);
      fetchTodaySessions();
    } catch (err) {
      toast.error(err.message || 'Failed to save attendance records.');
    } finally {
      setSavingAttendance(false);
    }
  };

  const formatPKTTime = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleTimeString('en-PK', {
        timeZone: 'Asia/Karachi',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'live':
        return <Badge variant="danger" dot>Live Now</Badge>;
      case 'upcoming':
        return <Badge variant="primary" dot>Upcoming</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="neutral">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Today's Live Classes"
        description="One-click access to start today's lectures and mark student attendance in real time."
        breadcrumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Today' },
        ]}
        actions={
          <Button
            variant="secondary"
            size="sm"
            leftIcon={RefreshCw}
            onClick={fetchTodaySessions}
            isLoading={loading}
          >
            Refresh
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No live classes scheduled for today"
          description="Enjoy your teaching break or review upcoming sessions in the course manager."
          actionText="Manage Course Sessions"
          onAction={() => window.location.assign('/admin/sessions')}
        />
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-surface-alt border border-line rounded flex items-center justify-between text-xs">
            <span className="font-semibold text-ink">
              Pakistan Standard Time (PKT) &bull; {sessions.length} class{sessions.length === 1 ? '' : 'es'} today
            </span>
            <span className="font-mono text-ink-muted">
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                timeZone: 'Asia/Karachi',
              })}
            </span>
          </div>

          <div className="grid gap-4">
            {sessions.map((session) => (
              <Card key={session._id} className="border border-line">
                <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="neutral">
                        {session.course?.title || 'Bootcamp Course'}
                      </Badge>
                      <span className="text-xs text-ink-muted font-mono">
                        Week {session.week} &bull; Session {session.order}
                      </span>
                      {getStatusBadge(session.status)}
                    </div>

                    <h3 className="font-display font-semibold text-base text-ink">
                      {session.title}
                    </h3>

                    {session.description && (
                      <p className="text-xs text-ink-muted leading-relaxed line-clamp-1">
                        {session.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-ink-muted pt-1">
                      <span className="flex items-center gap-1.5 font-medium text-ink">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>{formatPKTTime(session.scheduledAt)} PKT</span>
                      </span>
                      <span>&bull;</span>
                      <span>{session.durationMinutes} minutes</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-line">
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={ClipboardList}
                      onClick={() => openAttendanceModal(session)}
                    >
                      Attendance
                    </Button>

                    <a
                      href={session.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-none"
                    >
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={Play}
                        className="w-full sm:w-auto"
                      >
                        Start Class
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Sheet Modal */}
      <Modal
        isOpen={!!activeSessionForAttendance}
        onClose={() => setActiveSessionForAttendance(null)}
        title={`Live Attendance: ${activeSessionForAttendance?.title || ''}`}
        size="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-surface-alt rounded flex items-center justify-between text-ink-muted">
            <span>
              Scheduled: {activeSessionForAttendance && formatPKTTime(activeSessionForAttendance.scheduledAt)} PKT
            </span>
            <span className="font-medium text-ink">
              {attendanceRoster.filter((r) => r.status === 'present').length} of {attendanceRoster.length} Present
            </span>
          </div>

          {attendanceLoading ? (
            <div className="py-12 flex justify-center">
              <Spinner size="md" />
            </div>
          ) : attendanceRoster.length === 0 ? (
            <div className="py-8 text-center text-ink-muted">
              No approved students found enrolled in this bootcamp cohort.
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto divide-y divide-line border border-line rounded">
              {attendanceRoster.map((studentItem) => (
                <div
                  key={studentItem.studentId}
                  className="p-3 flex items-center justify-between gap-3 hover:bg-surface-alt/40 transition-colors"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-ink block">{studentItem.name}</span>
                    <span className="text-[11px] text-ink-muted">{studentItem.email}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAttendanceStatusChange(studentItem.studentId, 'present')}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
                        studentItem.status === 'present'
                          ? 'bg-success text-surface'
                          : 'bg-surface-alt text-ink-muted hover:text-ink'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAttendanceStatusChange(studentItem.studentId, 'late')}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
                        studentItem.status === 'late'
                          ? 'bg-warning text-surface'
                          : 'bg-surface-alt text-ink-muted hover:text-ink'
                      }`}
                    >
                      Late
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAttendanceStatusChange(studentItem.studentId, 'absent')}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
                        studentItem.status === 'absent'
                          ? 'bg-danger text-surface'
                          : 'bg-surface-alt text-ink-muted hover:text-ink'
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 flex items-center justify-between border-t border-line">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveSessionForAttendance(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={saveAttendanceSheet}
              isLoading={savingAttendance}
              disabled={attendanceLoading || attendanceRoster.length === 0}
            >
              Save Attendance Sheet
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminTodayPage;
