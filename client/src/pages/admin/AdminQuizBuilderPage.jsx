import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  HelpCircle,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Settings,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  Layers,
  Save,
  Code,
  X,
  FileSpreadsheet,
  BarChart2,
  RefreshCw,
} from 'lucide-react';
import quizService from '../../services/quiz.service';
import parseQuizPlainText from '../../utils/quizParser';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  Input,
  Textarea,
  Select,
  FormField,
  Modal,
  ConfirmDialog,
  Spinner,
  EmptyState,
  Skeleton,
  useToast,
} from '../../components/ui';

export const AdminQuizBuilderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') || 'builder';

  const [activeTab, setActiveTab] = useState(activeTabParam); // 'builder' | 'results'
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Active question index being edited
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);

  // Settings Drawer State
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsData, setSettingsData] = useState({});

  // Bulk Import State
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState('append');
  const [importErrors, setImportErrors] = useState([]);
  const [importing, setImporting] = useState(false);

  // Student Preview State
  const [previewOpen, setPreviewOpen] = useState(false);

  // Results State
  const [resultsData, setResultsData] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      const data = await quizService.getQuizById(id);
      setQuiz(data);
      document.title = `Builder: ${data.title} — Admin Workspace`;
      setSettingsData({
        title: data.title,
        week: data.week,
        instructions: data.instructions || '',
        timeLimitMinutes: data.timeLimitMinutes || '',
        maxAttempts: data.maxAttempts || 1,
        passingPercent: data.passingPercent || 60,
        shuffleQuestions: !!data.shuffleQuestions,
        shuffleOptions: !!data.shuffleOptions,
        showAnswers: data.showAnswers || 'immediately',
        isPublished: !!data.isPublished,
        opensAt: data.opensAt ? new Date(data.opensAt).toISOString().slice(0, 16) : '',
        closesAt: data.closesAt ? new Date(data.closesAt).toISOString().slice(0, 16) : '',
      });
    } catch (err) {
      toast.error(err.message || 'Failed to load quiz details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    setLoadingResults(true);
    try {
      const data = await quizService.getQuizResults(id);
      setResultsData(data);
    } catch (err) {
      toast.error(err.message || 'Failed to load quiz results.');
    } finally {
      setLoadingResults(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'results') {
      fetchResults();
    }
  }, [activeTab, id]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'results' ? { tab: 'results' } : {});
  };

  // Question manipulation
  const currentQuestion = quiz?.questions?.[selectedQuestionIndex] || null;

  const handleAddQuestion = (type = 'single') => {
    const newQ = {
      text: 'New Question',
      code: '',
      type,
      options: type === 'true_false' ? ['True', 'False'] : ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctIndexes: [0],
      explanation: '',
      marks: 1,
    };

    setQuiz((prev) => ({
      ...prev,
      questions: [...(prev.questions || []), newQ],
    }));
    setSelectedQuestionIndex((quiz?.questions?.length || 0));
  };

  const handleDeleteQuestion = (idx) => {
    if (!quiz?.questions || quiz.questions.length <= 1) {
      toast.error('Quiz must contain at least one question.');
      return;
    }
    const updated = quiz.questions.filter((_, i) => i !== idx);
    setQuiz({ ...quiz, questions: updated });
    if (selectedQuestionIndex >= updated.length) {
      setSelectedQuestionIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleMoveQuestion = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= (quiz?.questions?.length || 0)) return;

    const list = [...quiz.questions];
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;

    setQuiz({ ...quiz, questions: list });
    setSelectedQuestionIndex(targetIdx);
  };

  const handleUpdateCurrentQuestion = (field, value) => {
    if (!currentQuestion) return;
    const updatedQuestions = [...quiz.questions];
    updatedQuestions[selectedQuestionIndex] = {
      ...currentQuestion,
      [field]: value,
    };
    setQuiz({ ...quiz, questions: updatedQuestions });
  };

  // Options handling
  const handleOptionTextChange = (optIdx, val) => {
    if (!currentQuestion) return;
    const newOpts = [...currentQuestion.options];
    newOpts[optIdx] = val;
    handleUpdateCurrentQuestion('options', newOpts);
  };

  const handleAddOption = () => {
    if (!currentQuestion) return;
    const newOpts = [...currentQuestion.options, `Option ${currentQuestion.options.length + 1}`];
    handleUpdateCurrentQuestion('options', newOpts);
  };

  const handleRemoveOption = (optIdx) => {
    if (!currentQuestion || currentQuestion.options.length <= 2) {
      toast.error('A question must have at least 2 options.');
      return;
    }
    const newOpts = currentQuestion.options.filter((_, i) => i !== optIdx);
    const newCorrect = (currentQuestion.correctIndexes || [])
      .filter((i) => i !== optIdx)
      .map((i) => (i > optIdx ? i - 1 : i));

    handleUpdateCurrentQuestion('options', newOpts);
    handleUpdateCurrentQuestion(
      'correctIndexes',
      newCorrect.length > 0 ? newCorrect : [0]
    );
  };

  const handleToggleCorrectIndex = (optIdx) => {
    if (!currentQuestion) return;
    if (currentQuestion.type === 'single' || currentQuestion.type === 'true_false') {
      handleUpdateCurrentQuestion('correctIndexes', [optIdx]);
    } else {
      // Multiple selection
      const exists = currentQuestion.correctIndexes.includes(optIdx);
      if (exists) {
        if (currentQuestion.correctIndexes.length === 1) {
          toast.error('At least one correct answer must be selected.');
          return;
        }
        handleUpdateCurrentQuestion(
          'correctIndexes',
          currentQuestion.correctIndexes.filter((i) => i !== optIdx)
        );
      } else {
        handleUpdateCurrentQuestion(
          'correctIndexes',
          [...currentQuestion.correctIndexes, optIdx].sort()
        );
      }
    }
  };

  // Save Quiz to server
  const handleSaveQuiz = async () => {
    setSaving(true);
    try {
      await quizService.updateQuiz(id, {
        questions: quiz.questions,
      });
      toast.success('All questions and changes saved to cloud.');
    } catch (err) {
      toast.error(err.message || 'Failed to save quiz questions.');
    } finally {
      setSaving(false);
    }
  };

  // Save Settings Drawer
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: settingsData.title,
        week: Number(settingsData.week),
        instructions: settingsData.instructions,
        timeLimitMinutes: settingsData.timeLimitMinutes ? Number(settingsData.timeLimitMinutes) : null,
        maxAttempts: Number(settingsData.maxAttempts),
        passingPercent: Number(settingsData.passingPercent),
        shuffleQuestions: !!settingsData.shuffleQuestions,
        shuffleOptions: !!settingsData.shuffleOptions,
        showAnswers: settingsData.showAnswers,
        isPublished: !!settingsData.isPublished,
        opensAt: settingsData.opensAt ? new Date(settingsData.opensAt).toISOString() : null,
        closesAt: settingsData.closesAt ? new Date(settingsData.closesAt).toISOString() : null,
      };

      await quizService.updateQuiz(id, payload);
      toast.success('Quiz settings updated.');
      setSettingsOpen(false);
      fetchQuiz();
    } catch (err) {
      toast.error(err.message || 'Failed to update quiz settings.');
    } finally {
      setSaving(false);
    }
  };

  // Bulk Import
  const handleExecuteImport = async () => {
    if (!importText.trim()) {
      toast.error('Please paste question content first.');
      return;
    }

    const check = parseQuizPlainText(importText);
    if (!check.valid) {
      setImportErrors(check.errors);
      toast.error('Please correct formatting errors in your text.');
      return;
    }

    setImporting(true);
    setImportErrors([]);
    try {
      const res = await quizService.importPlainText(id, importText, importMode);
      toast.success(`Imported ${res.importedCount} questions successfully.`);
      setImportOpen(false);
      setImportText('');
      fetchQuiz();
    } catch (err) {
      if (err.errors) {
        setImportErrors(err.errors);
      }
      toast.error(err.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const totalMarks = (quiz?.questions || []).reduce((acc, q) => acc + (q.marks || 1), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={quiz?.title || 'Quiz Builder'}
        description={`Week ${quiz?.week} &bull; ${quiz?.questions?.length || 0} Questions &bull; ${totalMarks} Total Marks`}
        breadcrumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Quizzes', to: '/admin/tasks' },
          { label: quiz?.title || 'Builder' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={Settings}
              onClick={() => setSettingsOpen(true)}
            >
              Settings
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={FileText}
              onClick={() => {
                setImportText('');
                setImportErrors([]);
                setImportOpen(true);
              }}
            >
              Paste Import
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={Eye}
              onClick={() => setPreviewOpen(true)}
            >
              Preview
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Save}
              isLoading={saving}
              onClick={handleSaveQuiz}
            >
              Save Changes
            </Button>
          </div>
        }
      />

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-line text-xs font-medium">
        <button
          type="button"
          onClick={() => handleTabSwitch('builder')}
          className={`px-4 py-2.5 border-b-2 -mb-[1px] transition-colors flex items-center gap-2 ${
            activeTab === 'builder'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Question Builder</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSwitch('results')}
          className={`px-4 py-2.5 border-b-2 -mb-[1px] transition-colors flex items-center gap-2 ${
            activeTab === 'results'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Results & Analytics</span>
        </button>
      </div>

      {/* TAB 1: BUILDER VIEW */}
      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Questions List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Questions ({quiz?.questions?.length || 0})
              </span>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={Plus}
                onClick={() => handleAddQuestion('single')}
              >
                Add Question
              </Button>
            </div>

            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
              {quiz?.questions?.map((q, idx) => {
                const isSelected = idx === selectedQuestionIndex;
                return (
                  <div
                    key={q._id || idx}
                    onClick={() => setSelectedQuestionIndex(idx)}
                    className={`p-3 rounded border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary-soft/20 ring-1 ring-primary'
                        : 'border-line bg-surface hover:bg-surface-alt/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-ink">Q{idx + 1}</span>
                        <Badge variant="neutral" className="text-[10px]">
                          {q.type === 'single' ? 'Single' : q.type === 'multiple' ? 'Multiple' : 'T/F'}
                        </Badge>
                        <span className="text-ink-muted text-[10px]">({q.marks || 1} mark)</span>
                      </div>

                      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveQuestion(idx, -1)}
                          className="p-1 text-ink-muted hover:text-ink disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === quiz.questions.length - 1}
                          onClick={() => handleMoveQuestion(idx, 1)}
                          className="p-1 text-ink-muted hover:text-ink disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(idx)}
                          className="p-1 text-danger hover:text-danger/80 ml-1"
                          title="Delete Question"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p className="text-ink line-clamp-2 leading-relaxed">
                      {q.text || 'Untitled Question'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Question Editor (8 cols) */}
          <div className="lg:col-span-8">
            {currentQuestion ? (
              <Card className="border border-line">
                <CardHeader
                  title={`Editing Question ${selectedQuestionIndex + 1}`}
                  subtitle="Configure question prompt, optional code snippet, answer choices, and explanation."
                />
                <CardContent className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Question Type">
                      <Select
                        value={currentQuestion.type}
                        onChange={(e) => {
                          const newType = e.target.value;
                          handleUpdateCurrentQuestion('type', newType);
                          if (newType === 'true_false') {
                            handleUpdateCurrentQuestion('options', ['True', 'False']);
                            handleUpdateCurrentQuestion('correctIndexes', [0]);
                          }
                        }}
                      >
                        <option value="single">Single Choice (Radio)</option>
                        <option value="multiple">Multiple Choice (Checkboxes)</option>
                        <option value="true_false">True / False</option>
                      </Select>
                    </FormField>

                    <FormField label="Marks / Weight">
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={currentQuestion.marks}
                        onChange={(e) =>
                          handleUpdateCurrentQuestion('marks', Math.max(1, Number(e.target.value)))
                        }
                      />
                    </FormField>
                  </div>

                  <FormField label="Question Prompt" required>
                    <Textarea
                      rows={3}
                      value={currentQuestion.text}
                      onChange={(e) => handleUpdateCurrentQuestion('text', e.target.value)}
                      placeholder="e.g. Which of the following describes the Check phase in libuv?"
                    />
                  </FormField>

                  <FormField label="Code Snippet (Optional)" helperText="Displayed in a formatted monospace block for code questions">
                    <Textarea
                      rows={3}
                      className="font-mono text-xs"
                      value={currentQuestion.code || ''}
                      onChange={(e) => handleUpdateCurrentQuestion('code', e.target.value)}
                      placeholder="const fs = require('fs');&#10;fs.readFile('data.txt', () => { ... });"
                    />
                  </FormField>

                  {/* Options List */}
                  <div className="space-y-2 pt-2 border-t border-line">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink uppercase tracking-wider text-[11px]">
                        Answer Options & Correct Answer Key
                      </span>
                      {currentQuestion.type !== 'true_false' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={Plus}
                          onClick={handleAddOption}
                        >
                          Add Option
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {currentQuestion.options?.map((opt, optIdx) => {
                        const isCorrect = currentQuestion.correctIndexes?.includes(optIdx);
                        const letter = String.fromCharCode(65 + optIdx); // A, B, C...

                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded border flex items-center gap-3 transition-colors ${
                              isCorrect ? 'border-success bg-success-soft/30' : 'border-line bg-surface'
                            }`}
                          >
                            {/* Radio / Checkbox for correct answer */}
                            <button
                              type="button"
                              onClick={() => handleToggleCorrectIndex(optIdx)}
                              className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors ${
                                isCorrect
                                  ? 'bg-success text-surface'
                                  : 'border border-line text-ink-muted hover:border-ink hover:text-ink'
                              }`}
                              title={isCorrect ? 'Marked Correct' : 'Click to Mark Correct'}
                            >
                              {letter}
                            </button>

                            <Input
                              value={opt}
                              onChange={(e) => handleOptionTextChange(optIdx, e.target.value)}
                              placeholder={`Option ${letter} text`}
                              className="flex-1"
                              disabled={currentQuestion.type === 'true_false'}
                            />

                            {currentQuestion.type !== 'true_false' && currentQuestion.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(optIdx)}
                                className="text-ink-muted hover:text-danger p-1"
                                title="Remove Option"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explanation */}
                  <FormField
                    label="Answer Explanation (Optional)"
                    helperText="Shown to students during answer review (based on your release policy)"
                  >
                    <Textarea
                      rows={2}
                      value={currentQuestion.explanation || ''}
                      onChange={(e) => handleUpdateCurrentQuestion('explanation', e.target.value)}
                      placeholder="e.g. setImmediate() executes in the check phase, before timers in the next loop tick."
                    />
                  </FormField>
                </CardContent>
              </Card>
            ) : (
              <EmptyState
                icon={HelpCircle}
                title="No Question Selected"
                description="Select a question from the left panel or click Add Question to begin."
              />
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RESULTS & ANALYTICS VIEW */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {loadingResults ? (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : resultsData ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="border border-line">
                  <CardContent className="p-4 space-y-1">
                    <span className="text-[11px] text-ink-muted uppercase font-semibold">
                      Total Submissions
                    </span>
                    <p className="font-display font-semibold text-2xl text-ink tabular-nums">
                      {resultsData.summary?.totalSubmissions || 0}
                    </p>
                    <span className="text-[11px] text-ink-muted">
                      Across {resultsData.summary?.uniqueStudents || 0} students
                    </span>
                  </CardContent>
                </Card>

                <Card className="border border-line">
                  <CardContent className="p-4 space-y-1">
                    <span className="text-[11px] text-ink-muted uppercase font-semibold">
                      Average Score
                    </span>
                    <p className="font-display font-semibold text-2xl text-ink tabular-nums">
                      {resultsData.summary?.avgPercent || 0}%
                    </p>
                    <span className="text-[11px] text-ink-muted">Cohort average</span>
                  </CardContent>
                </Card>

                <Card className="border border-line">
                  <CardContent className="p-4 space-y-1">
                    <span className="text-[11px] text-ink-muted uppercase font-semibold">
                      Pass Rate
                    </span>
                    <p className="font-display font-semibold text-2xl text-success tabular-nums">
                      {resultsData.summary?.passRate || 0}%
                    </p>
                    <span className="text-[11px] text-ink-muted">
                      {resultsData.summary?.passedCount || 0} passed (&ge; {quiz?.passingPercent}%)
                    </span>
                  </CardContent>
                </Card>

                <Card className="border border-line flex flex-col justify-between">
                  <CardContent className="p-4 space-y-2">
                    <span className="text-[11px] text-ink-muted uppercase font-semibold">
                      Export Roster
                    </span>
                    <a
                      href={quizService.getExportCSVUrl(id)}
                      download
                      className="block"
                    >
                      <Button variant="secondary" size="sm" className="w-full" leftIcon={Download}>
                        Download CSV
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              </div>

              {/* Per-Question Analytics */}
              <Card className="border border-line">
                <CardHeader
                  title="Per-Question Correct Rate Analytics"
                  subtitle="Identify challenging topics where students struggle or excel."
                />
                <CardContent className="p-0">
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-line bg-surface-alt/50 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                          <th className="py-2.5 px-4">#</th>
                          <th className="py-2.5 px-4">Question Prompt</th>
                          <th className="py-2.5 px-4 text-center">Marks</th>
                          <th className="py-2.5 px-4 text-center">Correct / Answered</th>
                          <th className="py-2.5 px-4 text-right">Correct Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {resultsData.questionAnalytics?.map((qa, i) => (
                          <tr key={qa.questionId} className="hover:bg-surface-alt/40 transition-colors">
                            <td className="py-2.5 px-4 font-mono font-medium">Q{i + 1}</td>
                            <td className="py-2.5 px-4 font-medium text-ink max-w-md truncate">
                              {qa.text}
                            </td>
                            <td className="py-2.5 px-4 text-center">{qa.marks}</td>
                            <td className="py-2.5 px-4 text-center font-mono">
                              {qa.correctCount} / {qa.answeredCount}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <span
                                className={`font-mono font-bold ${
                                  qa.percentCorrect >= 70
                                    ? 'text-success'
                                    : qa.percentCorrect >= 50
                                    ? 'text-warning'
                                    : 'text-danger'
                                }`}
                              >
                                {qa.percentCorrect}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Student Attempts Table */}
              <Card className="border border-line">
                <CardHeader
                  title="Student Attempts & Grade History"
                  subtitle="Detailed submission logs, duration, and score percentages."
                />
                <CardContent className="p-0">
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-line bg-surface-alt/50 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                          <th className="py-2.5 px-4">Student</th>
                          <th className="py-2.5 px-4 text-center">Attempt #</th>
                          <th className="py-2.5 px-4 text-center">Score</th>
                          <th className="py-2.5 px-4 text-center">Percent</th>
                          <th className="py-2.5 px-4 text-center">Result</th>
                          <th className="py-2.5 px-4 text-right">Submitted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {resultsData.attempts?.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-ink-muted">
                              No student submissions recorded for this quiz yet.
                            </td>
                          </tr>
                        ) : (
                          resultsData.attempts?.map((att) => (
                            <tr key={att._id} className="hover:bg-surface-alt/40 transition-colors">
                              <td className="py-2.5 px-4">
                                <span className="font-semibold text-ink block">{att.student?.name}</span>
                                <span className="text-[11px] text-ink-muted">{att.student?.email}</span>
                              </td>
                              <td className="py-2.5 px-4 text-center font-mono">#{att.attemptNumber}</td>
                              <td className="py-2.5 px-4 text-center font-mono font-medium">
                                {att.score} / {att.totalMarks}
                              </td>
                              <td className="py-2.5 px-4 text-center font-mono font-bold">
                                {att.percent}%
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                {att.passed ? (
                                  <Badge variant="success">Passed</Badge>
                                ) : (
                                  <Badge variant="danger">Failed</Badge>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-right text-ink-muted font-mono text-[11px]">
                                {att.submittedAt
                                  ? new Date(att.submittedAt).toLocaleDateString('en-PK', {
                                      timeZone: 'Asia/Karachi',
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : 'In Progress'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <EmptyState
              icon={BarChart2}
              title="No Results Available"
              description="Student attempts and answer statistics will appear here after submissions."
            />
          )}
        </div>
      )}

      {/* SETTINGS DRAWER / MODAL */}
      <Modal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Quiz Settings & Access Control"
        size="lg"
      >
        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Curriculum Week" required>
              <Input
                type="number"
                min="1"
                value={settingsData.week || 1}
                onChange={(e) => setSettingsData({ ...settingsData, week: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Time Limit (Minutes)" helperText="0 or blank for untimed">
              <Input
                type="number"
                min="0"
                step="5"
                value={settingsData.timeLimitMinutes || ''}
                onChange={(e) =>
                  setSettingsData({ ...settingsData, timeLimitMinutes: e.target.value })
                }
              />
            </FormField>
          </div>

          <FormField label="Quiz Title" required>
            <Input
              value={settingsData.title || ''}
              onChange={(e) => setSettingsData({ ...settingsData, title: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Student Instructions">
            <Textarea
              rows={2}
              value={settingsData.instructions || ''}
              onChange={(e) => setSettingsData({ ...settingsData, instructions: e.target.value })}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Max Attempts" required>
              <Input
                type="number"
                min="1"
                max="10"
                value={settingsData.maxAttempts || 1}
                onChange={(e) => setSettingsData({ ...settingsData, maxAttempts: e.target.value })}
                required
              />
            </FormField>

            <FormField label="Passing Score (%)" required>
              <Input
                type="number"
                min="0"
                max="100"
                value={settingsData.passingPercent || 60}
                onChange={(e) =>
                  setSettingsData({ ...settingsData, passingPercent: e.target.value })
                }
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Opens At (PKT)" helperText="Leave empty for immediately open">
              <Input
                type="datetime-local"
                value={settingsData.opensAt || ''}
                onChange={(e) => setSettingsData({ ...settingsData, opensAt: e.target.value })}
              />
            </FormField>

            <FormField label="Closes At (PKT)" helperText="Leave empty for no deadline">
              <Input
                type="datetime-local"
                value={settingsData.closesAt || ''}
                onChange={(e) => setSettingsData({ ...settingsData, closesAt: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Release Correct Answers & Explanations">
            <Select
              value={settingsData.showAnswers || 'immediately'}
              onChange={(e) => setSettingsData({ ...settingsData, showAnswers: e.target.value })}
            >
              <option value="immediately">Immediately after submission</option>
              <option value="after_close">Only after quiz deadline closes</option>
              <option value="never">Never (Scores only)</option>
            </Select>
          </FormField>

          <div className="p-3 bg-surface-alt rounded space-y-2 border border-line">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!settingsData.shuffleQuestions}
                onChange={(e) =>
                  setSettingsData({ ...settingsData, shuffleQuestions: e.target.checked })
                }
                className="rounded border-line text-primary focus:ring-primary"
              />
              <span className="text-ink font-medium">Shuffle Question Order for each student</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!settingsData.shuffleOptions}
                onChange={(e) =>
                  setSettingsData({ ...settingsData, shuffleOptions: e.target.checked })
                }
                className="rounded border-line text-primary focus:ring-primary"
              />
              <span className="text-ink font-medium">Shuffle Answer Options order</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!settingsData.isPublished}
                onChange={(e) =>
                  setSettingsData({ ...settingsData, isPublished: e.target.checked })
                }
                className="rounded border-line text-primary focus:ring-primary"
              />
              <span className="text-ink font-medium">Published (Visible to enrolled students)</span>
            </label>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-line">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setSettingsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={saving}
            >
              Save Settings
            </Button>
          </div>
        </form>
      </Modal>

      {/* BULK TEXT IMPORT MODAL */}
      <Modal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title="Paste Plain Text Question Import"
        size="lg"
      >
        <div className="space-y-4 text-xs">
          <p className="text-ink-muted leading-relaxed">
            Paste formatted questions. The parser supports single-line or multi-line options, multiple answers, and explanations.
          </p>

          <div className="p-3 bg-surface-alt border border-line rounded font-mono text-[11px] space-y-0.5">
            <span className="text-ink-muted font-bold block mb-1">Expected Format:</span>
            <p className="text-ink">Q: Which hook manages state in React?</p>
            <p className="text-ink">A) useEffect  B) useState  C) useRef  D) useMemo</p>
            <p className="text-ink">Answer: B</p>
            <p className="text-ink">Explain: useState stores state between renders.</p>
          </div>

          <FormField label="Pasted Question Content" required>
            <Textarea
              rows={8}
              className="font-mono text-xs"
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                setImportErrors([]);
              }}
              placeholder="Paste questions here..."
            />
          </FormField>

          {importErrors.length > 0 && (
            <div className="p-3 bg-danger-soft border border-danger/30 rounded space-y-1">
              <span className="font-semibold text-danger block">
                Found {importErrors.length} formatting error(s):
              </span>
              <ul className="list-disc pl-4 space-y-0.5 text-danger">
                {importErrors.map((err, idx) => (
                  <li key={idx}>
                    Line {err.line}: {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-4">
            <label className="text-xs font-semibold text-ink">Import Action:</label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="importMode"
                value="append"
                checked={importMode === 'append'}
                onChange={() => setImportMode('append')}
              />
              <span>Append to existing questions</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="importMode"
                value="replace"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
              />
              <span className="text-danger">Replace all existing questions</span>
            </label>
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-line">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setImportOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              isLoading={importing}
              onClick={handleExecuteImport}
              disabled={!importText.trim()}
            >
              Import Questions
            </Button>
          </div>
        </div>
      </Modal>

      {/* STUDENT PREVIEW MODAL */}
      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Student Preview: ${quiz?.title || ''}`}
        size="lg"
      >
        <div className="space-y-6 text-xs max-h-[550px] overflow-y-auto pr-2">
          <div className="p-3 bg-surface-alt rounded flex items-center justify-between text-ink-muted">
            <span>Time Limit: {quiz?.timeLimitMinutes ? `${quiz.timeLimitMinutes} minutes` : 'Untimed'}</span>
            <span>Total Marks: {totalMarks}</span>
            <span>Passing: {quiz?.passingPercent}%</span>
          </div>

          {quiz?.questions?.map((q, idx) => (
            <div key={idx} className="p-4 rounded border border-line bg-surface space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-ink">Question {idx + 1} of {quiz.questions.length}</span>
                <span className="text-ink-muted">({q.marks || 1} mark)</span>
              </div>

              <p className="font-medium text-ink leading-relaxed">{q.text}</p>

              {q.code && (
                <pre className="p-3 rounded bg-ink text-surface font-mono text-[11px] overflow-x-auto">
                  {q.code}
                </pre>
              )}

              <div className="space-y-1.5 pt-1">
                {q.options?.map((opt, oIdx) => (
                  <div
                    key={oIdx}
                    className="p-2.5 rounded border border-line bg-surface flex items-center gap-3"
                  >
                    <span className="w-5 h-5 rounded-full border border-line-strong flex items-center justify-center font-mono text-[11px] font-bold text-ink-muted">
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="text-ink">{opt}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default AdminQuizBuilderPage;
