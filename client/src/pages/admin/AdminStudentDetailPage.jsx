import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  UserX,
  CreditCard,
  Video,
  FileCheck2,
  HelpCircle,
  FileText,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
} from 'lucide-react';
import studentManagementService from '../../services/studentManagement.service';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  Avatar,
  Textarea,
  Tabs,
  EmptyState,
  Skeleton,
  useToast,
} from '../../components/ui';

export const AdminStudentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Private notes state
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchStudent = async () => {
    setLoading(true);
    try {
      const res = await studentManagementService.getStudentById(id);
      setData(res);
      setNotes(res?.student?.privateNotes || '');
    } catch (err) {
      toast.error('Failed to load student profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await studentManagementService.updateStudentNotes(id, notes);
      toast.success('Private notes saved successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to save notes.');
    } finally {
      setSavingNotes(false);
    }
  };

  const formatPKTDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('en-PK', {
        timeZone: 'Asia/Karachi',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return String(dateStr);
    }
  };

  const student = data?.student || {};
  const enrollments = data?.enrollments || [];
  const attendance = data?.attendanceSummary || {};
  const quizAttempts = data?.quizAttempts || [];
  const submissions = data?.submissions || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar with Back Button */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/students')}
          icon={ArrowLeft}
        >
          All Students
        </Button>
      </div>

      {/* Student Profile Header Banner */}
      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <Avatar name={student.name} src={student.avatar} size="lg" />
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-ink">{student.name}</h1>
                <Badge variant={student.isActive ? 'success' : 'danger'} dot className="text-xs">
                  {student.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                <span className="flex items-center gap-1 font-mono">
                  <Mail className="w-3.5 h-3.5" /> {student.email}
                </span>
                {student.phone && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5" /> {student.phone}
                  </span>
                )}
                <span className="flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5" /> Joined {formatPKTDateTime(student.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-line pt-3 md:pt-0 md:pl-6 text-center">
            <div>
              <span className="text-[11px] text-ink-muted block uppercase tracking-wider font-semibold">
                Attendance
              </span>
              <span className={`font-mono text-xl font-bold ${attendance.overallAttendancePercent >= 75 ? 'text-success' : 'text-warning'}`}>
                {attendance.overallAttendancePercent}%
              </span>
            </div>
            <div className="w-px h-8 bg-line" />
            <div>
              <span className="text-[11px] text-ink-muted block uppercase tracking-wider font-semibold">
                Cohorts
              </span>
              <span className="font-mono text-xl font-bold text-ink">
                {enrollments.length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="border-b border-line flex items-center gap-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'enrollments', label: `Cohorts (${enrollments.length})` },
          { id: 'attendance', label: `Attendance (${attendance.totalClassesTracked || 0})` },
          { id: 'quizzes', label: `Quizzes (${quizAttempts.length})` },
          { id: 'assignments', label: `Assignments (${submissions.length})` },
          { id: 'notes', label: 'Private Notes' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 border-b-2 -mb-[1px] transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <span className="text-xs text-ink-muted uppercase font-semibold">Classes Attended</span>
            <p className="font-mono text-2xl font-bold text-ink mt-1">
              {attendance.attendedClassesCount || 0} / {attendance.totalClassesTracked || 0}
            </p>
            <p className="text-[11px] text-ink-muted mt-1">{attendance.overallAttendancePercent}% overall rate</p>
          </Card>

          <Card className="p-4">
            <span className="text-xs text-ink-muted uppercase font-semibold">Approved Cohorts</span>
            <p className="font-mono text-2xl font-bold text-ink mt-1">
              {enrollments.filter((e) => e.status === 'approved').length}
            </p>
            <p className="text-[11px] text-ink-muted mt-1">Active enrollments</p>
          </Card>

          <Card className="p-4">
            <span className="text-xs text-ink-muted uppercase font-semibold">Quizzes Taken</span>
            <p className="font-mono text-2xl font-bold text-ink mt-1">
              {quizAttempts.length}
            </p>
            <p className="text-[11px] text-ink-muted mt-1">Completed evaluations</p>
          </Card>

          <Card className="p-4">
            <span className="text-xs text-ink-muted uppercase font-semibold">Homework Submitted</span>
            <p className="font-mono text-2xl font-bold text-ink mt-1">
              {submissions.length}
            </p>
            <p className="text-[11px] text-ink-muted mt-1">Code & project solutions</p>
          </Card>
        </div>
      )}

      {activeTab === 'enrollments' && (
        <div className="space-y-3">
          {enrollments.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-xs text-ink-muted">No cohort enrollments.</CardContent></Card>
          ) : (
            enrollments.map((enr) => (
              <Card key={enr._id}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-ink text-sm">{enr.course?.title}</h4>
                      <Badge variant={enr.status === 'approved' ? 'success' : 'warning'} className="text-[10px]">
                        {enr.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-ink-muted font-mono mt-0.5">
                      Fee: PKR {enr.amountDue} • Paid: PKR {enr.amountPaid} via {enr.paymentMethod.toUpperCase()} (TXN: {enr.transactionId})
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-ink-muted">
                    Enrolled: {formatPKTDateTime(enr.createdAt)}
                  </span>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="space-y-3">
          {!attendance.records || attendance.records.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-xs text-ink-muted">No attendance records found.</CardContent></Card>
          ) : (
            attendance.records.map((att) => (
              <Card key={att._id}>
                <CardContent className="p-3.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={att.status === 'present' ? 'success' : att.status === 'late' ? 'warning' : 'danger'} className="text-[10px]">
                        {att.status.toUpperCase()}
                      </Badge>
                      <span className="font-semibold text-ink">
                        {att.session?.title || 'Lecture Session'}
                      </span>
                    </div>
                    <p className="text-ink-muted text-[11px] mt-0.5">
                      {att.course?.title} • Week {att.session?.week || 1}
                    </p>
                  </div>
                  <span className="font-mono text-ink-muted text-[11px]">
                    Joined: {att.joinedAt ? formatPKTDateTime(att.joinedAt) : 'Manual Marking'}
                  </span>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'quizzes' && (
        <div className="space-y-3">
          {quizAttempts.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-xs text-ink-muted">No quiz attempts recorded.</CardContent></Card>
          ) : (
            quizAttempts.map((attempt) => (
              <Card key={attempt._id}>
                <CardContent className="p-3.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink">{attempt.quiz?.title || 'Quiz'}</span>
                      <Badge variant={attempt.percent >= (attempt.quiz?.passingPercent || 60) ? 'success' : 'danger'} className="text-[10px]">
                        {attempt.percent >= (attempt.quiz?.passingPercent || 60) ? 'PASSED' : 'FAILED'}
                      </Badge>
                    </div>
                    <p className="text-ink-muted text-[11px] mt-0.5">
                      {attempt.course?.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-base font-bold text-ink">
                      {attempt.score} / {attempt.totalMarks} ({attempt.percent}%)
                    </span>
                    <span className="block text-[10px] font-mono text-ink-muted">
                      {formatPKTDateTime(attempt.submittedAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="space-y-3">
          {submissions.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-xs text-ink-muted">No homework submissions found.</CardContent></Card>
          ) : (
            submissions.map((sub) => (
              <Card key={sub._id}>
                <CardContent className="p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-ink">{sub.assignment?.title || 'Assignment'}</h4>
                      <Badge variant={sub.status === 'graded' ? 'success' : sub.status === 'late' ? 'warning' : 'default'} className="text-[10px]">
                        {sub.status.toUpperCase()}
                      </Badge>
                      <span className="font-mono text-[11px] text-ink-muted">v{sub.version}</span>
                    </div>
                    <span className="font-mono text-sm font-bold text-ink">
                      {sub.finalMarks !== null ? `${sub.finalMarks} / ${sub.assignment?.maxMarks}` : 'Pending Grade'}
                    </span>
                  </div>
                  {sub.comment && <p className="text-ink-muted italic">"{sub.comment}"</p>}
                  {sub.feedback && (
                    <div className="p-2.5 bg-surface rounded border border-line text-[11px]">
                      <strong>Instructor Feedback:</strong> {sub.feedback}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <Card className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-ink">Private Instructor Notes</h3>
            <p className="text-xs text-ink-muted">
              These notes are strictly confidential to the admin and are never visible to the student.
            </p>
          </div>
          <Textarea
            rows={6}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Record observations on student aptitude, interview prep progress, or payment installment arrangements..."
            className="text-xs"
          />
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveNotes}
              loading={savingNotes}
              icon={Save}
            >
              Save Private Notes
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminStudentDetailPage;
