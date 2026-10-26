import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  ExternalLink,
  ClipboardList,
  Edit2,
  Trash2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Layers,
  ChevronDown,
  RefreshCw,
  X,
  File,
} from 'lucide-react';
import courseService from '../../services/course.service';
import sessionService from '../../services/session.service';
import storageService from '../../services/storage.service';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  Modal,
  ConfirmDialog,
  FormField,
  Input,
  Textarea,
  Select,
  FileUploader,
  Spinner,
  EmptyState,
  Skeleton,
  useToast,
} from '../../components/ui';

export const AdminSessionsPage = () => {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCourseId = searchParams.get('courseId') || '';

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);
  const [sessions, setSessions] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Editor Modal State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null); // null = create mode
  const [savingSession, setSavingSession] = useState(false);
  const [formData, setFormData] = useState({
    week: 1,
    order: 1,
    title: '',
    description: '',
    scheduledAt: '',
    durationMinutes: 120,
    meetingLink: '',
    status: 'upcoming',
    isPublished: true,
  });

  // Attached resources in editor
  const [resources, setResources] = useState([]);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceKey, setNewResourceKey] = useState('');
  const [newResourceName, setNewResourceName] = useState('');

  // Delete State
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Attendance Sheet Modal State
  const [attendanceSession, setAttendanceSession] = useState(null);
  const [attendanceRoster, setAttendanceRoster] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Fetch Courses
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const res = await courseService.getAdminCourses({ limit: 100 });
        const courseItems = res.items || [];
        setCourses(courseItems);

        if (!selectedCourseId && courseItems.length > 0) {
          setSelectedCourseId(courseItems[0]._id);
        }
      } catch (err) {
        toast.error(err.message || 'Failed to load courses.');
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, []);

  // Fetch Sessions when selectedCourseId changes
  const fetchSessions = async (courseId = selectedCourseId) => {
    if (!courseId) return;
    setLoadingSessions(true);
    try {
      const res = await sessionService.getCourseSessionsAdmin(courseId);
      setSessions(res.items || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load live sessions for this course.');
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchSessions(selectedCourseId);
    }
  }, [selectedCourseId]);

  const handleCourseChange = (e) => {
    const id = e.target.value;
    setSelectedCourseId(id);
    setSearchParams(id ? { courseId: id } : {});
  };

  // Open Editor for Create
  const handleOpenCreate = () => {
    setEditingSession(null);
    // Find highest week/order
    const nextOrder = sessions.length > 0 ? sessions[sessions.length - 1].order + 1 : 1;
    const currentWeek = sessions.length > 0 ? sessions[sessions.length - 1].week : 1;

    // Default to tomorrow 8:00 PM PKT
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 1);
    defaultDate.setHours(20, 0, 0, 0);

    setFormData({
      week: currentWeek,
      order: nextOrder,
      title: '',
      description: '',
      scheduledAt: defaultDate.toISOString().slice(0, 16),
      durationMinutes: 120,
      meetingLink: 'https://meet.google.com/',
      status: 'upcoming',
      isPublished: true,
    });
    setResources([]);
    setNewResourceTitle('');
    setNewResourceKey('');
    setNewResourceName('');
    setEditorOpen(true);
  };

  // Open Editor for Edit
  const handleOpenEdit = (session) => {
    setEditingSession(session);
    let schedLocal = '';
    try {
      schedLocal = new Date(session.scheduledAt).toISOString().slice(0, 16);
    } catch {
      schedLocal = '';
    }

    setFormData({
      week: session.week,
      order: session.order,
      title: session.title,
      description: session.description || '',
      scheduledAt: schedLocal,
      durationMinutes: session.durationMinutes || 120,
      meetingLink: session.meetingLink || '',
      status: session.status || 'upcoming',
      isPublished: session.isPublished ?? true,
    });
    setResources(session.resources || []);
    setNewResourceTitle('');
    setNewResourceKey('');
    setNewResourceName('');
    setEditorOpen(true);
  };

  // Add Resource Attachment
  const handleAddResource = () => {
    if (!newResourceKey) {
      toast.error('Please upload a PDF note file first.');
      return;
    }
    const title = newResourceTitle.trim() || 'Lecture Notes';
    setResources((prev) => [
      ...prev,
      {
        title,
        fileKey: newResourceKey,
        fileName: newResourceName || storageService.getDisplayFilename(newResourceKey),
      },
    ]);
    setNewResourceTitle('');
    setNewResourceKey('');
    setNewResourceName('');
    toast.success('Note attachment added.');
  };

  const handleRemoveResource = (index) => {
    setResources((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Session Form
  const handleSaveSession = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) {
      toast.error('Please select a bootcamp course first.');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Session title is required.');
      return;
    }

    if (!formData.meetingLink.trim()) {
      toast.error('Live meeting link is required.');
      return;
    }

    setSavingSession(true);
    try {
      const payload = {
        ...formData,
        week: Number(formData.week),
        order: Number(formData.order),
        durationMinutes: Number(formData.durationMinutes),
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        resources,
      };

      if (editingSession) {
        await sessionService.updateSessionAdmin(editingSession._id, payload);
        toast.success('Session updated successfully.');
      } else {
        await sessionService.createSessionAdmin(selectedCourseId, payload);
        toast.success('Live session created successfully.');
      }

      setEditorOpen(false);
      fetchSessions(selectedCourseId);
    } catch (err) {
      toast.error(err.message || 'Failed to save session.');
    } finally {
      setSavingSession(false);
    }
  };

  // Delete Session
  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    setDeleting(true);
    try {
      await sessionService.deleteSessionAdmin(sessionToDelete._id);
      toast.success('Session and attendance records deleted.');
      setSessionToDelete(null);
      fetchSessions(selectedCourseId);
    } catch (err) {
      toast.error(err.message || 'Failed to delete session.');
    } finally {
      setDeleting(false);
    }
  };

  // Attendance Sheet
  const handleOpenAttendance = async (session) => {
    setAttendanceSession(session);
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

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceRoster((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    );
  };

  const handleSaveAttendance = async () => {
    if (!attendanceSession) return;
    setSavingAttendance(true);
    try {
      await sessionService.updateSessionAttendanceAdmin(
        attendanceSession._id,
        attendanceRoster.map((r) => ({
          studentId: r.studentId,
          status: r.status,
        }))
      );
      toast.success('Attendance records saved.');
      setAttendanceSession(null);
      fetchSessions(selectedCourseId);
    } catch (err) {
      toast.error(err.message || 'Failed to save attendance.');
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleQuickStatusChange = async (sessionId, status) => {
    try {
      await sessionService.updateSessionStatusAdmin(sessionId, status);
      toast.success(`Session status set to ${status}.`);
      fetchSessions(selectedCourseId);
    } catch (err) {
      toast.error(err.message || 'Failed to change session status.');
    }
  };

  // Group sessions by week
  const groupedByWeek = sessions.reduce((acc, sess) => {
    const w = sess.week || 1;
    if (!acc[w]) acc[w] = [];
    acc[w].push(sess);
    return acc;
  }, {});

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
        title="Live Sessions & Notes Manager"
        description="Schedule live classes, upload PDF notes, manage Google Meet links, and verify attendance."
        breadcrumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Live Sessions' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={RefreshCw}
              onClick={() => fetchSessions()}
              isLoading={loadingSessions}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Plus}
              onClick={handleOpenCreate}
              disabled={!selectedCourseId}
            >
              Schedule Session
            </Button>
          </div>
        }
      />

      {/* Course Filter Bar */}
      <Card className="border border-line">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label htmlFor="course-select" className="text-xs font-semibold text-ink uppercase tracking-wider shrink-0">
              Select Bootcamp:
            </label>
            <Select
              id="course-select"
              value={selectedCourseId}
              onChange={handleCourseChange}
              className="w-full sm:w-80 text-xs"
              disabled={loadingCourses}
            >
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </Select>
          </div>

          <div className="text-xs text-ink-muted flex items-center gap-4">
            <span>
              Total Scheduled: <strong className="text-ink font-semibold">{sessions.length} sessions</strong>
            </span>
            <span>&bull;</span>
            <span>Time Zone: <strong className="text-ink font-mono">Asia/Karachi (PKT)</strong></span>
          </div>
        </CardContent>
      </Card>

      {/* Sessions Road Map List */}
      {loadingSessions ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : Object.keys(groupedByWeek).length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No live sessions scheduled yet"
          description="Build the cohort syllabus by scheduling the first live lecture session."
          actionText="Schedule Session 1"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByWeek).map(([weekNum, weekSessions]) => (
            <div key={weekNum} className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-line">
                <Layers className="w-4 h-4 text-primary" />
                <h2 className="font-display font-semibold text-sm text-ink uppercase tracking-wider">
                  Week {weekNum} ({weekSessions.length} session{weekSessions.length === 1 ? '' : 's'})
                </h2>
              </div>

              <div className="grid gap-3">
                {weekSessions.map((session) => (
                  <Card key={session._id} className="border border-line hover:border-line-strong transition-all">
                    <CardContent className="p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      {/* Left: Info */}
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-mono text-ink-muted font-semibold bg-surface-alt px-2 py-0.5 rounded">
                            Week {session.week} &bull; Class {session.order}
                          </span>
                          {getStatusBadge(session.status)}
                          {!session.isPublished && (
                            <Badge variant="neutral">Draft (Hidden)</Badge>
                          )}
                        </div>

                        <h3 className="font-display font-semibold text-base text-ink">
                          {session.title}
                        </h3>

                        {session.description && (
                          <p className="text-xs text-ink-muted leading-relaxed line-clamp-2">
                            {session.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted pt-1">
                          <span className="flex items-center gap-1 font-medium text-ink">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span>{formatPKTDateTime(session.scheduledAt)} PKT</span>
                          </span>
                          <span>&bull;</span>
                          <span>{session.durationMinutes} minutes</span>
                          <span>&bull;</span>
                          <span className="text-primary font-medium">
                            Attendance: {session.attendanceSummary?.attendedTotal || 0} / {session.enrolledCount || 0}
                          </span>
                        </div>

                        {/* Meeting Link & Notes */}
                        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                          <a
                            href={session.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-[11px]"
                          >
                            <Video className="w-3 h-3" />
                            <span>{session.meetingLink}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>

                          {session.resources?.map((res, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-muted bg-surface-alt px-2 py-0.5 rounded border border-line"
                            >
                              <FileText className="w-3 h-3 text-primary" />
                              <span>{res.title}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-line justify-end">
                        <Select
                          size="sm"
                          value={session.status}
                          onChange={(e) => handleQuickStatusChange(session._id, e.target.value)}
                          className="w-28 text-xs"
                        >
                          <option value="upcoming">Upcoming</option>
                          <option value="live">Live Now</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </Select>

                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={ClipboardList}
                          onClick={() => handleOpenAttendance(session)}
                        >
                          Attendance
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={Edit2}
                          onClick={() => handleOpenEdit(session)}
                        >
                          Edit
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger hover:text-danger hover:bg-danger-soft/30"
                          onClick={() => setSessionToDelete(session)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Session Create / Edit Modal */}
      <Modal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editingSession ? 'Edit Live Session' : 'Schedule New Live Session'}
        size="lg"
      >
        <form onSubmit={handleSaveSession} className="space-y-4 text-xs" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Curriculum Week" required>
              <Input
                type="number"
                min="1"
                value={formData.week}
                onChange={(e) => setFormData({ ...formData, week: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Order in Week (Class #)" required>
              <Input
                type="number"
                min="1"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                required
              />
            </FormField>
          </div>

          <FormField label="Session Title" required helperText="e.g. Asynchronous Node.js & Event Loop Architecture">
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Master React Hooks & Performance"
              required
            />
          </FormField>

          <FormField label="Session Description / Key Topics (Optional)">
            <Textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Key concepts, live coding demos, and setup requirements..."
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Scheduled Date & Time (PKT)" required helperText="Local Pakistan Time">
              <Input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Duration (Minutes)" required helperText="e.g. 120 = 2 hours">
              <Input
                type="number"
                min="15"
                max="360"
                step="15"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                required
              />
            </FormField>
          </div>

          <FormField
            label="Live Meeting URL (Google Meet / Zoom)"
            required
            helperText="Kept strictly confidential and only shown to approved students inside the join window"
          >
            <Input
              type="url"
              value={formData.meetingLink}
              onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
              placeholder="https://meet.google.com/abc-defg-hij"
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Session Status">
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="upcoming">Upcoming</option>
                <option value="live">Live Now</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </FormField>

            <FormField label="Publication Visibility">
              <Select
                value={formData.isPublished ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.value === 'true' })}
              >
                <option value="true">Published (Visible to Students)</option>
                <option value="false">Draft (Admin Only)</option>
              </Select>
            </FormField>
          </div>

          {/* Resources / Notes Section */}
          <div className="pt-3 border-t border-line space-y-3">
            <span className="font-semibold text-ink uppercase tracking-wider block">
              Lecture Notes & Cheat Sheets (PDF)
            </span>

            {/* List of attached notes */}
            {resources.length > 0 && (
              <div className="space-y-1.5">
                {resources.map((res, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-surface-alt rounded border border-line">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="font-medium text-ink">{res.title}</span>
                      <span className="text-[10px] font-mono text-ink-muted">({res.fileName || storageService.getDisplayFilename(res.fileKey)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveResource(i)}
                      className="text-danger hover:text-danger/80 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Note PDF */}
            <div className="p-3 border border-dashed border-line rounded space-y-3 bg-surface">
              <FormField label="Note / Resource Title">
                <Input
                  value={newResourceTitle}
                  onChange={(e) => setNewResourceTitle(e.target.value)}
                  placeholder="e.g. Session 04 Architecture Cheat Sheet"
                />
              </FormField>

              <FileUploader
                kind="pdf"
                courseId={selectedCourseId}
                accept="application/pdf"
                label="Select Lecture PDF"
                helperText="PDF up to 20MB. Uploads directly to private Supabase Storage bucket."
                value={newResourceKey}
                fileName={newResourceName}
                onChange={(key, fileName) => {
                  setNewResourceKey(key);
                  setNewResourceName(fileName);
                }}
              />

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddResource}
                disabled={!newResourceKey}
              >
                Attach Note to Session
              </Button>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-line">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setEditorOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={savingSession}
            >
              {editingSession ? 'Update Session' : 'Create Session'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Attendance Sheet Modal */}
      <Modal
        isOpen={!!attendanceSession}
        onClose={() => setAttendanceSession(null)}
        title={`Class Attendance: ${attendanceSession?.title || ''}`}
        size="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-surface-alt rounded flex items-center justify-between text-ink-muted">
            <span>
              Scheduled: {attendanceSession && formatPKTDateTime(attendanceSession.scheduledAt)} PKT
            </span>
            <span className="font-semibold text-ink">
              {attendanceRoster.filter((r) => r.status === 'present').length} Present &bull;{' '}
              {attendanceRoster.filter((r) => r.status === 'late').length} Late &bull;{' '}
              {attendanceRoster.filter((r) => r.status === 'absent').length} Absent
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
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{studentItem.name}</span>
                      {studentItem.source === 'auto' && (
                        <span className="text-[10px] bg-primary-soft text-primary px-1.5 py-0.5 rounded font-medium">
                          Auto
                        </span>
                      )}
                      {studentItem.source === 'manual' && (
                        <span className="text-[10px] bg-surface-alt text-ink-muted px-1.5 py-0.5 rounded font-medium border border-line">
                          Manual
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-ink-muted">{studentItem.email}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAttendanceChange(studentItem.studentId, 'present')}
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
                      onClick={() => handleAttendanceChange(studentItem.studentId, 'late')}
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
                      onClick={() => handleAttendanceChange(studentItem.studentId, 'absent')}
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
              onClick={() => setAttendanceSession(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveAttendance}
              isLoading={savingAttendance}
              disabled={attendanceLoading || attendanceRoster.length === 0}
            >
              Save Attendance Sheet
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
        title="Delete Live Session"
        message={`Are you sure you want to delete "${sessionToDelete?.title}"? All associated attendance logs will be permanently removed.`}
        confirmText="Delete Session"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={deleting}
        onConfirm={handleDeleteSession}
      />
    </div>
  );
};

export default AdminSessionsPage;
