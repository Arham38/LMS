import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Flag,
  ArrowLeft,
  ArrowRight,
  Send,
  HelpCircle,
  Check,
  X,
  FileText,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Wordmark } from '../../config/brand';
import quizService from '../../services/quiz.service';
import {
  Button,
  Badge,
  Modal,
  ProgressBar,
  Spinner,
  Skeleton,
  useToast,
} from '../../components/ui';

export const StudentQuizPage = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Attempt Data
  const [attemptId, setAttemptId] = useState(null);
  const [deadlineAt, setDeadlineAt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [passingPercent, setPassingPercent] = useState(60);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Student Answers & Flags: Map questionId -> array of selectedIndexes
  const [answersMap, setAnswersMap] = useState({});
  const [flaggedSet, setFlaggedSet] = useState(new Set());

  // Autosave status
  const [savingStatus, setSavingStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'

  // Submit Modal
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Results State
  const [quizResult, setQuizResult] = useState(null);

  // Clock for Server Deadline Countdown
  const [secondsRemaining, setSecondsRemaining] = useState(null);

  // Start or resume attempt on mount
  useEffect(() => {
    const initializeQuiz = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await quizService.startQuizAttempt(quizId);
        setAttemptId(res.attemptId);
        setDeadlineAt(res.deadlineAt ? new Date(res.deadlineAt) : null);
        setQuestions(res.questions || []);
        setPassingPercent(res.passingPercent || 60);

        // Populate initial saved answers if resuming
        const initialMap = {};
        (res.savedAnswers || []).forEach((item) => {
          initialMap[item.questionId] = item.selectedIndexes || [];
        });
        setAnswersMap(initialMap);
      } catch (err) {
        setError(err.message || 'Unable to start quiz attempt.');
      } finally {
        setLoading(false);
      }
    };

    initializeQuiz();
  }, [quizId]);

  // Countdown Timer based on server deadline
  useEffect(() => {
    if (!deadlineAt || quizResult) return;

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((deadlineAt.getTime() - now) / 1000));
      setSecondsRemaining(diff);

      // Auto-submit when time expires
      if (diff === 0 && !submitting && !quizResult) {
        handleAutoSubmit();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [deadlineAt, quizResult, submitting]);

  const handleAutoSubmit = async () => {
    if (submitting || quizResult) return;
    setSubmitting(true);
    toast.error('Time limit has expired! Finalizing and grading your attempt...');
    try {
      const formattedAnswers = Object.entries(answersMap).map(([qId, idxs]) => ({
        questionId: qId,
        selectedIndexes: idxs,
      }));
      const res = await quizService.submitQuizAttempt(attemptId, formattedAnswers);
      setQuizResult(res);
    } catch (err) {
      toast.error(err.message || 'Auto-submit failed.');
    } finally {
      setSubmitting(false);
      setSubmitModalOpen(false);
    }
  };

  // Autosave answers to server debounced
  const autosaveTimeoutRef = useRef(null);
  const triggerAutosave = (updatedAnswers) => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    setSavingStatus('saving');
    autosaveTimeoutRef.current = setTimeout(async () => {
      try {
        const formatted = Object.entries(updatedAnswers).map(([qId, idxs]) => ({
          questionId: qId,
          selectedIndexes: idxs,
        }));
        const res = await quizService.saveAttemptAnswers(attemptId, formatted);
        if (res.status === 'auto_submitted') {
          // Deadline expired on server during autosave
          toast.error('Time expired on server.');
          window.location.reload();
          return;
        }
        setSavingStatus('saved');
        setTimeout(() => setSavingStatus('idle'), 2000);
      } catch {
        setSavingStatus('idle');
      }
    }, 600);
  };

  // Answer selection handler
  const handleSelectOption = (questionId, optIdx, type) => {
    if (quizResult) return;

    setAnswersMap((prev) => {
      const current = prev[questionId] || [];
      let updated = [];

      if (type === 'multiple') {
        if (current.includes(optIdx)) {
          updated = current.filter((i) => i !== optIdx);
        } else {
          updated = [...current, optIdx].sort();
        }
      } else {
        // Single choice or True/False
        updated = [optIdx];
      }

      const nextState = { ...prev, [questionId]: updated };
      triggerAutosave(nextState);
      return nextState;
    });
  };

  // Toggle flag for question review
  const handleToggleFlag = (qId) => {
    setFlaggedSet((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  };

  // Final Submit Handler
  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answersMap).map(([qId, idxs]) => ({
        questionId: qId,
        selectedIndexes: idxs,
      }));
      const res = await quizService.submitQuizAttempt(attemptId, formattedAnswers);
      setQuizResult(res);
      toast.success('Quiz submitted and graded.');
    } catch (err) {
      toast.error(err.message || 'Failed to submit quiz.');
    } finally {
      setSubmitting(false);
      setSubmitModalOpen(false);
    }
  };

  // Format timer MM:SS
  const formatTimer = (totalSeconds) => {
    if (totalSeconds === null) return '--:--';
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentQ = questions[currentQuestionIndex] || null;
  const answeredCount = Object.values(answersMap).filter((idxs) => idxs.length > 0).length;
  const unansweredCount = Math.max(0, questions.length - answeredCount);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-4">
          <Skeleton className="h-8 w-40 mx-auto" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-surface p-8 rounded border border-line space-y-4 shadow-sm">
          <AlertCircle className="w-10 h-10 text-danger mx-auto" />
          <h2 className="font-display font-semibold text-lg text-ink">Cannot Take Quiz</h2>
          <p className="text-xs text-ink-muted leading-relaxed">{error}</p>
          <Button variant="primary" size="md" onClick={() => navigate(-1)}>
            Return to Course Space
          </Button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RESULTS SCREEN (AFTER SUBMISSION)
  // ==========================================
  if (quizResult) {
    const passed = quizResult.passed;
    const review = quizResult.review;

    return (
      <div className="min-h-screen bg-paper py-10 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-line">
            <Wordmark textSize="text-base" markSize="w-2 h-2" />
            <Button
              variant="secondary"
              size="sm"
              leftIcon={ArrowLeft}
              onClick={() => navigate(-1)}
            >
              Back to Course
            </Button>
          </div>

          {/* Score Card */}
          <div className="bg-surface border border-line rounded p-8 text-center space-y-4 shadow-sm">
            <div
              className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${
                passed ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
              }`}
            >
              {passed ? (
                <CheckCircle2 className="w-8 h-8 stroke-[1.5]" />
              ) : (
                <AlertCircle className="w-8 h-8 stroke-[1.5]" />
              )}
            </div>

            <div className="space-y-1">
              <Badge variant={passed ? 'success' : 'danger'} dot>
                {passed ? 'Passed Assessment' : 'Needs Improvement'}
              </Badge>
              <h1 className="font-display font-semibold text-2xl text-ink">
                {passed ? 'Congratulations!' : 'Attempt Completed'}
              </h1>
              <p className="text-xs text-ink-muted">
                Passing requirement: {quizResult.passingPercent}% &bull; Your performance is recorded below.
              </p>
            </div>

            <div className="p-4 bg-surface-alt rounded max-w-sm mx-auto grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-ink-muted block text-[11px]">Score Earned</span>
                <span className="font-display font-bold text-xl text-ink">
                  {quizResult.score} / {quizResult.totalMarks}
                </span>
              </div>
              <div>
                <span className="text-ink-muted block text-[11px]">Percentage</span>
                <span
                  className={`font-display font-bold text-xl ${
                    passed ? 'text-success' : 'text-danger'
                  }`}
                >
                  {quizResult.percent}%
                </span>
              </div>
            </div>
          </div>

          {/* Review Details if allowed */}
          {review && review.canShowAnswers ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-base text-ink">
                  Detailed Answer Review
                </h3>
                <span className="text-xs text-ink-muted">
                  {review.questions.filter((q) => q.isCorrect).length} of {review.questions.length} Correct
                </span>
              </div>

              <div className="space-y-4">
                {review.questions?.map((q, idx) => (
                  <div
                    key={q._id}
                    className={`p-5 rounded border bg-surface space-y-3 ${
                      q.isCorrect ? 'border-success/40' : 'border-danger/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-ink">Question {idx + 1}</span>
                        {q.isCorrect ? (
                          <Badge variant="success">Correct (+{q.marks} marks)</Badge>
                        ) : (
                          <Badge variant="danger">Incorrect (0 / {q.marks})</Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-ink-muted uppercase tracking-wider">{q.type}</span>
                    </div>

                    <p className="font-medium text-xs text-ink leading-relaxed">{q.text}</p>

                    {q.code && (
                      <pre className="p-3 bg-ink text-surface font-mono text-[11px] rounded overflow-x-auto">
                        {q.code}
                      </pre>
                    )}

                    <div className="space-y-1.5 pt-1 text-xs">
                      {q.options?.map((opt, oIdx) => {
                        const isSelectedByStudent = q.studentSelected?.includes(oIdx);
                        const isCorrectOption = q.correctIndexes?.includes(oIdx);

                        return (
                          <div
                            key={oIdx}
                            className={`p-2.5 rounded border flex items-center justify-between ${
                              isCorrectOption
                                ? 'border-success bg-success-soft/30 text-success font-medium'
                                : isSelectedByStudent
                                ? 'border-danger bg-danger-soft/30 text-danger'
                                : 'border-line text-ink-muted bg-surface'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[11px]">
                                {String.fromCharCode(65 + oIdx)})
                              </span>
                              <span>{opt}</span>
                            </div>

                            {isCorrectOption ? (
                              <span className="text-[11px] font-semibold flex items-center gap-1 text-success">
                                <Check className="w-3.5 h-3.5" />
                                <span>Correct Answer</span>
                              </span>
                            ) : isSelectedByStudent ? (
                              <span className="text-[11px] font-semibold flex items-center gap-1 text-danger">
                                <X className="w-3.5 h-3.5" />
                                <span>Your Answer</span>
                              </span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="p-3 bg-surface-alt rounded border border-line text-xs space-y-1">
                        <span className="font-semibold text-ink block text-[11px]">Instructor Explanation:</span>
                        <p className="text-ink-muted leading-relaxed">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-surface rounded border border-line text-center text-xs text-ink-muted">
              Answer explanations and correct keys are held until the assessment closes.
            </div>
          )}

          <div className="pt-4 text-center">
            <Button variant="primary" size="md" onClick={() => navigate(-1)}>
              Done & Return to Classroom
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ACTIVE QUIZ TAKING LAYOUT (FOCUSED & QUIET)
  // ==========================================
  return (
    <div className="min-h-screen bg-paper flex flex-col justify-between">
      {/* Focused Top Header */}
      <header className="h-16 px-4 sm:px-8 bg-surface border-b border-line flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Wordmark textSize="text-sm" markSize="w-2 h-2" />
          <span className="text-line-strong">/</span>
          <span className="text-xs font-semibold text-ink truncate max-w-xs sm:max-w-md">
            Assessment in Progress
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Autosave status indicator */}
          <span className="hidden sm:inline-block text-[11px] text-ink-muted font-mono">
            {savingStatus === 'saving'
              ? 'Saving answers...'
              : savingStatus === 'saved'
              ? 'Saved to cloud'
              : ''}
          </span>

          {/* Server Countdown Timer */}
          {secondsRemaining !== null && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-mono text-xs font-bold border transition-colors ${
                secondsRemaining < 120
                  ? 'border-danger bg-danger-soft text-danger animate-pulse'
                  : 'border-line bg-surface-alt text-ink'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{formatTimer(secondsRemaining)}</span>
            </div>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => setSubmitModalOpen(true)}
            leftIcon={Send}
          >
            Submit Quiz
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Question Navigator Strip */}
        <div className="p-4 bg-surface border border-line rounded space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            <span>
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span>
              {answeredCount} Answered &bull; {unansweredCount} Left
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentQuestionIndex;
              const hasAnswer = (answersMap[q._id] || []).length > 0;
              const isFlagged = flaggedSet.has(q._id);

              return (
                <button
                  key={q._id}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-8 h-8 rounded text-xs font-mono font-semibold flex items-center justify-center transition-all relative ${
                    isCurrent
                      ? 'ring-2 ring-primary ring-offset-1 bg-primary text-surface font-bold'
                      : isFlagged
                      ? 'bg-warning-soft text-warning border border-warning/40'
                      : hasAnswer
                      ? 'bg-primary-soft text-primary border border-primary/30'
                      : 'bg-surface border border-line text-ink-muted hover:border-ink hover:text-ink'
                  }`}
                  title={`Question ${idx + 1}${isFlagged ? ' (Flagged)' : ''}`}
                >
                  {idx + 1}
                  {isFlagged && (
                    <span className="w-1.5 h-1.5 rounded-full bg-warning absolute top-1 right-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Card */}
        {currentQ && (
          <div className="p-6 bg-surface border border-line rounded space-y-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-ink">
                  Question {currentQuestionIndex + 1}
                </span>
                <span className="text-[11px] text-ink-muted">
                  ({currentQ.marks || 1} mark{currentQ.marks === 1 ? '' : 's'})
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleToggleFlag(currentQ._id)}
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded transition-colors ${
                  flaggedSet.has(currentQ._id)
                    ? 'bg-warning-soft text-warning font-semibold'
                    : 'text-ink-muted hover:text-ink hover:bg-surface-alt'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{flaggedSet.has(currentQ._id) ? 'Flagged' : 'Flag for review'}</span>
              </button>
            </div>

            {/* Prompt */}
            <p className="font-display font-medium text-base text-ink leading-relaxed">
              {currentQ.text}
            </p>

            {/* Code Snippet if present */}
            {currentQ.code && (
              <pre className="p-4 bg-ink text-surface font-mono text-xs rounded leading-relaxed overflow-x-auto">
                {currentQ.code}
              </pre>
            )}

            {/* Options list */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] uppercase font-semibold text-ink-muted tracking-wider block mb-1">
                {currentQ.type === 'multiple'
                  ? 'Select all options that apply (Checkboxes):'
                  : 'Select one option:'}
              </span>

              {currentQ.options?.map((opt, oIdx) => {
                const isSelected = (answersMap[currentQ._id] || []).includes(oIdx);
                const letter = String.fromCharCode(65 + oIdx);

                return (
                  <div
                    key={oIdx}
                    onClick={() => handleSelectOption(currentQ._id, oIdx, currentQ.type)}
                    className={`p-3.5 rounded border text-xs cursor-pointer flex items-center gap-3.5 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary-soft/30 ring-1 ring-primary'
                        : 'border-line bg-surface hover:bg-surface-alt/50'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-primary text-surface'
                          : 'border border-line text-ink-muted'
                      }`}
                    >
                      {letter}
                    </span>

                    <span className="text-ink leading-relaxed flex-1 select-none font-medium">
                      {opt}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Navigation Controls */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            size="md"
            leftIcon={ArrowLeft}
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
          >
            Previous
          </Button>

          {currentQuestionIndex < questions.length - 1 ? (
            <Button
              variant="secondary"
              size="md"
              rightIcon={ArrowRight}
              onClick={() =>
                setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))
              }
            >
              Next Question
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              leftIcon={Send}
              onClick={() => setSubmitModalOpen(true)}
            >
              Review & Submit
            </Button>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-ink-muted border-t border-line bg-surface">
        <span>CodeCraft Academy &bull; Answers autosave continuously</span>
      </footer>

      {/* SUBMISSION CONFIRMATION MODAL */}
      <Modal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        title="Ready to Submit Your Quiz?"
        size="md"
      >
        <div className="space-y-4 text-xs">
          {unansweredCount > 0 ? (
            <div className="p-3 bg-warning-soft border border-warning/30 rounded flex items-start gap-2.5 text-warning">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Attention: Unanswered Questions</span>
                <span>
                  You have <strong className="text-ink">{unansweredCount}</strong> unanswered question(s) out of {questions.length}. Any unselected answers will receive 0 marks.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-success-soft border border-success/30 rounded flex items-center gap-2.5 text-success">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Great job! All {questions.length} questions have been answered.</span>
            </div>
          )}

          <p className="text-ink-muted leading-relaxed">
            Once submitted, your responses will be locked and automatically graded on the server.
          </p>

          <div className="pt-3 flex items-center justify-between border-t border-line">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSubmitModalOpen(false)}
            >
              Keep Answering
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={submitting}
              onClick={handleConfirmSubmit}
            >
              Confirm & Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StudentQuizPage;
