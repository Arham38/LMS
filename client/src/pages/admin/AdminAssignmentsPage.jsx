import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  FileText,
  Plus,
  Clock,
  Calendar,
  Layers,
  Edit,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  CheckSquare,
  ExternalLink,
  RefreshCw,
  Sliders,
  ChevronRight,
  Sparkles,
  Link2,
  FileCode,
} from 'lucide-react';
import courseService from '../../services/course.service';
import assignmentService from '../../services/assignment.service';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  Select,
  Modal,
  ConfirmDialog,
  FormField,
  Input,
  Textarea,
  EmptyState,
  Skeleton,
  useToast,
} from '../../components/ui';

export const AdminAssignmentsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCourseId = searchParams.get('courseId') || '';

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);
  const [assignments, setAssignments] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Create / Edit Modal State
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    week: 1,
    description: '',
    dueAt: '',
    maxMarks: 100,
    submissionType: 'either',
    allowLate: true,
    latePenaltyPercent: 10,
    allowResubmit: true,
    isPublished: true,
    rubric: [
      { criterion: 'Architecture & Implementation', maxMarks: 40 },
      { criterion: 'Code Quality & Error Handling', maxMarks: 30 },
      { criterion: 'Documentation & Test Cases', maxMarks: 30 },
    ],
  });

  // Delete State
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Courses
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true);
      try {
        const res = await courseService.getAdminCourses({ limit: 100 });
        const items = res.items || [];
        setCourses(items);

        if (!selectedCourseId && items.length > 0) {
          setSelectedCourseId(items[0]._id);
        }
      } catch (err) {
        toast.error(err.message || 'Failed to load courses.');
      } finally {
        setLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  // Fetch Assignments when selected course changes
  const fetchAssignments = async () => {
    if (!selectedCourseId) return;
    setLoadingAssignments(true);
    try {
      const res = await assignmentService.getAdminAssignments(selectedCourseId);
      setAssignments(res.items || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load assignments.');
      setAssignments([]);
    } finally {
      setLoadingAssignments(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      setSearchParams({ courseId: selectedCourseId });
      fetchAssignments();
    }
  }, [selectedCourseId]);

  const handleOpenCreateModal = () => {
    // Default deadline to 7 days from now at 11:59 PM
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const dateStr = nextWeek.toISOString().slice(0, 16);

    setEditingAssignment(null);
    setFormData({
      title: '',
      week: assignments.length > 0 ? Math.max(...assignments.map((a) => a.week || 1)) + 1 : 1,
      description: '### Homework Requirements\n\n1. Build the RESTful API endpoints.\n2. Ensure all tests pass.\n3. Include a detailed README in your repository.',
      dueAt: dateStr,
      maxMarks: 100,
      submissionType: 'either',
      allowLate: true,
      latePenaltyPercent: 10,
      allowResubmit: true,
      isPublished: true,
      rubric: [
        { criterion: 'Core Functionality & API Routes', maxMarks: 40 },
        { criterion: 'Database Schema & Indexes', maxMarks: 30 },
        { criterion: 'Code Quality & Error Handling', maxMarks: 30 },
      ],
    });
    setAssignmentModalOpen(true);
  };

  const handleOpenEditModal = (assignment) => {
    setEditingAssignment(assignment);
    const dateStr = assignment.dueAt ? new Date(assignment.dueAt).toISOString().slice(0, 16) : '';
    setFormData({
      title: assignment.title || '',
      week: assignment.week || 1,
      description: assignment.description || '',
      dueAt: dateStr,
      maxMarks: assignment.maxMarks || 100,
      submissionType: assignment.submissionType || 'either',
      allowLate: Boolean(assignment.allowLate),
      latePenaltyPercent: assignment.latePenaltyPercent ?? 10,
      allowResubmit: Boolean(assignment.allowResubmit),
      isPublished: Boolean(assignment.isPublished),
      rubric: assignment.rubric && assignment.rubric.length > 0
        ? assignment.rubric.map((r) => ({ _id: r._id, criterion: r.criterion, maxMarks: r.maxMarks }))
        : [],
    });
    setAssignmentModalOpen(true);
  };

  const handleRubricChange = (index, field, value) => {
    const updated = [...formData.rubric];
    updated[index] = { ...updated[index], [field]: field === 'maxMarks' ? Number(value) || 0 : value };
    setFormData({ ...formData, rubric: updated });
  };

  const handleAddRubricCriterion = () => {
    setFormData({
      ...formData,
      rubric: [...formData.rubric, { criterion: '', maxMarks: 20 }],
    });
  };

  const handleRemoveRubricCriterion = (index) => {
    const updated = formData.rubric.filter((_, i) => i !== index);
    setFormData({ ...formData, rubric: updated });
  };

  const totalRubricMarks = formData.rubric.reduce((sum, item) => sum + (Number(item.maxMarks) || 0), 0);

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Assignment title is required.');
      return;
    }
    if (!formData.dueAt) {
      toast.error('Due date is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        dueAt: new Date(formData.dueAt).toISOString(),
        maxMarks: Number(formData.maxMarks),
        week: Number(formData.week),
        latePenaltyPercent: Number(formData.latePenaltyPercent),
      };

      if (editingAssignment) {
        await assignmentService.updateAssignment(editingAssignment._id, payload);
        toast.success('Assignment updated successfully.');
      } else {
        await assignmentService.createAssignment(selectedCourseId, payload);
        toast.success('Assignment created successfully.');
      }

      setAssignmentModalOpen(false);
      fetchAssignments();
    } catch (err) {
      toast.error(err.message || 'Failed to save assignment.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return;
    setDeleting(true);
    try {
      await assignmentService.deleteAssignment(assignmentToDelete._id);
      toast.success('Assignment deleted successfully.');
      setAssignmentToDelete(null);
      fetchAssignments();
    } catch (err) {
      toast.error(err.message || 'Failed to delete assignment.');
    } finally {
      setDeleting(false);
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

  // Metrics summary
  const totalAssignments = assignments.length;
  const totalSubmissions = assignments.reduce((acc, a) => acc + (a.metrics?.totalSubmitted || 0), 0);
  const totalGraded = assignments.reduce((acc, a) => acc + (a.metrics?.gradedCount || 0), 0);
  const pendingGrading = totalSubmissions - totalGraded;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignments & Grading"
        subtitle="Manage homework tasks, rubrics, late submission policies, and split-screen grading roster."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAssignments}
              disabled={loadingAssignments}
              icon={RefreshCw}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
              disabled={!selectedCourseId}
              icon={Plus}
            >
              New Assignment
            </Button>
          </div>
        }
      />

      {/* Cohort Selector Card */}
      <Card>
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
              Select Bootcamp Cohort
            </label>
            {loadingCourses ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                options={courses.map((c) => ({
                  value: c._id,
                  label: `${c.title} (${c.level || 'All Levels'})`,
                }))}
                className="font-medium text-ink"
              />
            )}
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-line pt-3 md:pt-0 md:pl-6">
            <div>
              <p className="text-xs text-ink-muted">Cohort Enrolled</p>
              <p className="font-mono text-xl font-semibold text-ink">
                {assignments[0]?.totalEnrolled || 0} students
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">To Grade</p>
              <p className="font-mono text-xl font-semibold text-warning">
                {pendingGrading} submissions
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Graded</p>
              <p className="font-mono text-xl font-semibold text-success">
                {totalGraded}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignments List */}
      {loadingAssignments ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
        </div>
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={FileText}
              title="No Assignments Created Yet"
              description="Create the first assignment for this cohort with custom rubrics and submission deadline rules."
              action={
                <Button variant="primary" size="sm" onClick={handleOpenCreateModal} icon={Plus}>
                  Create Assignment
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const metrics = assignment.metrics || {};
            const totalEnrolled = assignment.totalEnrolled || 0;
            const submittedCount = metrics.totalSubmitted || 0;
            const gradedCount = metrics.gradedCount || 0;
            const lateCount = metrics.lateCount || 0;
            const needsGrading = submittedCount - gradedCount;
            const isOverdue = new Date() > new Date(assignment.dueAt);

            return (
              <Card key={assignment._id} className="hover:border-ink/20 transition-all">
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Info */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs font-semibold">
                          Week {assignment.week}
                        </Badge>
                        <h3 className="text-base font-semibold text-ink">
                          {assignment.title}
                        </h3>
                        {!assignment.isPublished && (
                          <Badge variant="muted" className="text-xs">Draft</Badge>
                        )}
                        <Badge
                          variant={assignment.submissionType === 'link' ? 'outline' : 'default'}
                          className="text-xs"
                        >
                          {assignment.submissionType === 'either'
                            ? 'File or Link'
                            : assignment.submissionType === 'file'
                            ? 'ZIP / PDF File'
                            : 'Repository Link'}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-ink-muted">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-ink-muted" />
                          Due: {formatPKTDateTime(assignment.dueAt)} PKT
                        </span>
                        <span>•</span>
                        <span>Max Marks: <strong className="font-mono text-ink">{assignment.maxMarks}</strong></span>
                        <span>•</span>
                        <span>
                          Rubric: <strong className="font-mono text-ink">{assignment.rubric?.length || 0} criteria</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Late Policy:{' '}
                          <span className={assignment.allowLate ? 'text-ink' : 'text-danger font-medium'}>
                            {assignment.allowLate
                              ? `Allowed (${assignment.latePenaltyPercent}% penalty)`
                              : 'Strictly Closed'}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Middle: Progress / Roster Stats */}
                    <div className="flex items-center gap-4 bg-surface px-4 py-2.5 rounded-md border border-line text-xs">
                      <div>
                        <span className="text-ink-muted block text-[11px]">Submitted</span>
                        <span className="font-mono font-semibold text-ink">
                          {submittedCount} / {totalEnrolled}
                        </span>
                      </div>
                      <div className="w-px h-6 bg-line" />
                      <div>
                        <span className="text-ink-muted block text-[11px]">Graded</span>
                        <span className="font-mono font-semibold text-success">
                          {gradedCount} / {submittedCount}
                        </span>
                      </div>
                      <div className="w-px h-6 bg-line" />
                      <div>
                        <span className="text-ink-muted block text-[11px]">Needs Grading</span>
                        <span className={`font-mono font-semibold ${needsGrading > 0 ? 'text-warning' : 'text-ink-muted'}`}>
                          {needsGrading}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/admin/assignments/${assignment._id}/grade`)}
                        icon={CheckSquare}
                      >
                        Grade Submissions
                      </Button>

                      <a
                        href={assignmentService.getExportCSVUrl(assignment._id)}
                        download
                        className="inline-flex items-center justify-center h-8 px-2.5 text-xs font-medium text-ink bg-surface border border-line rounded hover:bg-surface-hover hover:border-ink/30 transition-colors"
                        title="Export Marks CSV"
                      >
                        <Download className="w-3.5 h-3.5 mr-1 text-ink-muted" />
                        CSV
                      </a>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditModal(assignment)}
                        title="Edit Assignment"
                        icon={Edit}
                      />

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAssignmentToDelete(assignment)}
                        title="Delete Assignment"
                        className="text-danger hover:bg-danger/10"
                        icon={Trash2}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Assignment Modal */}
      <Modal
        isOpen={assignmentModalOpen}
        onClose={() => setAssignmentModalOpen(false)}
        title={editingAssignment ? 'Edit Assignment & Rubric' : 'Create New Cohort Assignment'}
        size="lg"
      >
        <form onSubmit={handleSaveAssignment} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <FormField label="Assignment Title" required>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Build a REST API with Express & Mongoose"
                  required
                />
              </FormField>
            </div>
            <div>
              <FormField label="Curriculum Week" required>
                <Input
                  type="number"
                  min="1"
                  max="52"
                  value={formData.week}
                  onChange={(e) => setFormData({ ...formData, week: e.target.value })}
                  required
                />
              </FormField>
            </div>
          </div>

          <FormField label="Task Description & Instructions (Markdown)" required helperText="Provide requirements, grading expectations, and starter repo links">
            <Textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter markdown description..."
              className="font-mono text-xs"
              required
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Submission Deadline (Local Time)" required helperText="Pakistan Standard Time">
              <Input
                type="datetime-local"
                value={formData.dueAt}
                onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Maximum Total Marks" required>
              <Input
                type="number"
                min="1"
                max="500"
                value={formData.maxMarks}
                onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Allowed Submission Type" required>
              <Select
                value={formData.submissionType}
                onChange={(e) => setFormData({ ...formData, submissionType: e.target.value })}
                options={[
                  { value: 'either', label: 'Either (File or Link)' },
                  { value: 'file', label: 'File Archive (ZIP / PDF)' },
                  { value: 'link', label: 'Project Link (GitHub / Drive)' },
                ]}
              />
            </FormField>
          </div>

          {/* Late Policy & Resubmission Policy */}
          <div className="p-4 bg-surface rounded-md border border-line space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Policy & Moderation Settings
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-ink">
                <input
                  type="checkbox"
                  checked={formData.allowLate}
                  onChange={(e) => setFormData({ ...formData, allowLate: e.target.checked })}
                  className="rounded border-line text-primary focus:ring-0"
                />
                Allow Late Submissions
              </label>

              {formData.allowLate && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-muted">Penalty %:</span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.latePenaltyPercent}
                    onChange={(e) => setFormData({ ...formData, latePenaltyPercent: e.target.value })}
                    className="w-20 text-xs py-1"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer text-xs text-ink">
                <input
                  type="checkbox"
                  checked={formData.allowResubmit}
                  onChange={(e) => setFormData({ ...formData, allowResubmit: e.target.checked })}
                  className="rounded border-line text-primary focus:ring-0"
                />
                Allow Pre-Grade Revisions
              </label>
            </div>

            <div className="pt-2 border-t border-line/60 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-ink">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="rounded border-line text-primary focus:ring-0"
                />
                Publish immediately to student portal
              </label>
            </div>
          </div>

          {/* Rubric Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-ink">Grading Rubric Criteria</h4>
                <p className="text-xs text-ink-muted">
                  Used by instructor during evaluation for structured scoring and automated marks summation.
                </p>
              </div>
              <div className="text-xs font-mono">
                Total Criteria Marks:{' '}
                <strong className={totalRubricMarks === Number(formData.maxMarks) ? 'text-success' : 'text-warning'}>
                  {totalRubricMarks} / {formData.maxMarks}
                </strong>
              </div>
            </div>

            <div className="space-y-2 border border-line rounded-md p-3 bg-surface/50">
              {formData.rubric.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      size="sm"
                      value={item.criterion}
                      onChange={(e) => handleRubricChange(index, 'criterion', e.target.value)}
                      placeholder={`Criterion ${index + 1} (e.g. Route Authentication)`}
                      className="text-xs"
                      required
                    />
                  </div>
                  <div className="w-28">
                    <Input
                      size="sm"
                      type="number"
                      min="1"
                      value={item.maxMarks}
                      onChange={(e) => handleRubricChange(index, 'maxMarks', e.target.value)}
                      placeholder="Marks"
                      className="text-xs font-mono"
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRubricCriterion(index)}
                    disabled={formData.rubric.length <= 1}
                    className="text-danger hover:bg-danger/10 px-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRubricCriterion}
                icon={Plus}
                className="w-full text-xs mt-2"
              >
                Add Rubric Criterion
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAssignmentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={saving}
            >
              {editingAssignment ? 'Save Changes' : 'Create Assignment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(assignmentToDelete)}
        title="Delete Assignment"
        message={`Are you sure you want to permanently delete "${assignmentToDelete?.title}"? All submitted student files and marks associated with this assignment will be removed.`}
        confirmText="Delete Assignment"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleDeleteAssignment}
        onClose={() => setAssignmentToDelete(null)}
      />
    </div>
  );
};

export default AdminAssignmentsPage;
