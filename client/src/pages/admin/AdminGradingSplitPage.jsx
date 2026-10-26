import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  ExternalLink,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  History,
  Send,
  RotateCcw,
  User,
  FileArchive,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Sliders,
  CheckSquare,
  FileSpreadsheet,
} from 'lucide-react';
import assignmentService from '../../services/assignment.service';
import storageService from '../../services/storage.service';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  Input,
  Textarea,
  Avatar,
  EmptyState,
  Skeleton,
  useToast,
} from '../../components/ui';

export const AdminGradingSplitPage = () => {
  const { id: assignmentId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'needs_grading' | 'late' | 'graded' | 'not_submitted' | 'returned'
  const [searchQuery, setSearchQuery] = useState('');

  // Active student grading state
  const [gradeMarks, setGradeMarks] = useState('');
  const [rubricScores, setRubricScores] = useState({});
  const [feedback, setFeedback] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await assignmentService.getAssignmentSubmissions(assignmentId, {
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery || undefined,
      });

      setAssignment(res.assignment || null);
      const items = res.items || [];
      setSubmissions(items);
      setSummary(res.summary || null);

      // If no student is selected or currently selected student is not in new list, pick first
      if (items.length > 0) {
        const stillSelected = items.find((item) => item.student?._id === selectedStudentId);
        if (!stillSelected) {
          setSelectedStudentId(items[0].student?._id);
        }
      } else {
        setSelectedStudentId(null);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load submissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [assignmentId, statusFilter]);

  // When selected student changes, populate the grading form
  const currentItem = submissions.find((item) => item.student?._id === selectedStudentId) || null;

  useEffect(() => {
    if (currentItem && currentItem.isRealSubmission) {
      setGradeMarks(currentItem.marks !== null && currentItem.marks !== undefined ? String(currentItem.marks) : '');
      setFeedback(currentItem.feedback || '');

      // Initialize rubric scores
      const initialRubric = {};
      if (currentItem.rubricMarks && currentItem.rubricMarks.length > 0) {
        currentItem.rubricMarks.forEach((rm) => {
          initialRubric[rm.criterion] = rm.marks;
        });
      } else if (assignment?.rubric) {
        assignment.rubric.forEach((r) => {
          initialRubric[r.criterion] = '';
        });
      }
      setRubricScores(initialRubric);
    } else {
      setGradeMarks('');
      setFeedback('');
      setRubricScores({});
    }
    setShowHistory(false);
  }, [selectedStudentId, currentItem?.version, currentItem?.marks]);

  const handleRubricScoreChange = (criterion, val, max) => {
    const num = val === '' ? '' : Math.min(max, Math.max(0, Number(val) || 0));
    const nextScores = { ...rubricScores, [criterion]: num };
    setRubricScores(nextScores);

    // Sum all rubric criteria and set total raw marks
    const sum = Object.values(nextScores).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
    setGradeMarks(String(sum));
  };

  const handleDownloadFile = async (key) => {
    if (!key) return;
    setDownloading(true);
    try {
      const res = await storageService.getFileUrl(key);
      const url = res.downloadUrl || res.url;
      if (url) {
        window.open(url, '_blank');
      } else {
        toast.error('Download link could not be generated.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to download submission archive.');
    } finally {
      setDownloading(false);
    }
  };

  // Submit Grade
  const handleSaveGrade = async (action = 'grade', advanceToNext = false) => {
    if (!currentItem || !currentItem.isRealSubmission) return;

    if (gradeMarks === '' && action === 'grade') {
      toast.error('Please enter marks for this submission.');
      return;
    }

    const marksNum = Number(gradeMarks);
    if (marksNum > (assignment?.maxMarks || 100)) {
      toast.error(`Marks cannot exceed maximum marks (${assignment?.maxMarks || 100}).`);
      return;
    }

    setGrading(true);
    try {
      const rubricPayload = Object.entries(rubricScores).map(([criterion, marks]) => ({
        criterion,
        marks: Number(marks) || 0,
      }));

      await assignmentService.gradeSubmission(currentItem._id, {
        marks: marksNum,
        rubricMarks: rubricPayload,
        feedback: feedback.trim(),
        action,
      });

      toast.success(
        action === 'return'
          ? 'Submission returned to student for revision.'
          : 'Grade and feedback saved successfully.'
      );

      // Advance to next student needing grading if requested
      if (advanceToNext) {
        const remainingToGrade = submissions.filter(
          (s) => s.isRealSubmission && (s.status === 'submitted' || s.status === 'late') && s.student?._id !== selectedStudentId
        );
        if (remainingToGrade.length > 0) {
          setSelectedStudentId(remainingToGrade[0].student?._id);
        }
      }

      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to save grade.');
    } finally {
      setGrading(false);
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
    } catch (e) {
      return String(dateStr);
    }
  };

  // Calculate late penalty preview
  const rawMarks = Number(gradeMarks) || 0;
  const isLate = currentItem?.status === 'late';
  const penaltyPercent = assignment?.latePenaltyPercent || 0;
  const latePenaltyApplied = isLate && penaltyPercent > 0
    ? Math.round((rawMarks * penaltyPercent) / 100)
    : 0;
  const finalMarksPreview = Math.max(0, rawMarks - latePenaltyApplied);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="default" className="text-[10px]">SUBMITTED</Badge>;
      case 'late':
        return <Badge variant="warning" className="text-[10px]">LATE</Badge>;
      case 'graded':
        return <Badge variant="success" className="text-[10px]">GRADED</Badge>;
      case 'returned':
        return <Badge variant="outline" className="text-[10px] text-primary border-primary">RETURNED</Badge>;
      case 'not_submitted':
      default:
        return <Badge variant="muted" className="text-[10px]">NOT SUBMITTED</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/assignments?courseId=${assignment?.course?._id || ''}`)}
            icon={ArrowLeft}
          >
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-surface border border-line rounded text-ink">
                Week {assignment?.week || 1}
              </span>
              <h1 className="text-lg font-bold text-ink">
                {assignment?.title || 'Grading Submissions'}
              </h1>
            </div>
            <p className="text-xs text-ink-muted">
              Max Marks: <strong className="font-mono text-ink">{assignment?.maxMarks}</strong> • Due:{' '}
              {formatPKTDateTime(assignment?.dueAt)} PKT • Late Penalty: {assignment?.latePenaltyPercent}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {assignment?._id && (
            <a
              href={assignmentService.getExportCSVUrl(assignment._id)}
              download
              className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium text-ink bg-surface border border-line rounded hover:bg-surface-hover hover:border-ink/30 transition-colors"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-ink-muted" />
              Export Marks CSV
            </a>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            icon={RefreshCw}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[640px]">
        {/* Left Column: Student Roster (4 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-1 p-1 bg-surface border border-line rounded-md text-xs">
            {[
              { id: 'all', label: `All (${summary?.totalEnrolled || 0})` },
              { id: 'needs_grading', label: `To Grade (${(summary?.submittedCount || 0) + (summary?.lateCount || 0)})` },
              { id: 'late', label: `Late (${summary?.lateCount || 0})` },
              { id: 'graded', label: `Graded (${summary?.gradedCount || 0})` },
              { id: 'returned', label: `Returned (${summary?.returnedCount || 0})` },
              { id: 'not_submitted', label: `Unsubmitted (${summary?.notSubmittedCount || 0})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 text-xs rounded transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-paper text-ink font-semibold shadow-xs border border-line'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <Input
              size="sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by student name or email..."
              className="pl-8 text-xs"
            />
          </div>

          {/* Submissions Roster List */}
          <div className="border border-line rounded-md overflow-hidden bg-paper flex-1 max-h-[580px] overflow-y-auto divide-y divide-line">
            {loading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="p-8 text-center text-xs text-ink-muted">
                No students matching current filter.
              </div>
            ) : (
              submissions.map((sub) => {
                const isSelected = sub.student?._id === selectedStudentId;

                return (
                  <button
                    key={sub._id}
                    onClick={() => setSelectedStudentId(sub.student?._id)}
                    className={`w-full text-left p-3 flex items-center justify-between gap-3 transition-colors ${
                      isSelected
                        ? 'bg-surface border-l-4 border-l-primary'
                        : 'hover:bg-surface/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        name={sub.student?.name || 'Student'}
                        src={sub.student?.avatar}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-ink truncate">
                            {sub.student?.name}
                          </p>
                          {sub.version > 1 && (
                            <span className="text-[10px] font-mono text-ink-muted px-1 bg-surface border border-line rounded">
                              v{sub.version}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-ink-muted truncate">
                          {sub.student?.email}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
                      {getStatusBadge(sub.status)}
                      {sub.status === 'graded' && sub.finalMarks !== null && (
                        <span className="font-mono text-xs font-semibold text-ink">
                          {sub.finalMarks} / {assignment?.maxMarks}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Grading Workspace (7 cols on lg) */}
        <div className="lg:col-span-7">
          {!currentItem ? (
            <Card className="h-full flex items-center justify-center p-8">
              <EmptyState
                icon={User}
                title="No Student Selected"
                description="Select a student from the left roster to view their submitted work and enter grades."
              />
            </Card>
          ) : !currentItem.isRealSubmission ? (
            /* Student has NOT submitted */
            <Card className="h-full">
              <CardHeader className="border-b border-line pb-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={currentItem.student?.name}
                    src={currentItem.student?.avatar}
                    size="md"
                  />
                  <div>
                    <h3 className="text-base font-semibold text-ink">
                      {currentItem.student?.name}
                    </h3>
                    <p className="text-xs text-ink-muted font-mono">
                      {currentItem.student?.email} • Phone: {currentItem.student?.phone || '—'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-16 text-center">
                <div className="max-w-md mx-auto space-y-3">
                  <div className="w-12 h-12 rounded-full bg-surface border border-line flex items-center justify-center mx-auto text-ink-muted">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-ink">
                    No Submission Received
                  </h4>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    This student has not yet uploaded a solution file or provided a repository link for Week {assignment?.week}.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Real Submission Details & Grading Form */
            <Card className="h-full">
              <CardHeader className="border-b border-line pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={currentItem.student?.name}
                      src={currentItem.student?.avatar}
                      size="md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-ink">
                          {currentItem.student?.name}
                        </h3>
                        {getStatusBadge(currentItem.status)}
                        <span className="font-mono text-xs text-ink-muted px-1.5 py-0.5 bg-surface border border-line rounded">
                          v{currentItem.version}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted font-mono">
                        {currentItem.student?.email} • Submitted: {formatPKTDateTime(currentItem.submittedAt)} PKT
                      </p>
                    </div>
                  </div>

                  {/* Submission Files & Links */}
                  <div className="flex flex-wrap items-center gap-2">
                    {currentItem.link && (
                      <a
                        href={currentItem.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ink bg-surface border border-line rounded hover:bg-surface-hover hover:border-ink/30 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-primary" />
                        Open Repository Link
                      </a>
                    )}
                    {currentItem.fileKey && (
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-mono text-ink bg-surface px-2.5 py-1.5 rounded border border-line flex items-center gap-1.5 max-w-[260px] truncate"
                          title={currentItem.fileName || storageService.getDisplayFilename(currentItem.fileKey)}
                        >
                          <FileArchive className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate">
                            {currentItem.fileName || storageService.getDisplayFilename(currentItem.fileKey)}
                          </span>
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadFile(currentItem.fileKey)}
                          loading={downloading}
                          icon={Download}
                        >
                          Download
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-6">
                {/* Student Comment */}
                {currentItem.comment && (
                  <div className="p-3.5 bg-surface border border-line rounded-md text-xs space-y-1">
                    <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                      Student Notes / Comments
                    </span>
                    <p className="text-ink leading-relaxed whitespace-pre-wrap">
                      {currentItem.comment}
                    </p>
                  </div>
                )}

                {/* Revision History Accordion */}
                {currentItem.history && currentItem.history.length > 0 && (
                  <div className="border border-line rounded-md p-3 text-xs bg-surface/30">
                    <button
                      type="button"
                      onClick={() => setShowHistory(!showHistory)}
                      className="w-full flex items-center justify-between text-ink font-semibold"
                    >
                      <span className="flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-ink-muted" />
                        Previous Revisions ({currentItem.history.length})
                      </span>
                      <span className="text-ink-muted text-[11px]">
                        {showHistory ? 'Collapse' : 'Expand'}
                      </span>
                    </button>

                    {showHistory && (
                      <div className="mt-3 space-y-2 border-t border-line pt-2 divide-y divide-line/60">
                        {currentItem.history.map((rev, idx) => (
                          <div key={idx} className="pt-2 flex items-center justify-between gap-2 text-ink-muted">
                            <div>
                              <span className="font-mono font-medium text-ink">v{rev.version}</span> •{' '}
                              <span>{formatPKTDateTime(rev.submittedAt)} PKT</span>
                              {rev.comment && <p className="text-[11px] text-ink italic mt-0.5">"{rev.comment}"</p>}
                            </div>
                            {rev.link && (
                              <a
                                href={rev.link}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline text-[11px] flex items-center gap-1"
                              >
                                View Link <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Rubric Criteria Evaluation */}
                {assignment?.rubric && assignment.rubric.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                        Grading Rubric
                      </h4>
                      <span className="text-xs text-ink-muted">
                        Scoring automatically sums to raw marks.
                      </span>
                    </div>

                    <div className="border border-line rounded-md divide-y divide-line overflow-hidden bg-surface/30">
                      {assignment.rubric.map((item, idx) => (
                        <div key={idx} className="p-3 flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-xs font-medium text-ink">
                              {item.criterion}
                            </p>
                            <span className="text-[11px] text-ink-muted font-mono">
                              Max: {item.maxMarks} marks
                            </span>
                          </div>
                          <div className="w-24">
                            <Input
                              type="number"
                              size="sm"
                              min="0"
                              max={item.maxMarks}
                              value={rubricScores[item.criterion] ?? ''}
                              onChange={(e) =>
                                handleRubricScoreChange(item.criterion, e.target.value, item.maxMarks)
                              }
                              placeholder="0"
                              className="text-center font-mono text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Score & Late Penalty Summary */}
                <div className="p-4 bg-surface rounded-md border border-line space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                        Total Raw Marks (out of {assignment?.maxMarks || 100})
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max={assignment?.maxMarks || 100}
                          value={gradeMarks}
                          onChange={(e) => setGradeMarks(e.target.value)}
                          placeholder="e.g. 90"
                          className="w-32 font-mono text-base font-semibold"
                        />
                        <span className="font-mono text-sm text-ink-muted">
                          / {assignment?.maxMarks || 100}
                        </span>
                      </div>
                    </div>

                    {/* Late Penalty preview */}
                    {isLate && (
                      <div className="sm:text-right bg-warning/10 border border-warning/30 p-2.5 rounded text-xs">
                        <span className="font-semibold text-warning block">
                          Late Submission Penalty ({penaltyPercent}%)
                        </span>
                        <span className="font-mono text-ink">
                          Deduction: -{latePenaltyApplied} marks
                        </span>
                        <div className="text-xs font-bold text-ink mt-0.5">
                          Final Score: <span className="font-mono text-sm">{finalMarksPreview}</span> / {assignment?.maxMarks}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Feedback Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                    Instructor Feedback & Code Review
                  </label>
                  <Textarea
                    rows={4}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide actionable feedback on architecture, edge cases, and code style..."
                    className="text-xs leading-relaxed"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-line">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSaveGrade('return', false)}
                    disabled={grading}
                    className="text-primary hover:bg-primary/10"
                    icon={RotateCcw}
                  >
                    Return for Revision
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSaveGrade('grade', false)}
                      loading={grading}
                    >
                      Save Grade
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleSaveGrade('grade', true)}
                      loading={grading}
                      icon={CheckSquare}
                    >
                      Save & Next Student
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminGradingSplitPage;
