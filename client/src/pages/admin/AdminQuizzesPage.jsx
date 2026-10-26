import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  HelpCircle,
  Plus,
  Clock,
  Calendar,
  Layers,
  Edit,
  Trash2,
  FileSpreadsheet,
  BarChart2,
  RefreshCw,
  ExternalLink,
  Play,
  CheckCircle2,
} from 'lucide-react';
import courseService from '../../services/course.service';
import quizService from '../../services/quiz.service';
import {
  PageHeader,
  Card,
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

export const AdminQuizzesPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCourseId = searchParams.get('courseId') || '';

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);
  const [quizzes, setQuizzes] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  // Quick Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newQuizData, setNewQuizData] = useState({
    title: '',
    week: 1,
    instructions: '',
    timeLimitMinutes: 15,
    maxAttempts: 1,
    passingPercent: 60,
    showAnswers: 'immediately',
  });

  // Delete State
  const [quizToDelete, setQuizToDelete] = useState(null);
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

  // Fetch Quizzes when selectedCourseId changes
  const fetchQuizzes = async (courseId = selectedCourseId) => {
    if (!courseId) return;
    setLoadingQuizzes(true);
    try {
      const res = await quizService.getAdminQuizzes(courseId);
      setQuizzes(res.items || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load quizzes for this course.');
    } finally {
      setLoadingQuizzes(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchQuizzes(selectedCourseId);
    }
  }, [selectedCourseId]);

  const handleCourseChange = (e) => {
    const id = e.target.value;
    setSelectedCourseId(id);
    setSearchParams(id ? { courseId: id } : {});
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newQuizData.title.trim()) {
      toast.error('Quiz title is required.');
      return;
    }

    setCreating(true);
    try {
      const created = await quizService.createQuiz(selectedCourseId, {
        ...newQuizData,
        week: Number(newQuizData.week),
        timeLimitMinutes: Number(newQuizData.timeLimitMinutes) || null,
        maxAttempts: Number(newQuizData.maxAttempts) || 1,
        passingPercent: Number(newQuizData.passingPercent) || 60,
      });

      toast.success('Quiz created. Opening quiz builder...');
      setCreateModalOpen(false);
      navigate(`/admin/quizzes/${created._id}/builder`);
    } catch (err) {
      toast.error(err.message || 'Failed to create quiz.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!quizToDelete) return;
    setDeleting(true);
    try {
      await quizService.deleteQuiz(quizToDelete._id);
      toast.success('Quiz deleted.');
      setQuizToDelete(null);
      fetchQuizzes(selectedCourseId);
    } catch (err) {
      toast.error(err.message || 'Failed to delete quiz.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quizzes & Auto-Graded Assessments"
        description="Design knowledge checks, configure time limits and attempts, paste plain text questions, and inspect score analytics."
        breadcrumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Quizzes' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={RefreshCw}
              onClick={() => fetchQuizzes()}
              isLoading={loadingQuizzes}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Plus}
              onClick={() => {
                setNewQuizData({
                  title: '',
                  week: quizzes.length > 0 ? quizzes[quizzes.length - 1].week : 1,
                  instructions: '',
                  timeLimitMinutes: 15,
                  maxAttempts: 1,
                  passingPercent: 60,
                  showAnswers: 'immediately',
                });
                setCreateModalOpen(true);
              }}
              disabled={!selectedCourseId}
            >
              New Quiz
            </Button>
          </div>
        }
      />

      {/* Course Filter Bar */}
      <Card className="border border-line">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label htmlFor="course-select-quiz" className="text-xs font-semibold text-ink uppercase tracking-wider shrink-0">
              Select Bootcamp:
            </label>
            <Select
              id="course-select-quiz"
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

          <div className="text-xs text-ink-muted">
            Total Quizzes: <strong className="text-ink font-semibold">{quizzes.length} assessments</strong>
          </div>
        </CardContent>
      </Card>

      {/* Quizzes List */}
      {loadingQuizzes ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : quizzes.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="No quizzes created for this cohort"
          description="Assess student learning with auto-graded single choice, multiple choice, and true/false questions."
          actionText="Create First Quiz"
          onAction={() => setCreateModalOpen(true)}
        />
      ) : (
        <div className="grid gap-4">
          {quizzes.map((quiz) => (
            <Card key={quiz._id} className="border border-line hover:border-line-strong transition-all">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono text-ink-muted font-semibold bg-surface-alt px-2 py-0.5 rounded">
                      Week {quiz.week}
                    </span>
                    {quiz.isPublished ? (
                      <Badge variant="success" dot>Published</Badge>
                    ) : (
                      <Badge variant="neutral">Draft</Badge>
                    )}
                    {quiz.timeLimitMinutes ? (
                      <span className="text-[11px] text-ink-muted flex items-center gap-1">
                        <Clock className="w-3 h-3 text-primary" />
                        <span>{quiz.timeLimitMinutes} mins</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-ink-muted font-mono">Untimed</span>
                    )}
                    <span className="text-[11px] text-ink-muted">&bull;</span>
                    <span className="text-[11px] text-ink-muted">
                      Max Attempts: <strong className="text-ink">{quiz.maxAttempts}</strong>
                    </span>
                  </div>

                  <h3 className="font-display font-semibold text-base text-ink">
                    {quiz.title}
                  </h3>

                  {quiz.instructions && (
                    <p className="text-xs text-ink-muted leading-relaxed line-clamp-1">
                      {quiz.instructions}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted pt-1">
                    <span>
                      Questions: <strong className="text-ink font-semibold">{quiz.questionCount}</strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Total Marks: <strong className="text-ink font-semibold">{quiz.totalMarks}</strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      Pass Mark: <strong className="text-ink font-semibold">{quiz.passingPercent}%</strong>
                    </span>
                    <span>&bull;</span>
                    <span className="text-primary font-medium">
                      Submissions: {quiz.metrics?.totalAttempts || 0} ({quiz.metrics?.studentCount || 0} students)
                    </span>
                    {quiz.metrics?.totalAttempts > 0 && (
                      <>
                        <span>&bull;</span>
                        <span>Avg: <strong className="text-ink font-mono">{quiz.metrics.avgPercent}%</strong></span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-3 md:pt-0 border-t md:border-t-0 border-line justify-end">
                  <Link to={`/admin/quizzes/${quiz._id}/builder?tab=results`}>
                    <Button variant="secondary" size="sm" leftIcon={BarChart2}>
                      Results ({quiz.metrics?.totalAttempts || 0})
                    </Button>
                  </Link>

                  <Link to={`/admin/quizzes/${quiz._id}/builder`}>
                    <Button variant="primary" size="sm" leftIcon={Edit}>
                      Edit Builder
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:text-danger hover:bg-danger-soft/30"
                    onClick={() => setQuizToDelete(quiz)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Quiz Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Quiz Assessment"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Curriculum Week" required>
              <Input
                type="number"
                min="1"
                value={newQuizData.week}
                onChange={(e) => setNewQuizData({ ...newQuizData, week: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Time Limit (Minutes)" helperText="0 or leave blank for untimed">
              <Input
                type="number"
                min="0"
                step="5"
                value={newQuizData.timeLimitMinutes}
                onChange={(e) => setNewQuizData({ ...newQuizData, timeLimitMinutes: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Quiz Title" required helperText="e.g. Node.js Event Loop & Concurrency">
            <Input
              value={newQuizData.title}
              onChange={(e) => setNewQuizData({ ...newQuizData, title: e.target.value })}
              placeholder="e.g. React 18 State Architecture & Hooks"
              required
            />
          </FormField>

          <FormField label="Student Instructions (Optional)">
            <Textarea
              rows={2}
              value={newQuizData.instructions}
              onChange={(e) => setNewQuizData({ ...newQuizData, instructions: e.target.value })}
              placeholder="e.g. Timed assessment. Please review Week 2 lecture notes prior to starting."
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Max Attempts" required>
              <Input
                type="number"
                min="1"
                max="10"
                value={newQuizData.maxAttempts}
                onChange={(e) => setNewQuizData({ ...newQuizData, maxAttempts: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Passing Score (%)" required>
              <Input
                type="number"
                min="0"
                max="100"
                value={newQuizData.passingPercent}
                onChange={(e) => setNewQuizData({ ...newQuizData, passingPercent: e.target.value })}
                required
              />
            </FormField>
          </div>

          <FormField label="Answer Review Release Policy">
            <Select
              value={newQuizData.showAnswers}
              onChange={(e) => setNewQuizData({ ...newQuizData, showAnswers: e.target.value })}
            >
              <option value="immediately">Immediately after submission</option>
              <option value="after_close">Only after quiz deadline closes</option>
              <option value="never">Never (Scores only)</option>
            </Select>
          </FormField>

          <div className="pt-4 flex items-center justify-between border-t border-line">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={creating}
            >
              Create & Open Builder
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!quizToDelete}
        onClose={() => setQuizToDelete(null)}
        title="Delete Quiz"
        message={`Are you sure you want to permanently delete "${quizToDelete?.title}"? All student attempts and grade history will be deleted.`}
        confirmText="Delete Quiz"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default AdminQuizzesPage;
