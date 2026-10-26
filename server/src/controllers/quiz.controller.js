import Quiz from '../models/quiz.model.js';
import QuizAttempt from '../models/quizAttempt.model.js';
import Course from '../models/course.model.js';
import Enrollment from '../models/enrollment.model.js';
import parseQuizPlainText from '../utils/quizParser.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import notificationService from '../services/notification.service.js';

// ==========================================
// ADMIN QUIZ CONTROLLERS
// ==========================================

/**
 * GET /api/admin/courses/:courseId/quizzes
 * List all quizzes for a course with attempts count and metrics
 */
export const getAdminQuizzesByCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findById(courseId);
  if (!course) {
    throw ApiError.notFound('Bootcamp course not found.', 'COURSE_NOT_FOUND');
  }

  const quizzes = await Quiz.find({ course: courseId }).sort({ week: 1, createdAt: 1 });
  const quizIds = quizzes.map((q) => q._id);

  // Count submitted attempts per quiz
  const attempts = await QuizAttempt.aggregate([
    { $match: { quiz: { $in: quizIds } } },
    {
      $group: {
        _id: '$quiz',
        totalAttempts: { $sum: 1 },
        uniqueStudents: { $addToSet: '$student' },
        avgScore: { $avg: '$percent' },
      },
    },
  ]);

  const attemptMap = new Map();
  attempts.forEach((att) => {
    attemptMap.set(att._id.toString(), {
      totalAttempts: att.totalAttempts,
      studentCount: att.uniqueStudents.length,
      avgPercent: Math.round(att.avgScore || 0),
    });
  });

  const items = quizzes.map((q) => {
    const qObj = q.toObject();
    const metrics = attemptMap.get(q._id.toString()) || {
      totalAttempts: 0,
      studentCount: 0,
      avgPercent: 0,
    };
    const totalMarks = (q.questions || []).reduce((acc, curr) => acc + (curr.marks || 1), 0);

    return {
      ...qObj,
      questionCount: q.questions?.length || 0,
      totalMarks,
      metrics,
    };
  });

  return sendSuccess(res, {
    data: {
      items,
      total: items.length,
      course: {
        _id: course._id,
        title: course.title,
      },
    },
  });
});

/**
 * POST /api/admin/courses/:courseId/quizzes
 * Create a new quiz
 */
export const createQuizAdmin = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const course = await Course.findById(courseId);
  if (!course) {
    throw ApiError.notFound('Bootcamp course not found.', 'COURSE_NOT_FOUND');
  }

  const quiz = await Quiz.create({
    ...req.body,
    course: courseId,
  });

  if (quiz.isPublished) {
    notificationService.notifyContentPublished({
      courseId,
      courseTitle: course.title,
      contentType: 'quiz',
      itemTitle: quiz.title,
    }).catch((err) => console.error('[Notification] Error creating quiz publish notice:', err.message));
  }

  return sendSuccess(res, {
    statusCode: 201,
    data: quiz,
    message: 'Quiz created successfully.',
  });
});

/**
 * GET /api/admin/quizzes/:id
 * Retrieve full quiz with questions, correct answers, and explanations
 */
export const getQuizByIdAdmin = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id).populate('course', 'title slug');
  if (!quiz) {
    throw ApiError.notFound('Quiz not found.', 'QUIZ_NOT_FOUND');
  }

  return sendSuccess(res, { data: quiz });
});

/**
 * PUT /api/admin/quizzes/:id
 * Update quiz metadata and questions
 */
export const updateQuizAdmin = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) {
    throw ApiError.notFound('Quiz not found.', 'QUIZ_NOT_FOUND');
  }

  const allowedFields = [
    'week',
    'title',
    'instructions',
    'timeLimitMinutes',
    'maxAttempts',
    'opensAt',
    'closesAt',
    'passingPercent',
    'shuffleQuestions',
    'shuffleOptions',
    'showAnswers',
    'isPublished',
    'session',
    'questions',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      quiz[field] = req.body[field];
    }
  });

  await quiz.save();

  return sendSuccess(res, {
    data: quiz,
    message: 'Quiz updated successfully.',
  });
});

/**
 * DELETE /api/admin/quizzes/:id
 * Remove quiz and its associated attempts
 */
export const deleteQuizAdmin = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) {
    throw ApiError.notFound('Quiz not found.', 'QUIZ_NOT_FOUND');
  }

  await QuizAttempt.deleteMany({ quiz: quiz._id });
  await quiz.deleteOne();

  return sendSuccess(res, {
    message: 'Quiz and all student attempts deleted.',
  });
});

/**
 * POST /api/admin/quizzes/:id/import
 * Bulk import questions via pasted plain text with line-level validation
 */
export const importQuestionsPlainTextAdmin = asyncHandler(async (req, res) => {
  const { text, mode = 'append' } = req.body;
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) {
    throw ApiError.notFound('Quiz not found.', 'QUIZ_NOT_FOUND');
  }

  const parsed = parseQuizPlainText(text);
  if (!parsed.valid) {
    return res.status(422).json({
      success: false,
      message: 'Failed to import questions due to formatting errors.',
      code: 'IMPORT_PARSE_ERROR',
      errors: parsed.errors,
    });
  }

  if (mode === 'replace') {
    quiz.questions = parsed.questions;
  } else {
    quiz.questions.push(...parsed.questions);
  }

  await quiz.save();

  return sendSuccess(res, {
    data: {
      importedCount: parsed.questions.length,
      totalQuestions: quiz.questions.length,
      questions: quiz.questions,
    },
    message: `Successfully imported ${parsed.questions.length} question(s).`,
  });
});

/**
 * GET /api/admin/quizzes/:id/results
 * Results table per student attempt and per-question correct rate analytics
 */
export const getQuizResultsAdmin = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) {
    throw ApiError.notFound('Quiz not found.', 'QUIZ_NOT_FOUND');
  }

  const attempts = await QuizAttempt.find({ quiz: quiz._id })
    .populate('student', 'name email phone avatar')
    .sort({ createdAt: -1 });

  // 1. Calculate per-question correct-rate analytics
  const questionAnalytics = (quiz.questions || []).map((q) => {
    let correctCount = 0;
    let answeredCount = 0;

    attempts.forEach((att) => {
      if (att.status === 'submitted' || att.status === 'auto_submitted') {
        const studentAns = (att.answers || []).find(
          (a) => a.questionId.toString() === q._id.toString()
        );
        if (studentAns) {
          answeredCount += 1;
          const sSelected = [...(studentAns.selectedIndexes || [])].sort();
          const qCorrect = [...(q.correctIndexes || [])].sort();
          if (
            sSelected.length === qCorrect.length &&
            sSelected.every((val, idx) => val === qCorrect[idx])
          ) {
            correctCount += 1;
          }
        }
      }
    });

    const percentCorrect = answeredCount === 0 ? 0 : Math.round((correctCount / answeredCount) * 100);
    return {
      questionId: q._id,
      text: q.text,
      marks: q.marks,
      answeredCount,
      correctCount,
      percentCorrect,
    };
  });

  // 2. Summary indicators
  const submittedAttempts = attempts.filter(
    (a) => a.status === 'submitted' || a.status === 'auto_submitted'
  );
  const totalSubmissions = submittedAttempts.length;
  const avgPercent =
    totalSubmissions === 0
      ? 0
      : Math.round(
          submittedAttempts.reduce((acc, a) => acc + (a.percent || 0), 0) / totalSubmissions
        );

  const passedCount = submittedAttempts.filter((a) => a.percent >= quiz.passingPercent).length;

  return sendSuccess(res, {
    data: {
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        week: quiz.week,
        passingPercent: quiz.passingPercent,
        questionCount: quiz.questions?.length || 0,
      },
      summary: {
        totalSubmissions,
        uniqueStudents: new Set(attempts.map((a) => a.student?._id?.toString())).size,
        avgPercent,
        passedCount,
        passRate: totalSubmissions === 0 ? 0 : Math.round((passedCount / totalSubmissions) * 100),
      },
      questionAnalytics,
      attempts: attempts.map((a) => ({
        _id: a._id,
        student: a.student,
        attemptNumber: a.attemptNumber,
        score: a.score,
        totalMarks: a.totalMarks,
        percent: a.percent,
        passed: a.percent >= quiz.passingPercent,
        status: a.status,
        startedAt: a.startedAt,
        submittedAt: a.submittedAt,
        durationMinutes:
          a.submittedAt && a.startedAt
            ? Math.round((new Date(a.submittedAt) - new Date(a.startedAt)) / 60000)
            : null,
      })),
    },
  });
});

/**
 * GET /api/admin/quizzes/:id/export
 * Export quiz results as CSV
 */
export const exportQuizResultsCSVAdmin = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) {
    throw ApiError.notFound('Quiz not found.', 'QUIZ_NOT_FOUND');
  }

  const attempts = await QuizAttempt.find({ quiz: quiz._id })
    .populate('student', 'name email phone')
    .sort({ percent: -1, createdAt: 1 });

  const headers = [
    'Student Name',
    'Email',
    'Phone',
    'Attempt Number',
    'Score',
    'Total Marks',
    'Percentage',
    'Result',
    'Status',
    'Started At (UTC)',
    'Submitted At (UTC)',
    'Time Taken (Minutes)',
  ];

  const rows = attempts.map((a) => {
    const studentName = a.student?.name ? `"${a.student.name.replace(/"/g, '""')}"` : 'Unknown';
    const email = a.student?.email || '';
    const phone = a.student?.phone || '';
    const passed = a.percent >= quiz.passingPercent ? 'PASSED' : 'FAILED';
    const duration =
      a.submittedAt && a.startedAt
        ? Math.round((new Date(a.submittedAt) - new Date(a.startedAt)) / 60000)
        : '';

    return [
      studentName,
      email,
      phone,
      a.attemptNumber,
      a.score,
      a.totalMarks,
      `${a.percent}%`,
      passed,
      a.status,
      a.startedAt ? new Date(a.startedAt).toISOString() : '',
      a.submittedAt ? new Date(a.submittedAt).toISOString() : '',
      duration,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const safeFilename = quiz.title.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="quiz_${safeFilename}_results.csv"`);
  return res.status(200).send(csvContent);
});

// ==========================================
// STUDENT QUIZ CONTROLLERS
// ==========================================

/**
 * GET /api/courses/:courseId/quizzes
 * List quizzes for enrolled student with status, attempts used, and best score
 */
export const getCourseQuizzesStudent = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const quizzes = await Quiz.find({
    course: courseId,
    isPublished: true,
  }).sort({ week: 1, createdAt: 1 });

  const quizIds = quizzes.map((q) => q._id);

  // Fetch this student's attempts across quizzes
  const attempts = await QuizAttempt.find({
    student: req.user._id,
    quiz: { $in: quizIds },
  }).sort({ percent: -1, createdAt: -1 });

  const attemptsByQuiz = new Map();
  attempts.forEach((att) => {
    const qId = att.quiz.toString();
    if (!attemptsByQuiz.has(qId)) {
      attemptsByQuiz.set(qId, []);
    }
    attemptsByQuiz.get(qId).push(att);
  });

  const now = new Date();

  const items = quizzes.map((quiz) => {
    const qId = quiz._id.toString();
    const quizAttempts = attemptsByQuiz.get(qId) || [];

    // Check quiz availability window
    let status = 'open';
    if (quiz.opensAt && now < new Date(quiz.opensAt)) {
      status = 'upcoming';
    } else if (quiz.closesAt && now > new Date(quiz.closesAt)) {
      status = 'closed';
    }

    const submittedAttempts = quizAttempts.filter(
      (a) => a.status === 'submitted' || a.status === 'auto_submitted'
    );
    const inProgressAttempt = quizAttempts.find(
      (a) =>
        a.status === 'in_progress' &&
        (!a.deadlineAt || new Date(a.deadlineAt).getTime() > now.getTime())
    );

    const attemptsUsed = submittedAttempts.length;
    const canAttempt =
      status === 'open' && (!!inProgressAttempt || attemptsUsed < quiz.maxAttempts);

    const bestAttempt = submittedAttempts.length > 0 ? submittedAttempts[0] : null;
    const totalMarks = (quiz.questions || []).reduce((acc, curr) => acc + (curr.marks || 1), 0);

    return {
      _id: quiz._id,
      week: quiz.week,
      title: quiz.title,
      instructions: quiz.instructions,
      timeLimitMinutes: quiz.timeLimitMinutes,
      maxAttempts: quiz.maxAttempts,
      passingPercent: quiz.passingPercent,
      opensAt: quiz.opensAt,
      closesAt: quiz.closesAt,
      questionCount: quiz.questions?.length || 0,
      totalMarks,
      status,
      attemptsUsed,
      canAttempt,
      bestScore: bestAttempt ? bestAttempt.score : null,
      bestPercent: bestAttempt ? bestAttempt.percent : null,
      hasPassed: bestAttempt ? bestAttempt.percent >= quiz.passingPercent : false,
      lastAttemptId: quizAttempts[0]?._id || null,
      inProgressAttemptId: inProgressAttempt?._id || null,
    };
  });

  return sendSuccess(res, {
    data: {
      items,
      total: items.length,
    },
  });
});

/**
 * POST /api/quizzes/:id/start
 * Start or resume a quiz attempt.
 * CRITICAL SECURITY: Questions returned MUST NOT include correctIndexes or explanations.
 */
export const startQuizAttemptStudent = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz || !quiz.isPublished) {
    throw ApiError.notFound('Quiz not found or not published.', 'QUIZ_NOT_FOUND');
  }

  const now = new Date();

  // Enforce Open / Close windows
  if (quiz.opensAt && now < new Date(quiz.opensAt)) {
    throw ApiError.badRequest(
      `This quiz is not open yet. It opens on ${new Date(quiz.opensAt).toLocaleString('en-PK', {
        timeZone: 'Asia/Karachi',
      })} PKT.`,
      'QUIZ_NOT_OPEN'
    );
  }

  if (quiz.closesAt && now > new Date(quiz.closesAt)) {
    throw ApiError.badRequest(
      'This quiz has closed. No new attempts are permitted.',
      'QUIZ_CLOSED'
    );
  }

  // Check for active in_progress attempt to resume
  let attempt = await QuizAttempt.findOne({
    quiz: quiz._id,
    student: req.user._id,
    status: 'in_progress',
  });

  if (attempt) {
    // If deadline passed while in_progress, auto-submit!
    if (attempt.deadlineAt && now.getTime() > new Date(attempt.deadlineAt).getTime()) {
      await gradeAndFinalizeAttempt(attempt, quiz, 'auto_submitted');
      throw ApiError.badRequest(
        'Your previous attempt deadline has expired and was auto-submitted.',
        'ATTEMPT_EXPIRED'
      );
    }
  } else {
    // Check attempt limit
    const submittedCount = await QuizAttempt.countDocuments({
      quiz: quiz._id,
      student: req.user._id,
      status: { $in: ['submitted', 'auto_submitted'] },
    });

    if (submittedCount >= quiz.maxAttempts) {
      throw ApiError.badRequest(
        `You have already reached the maximum allowed attempts (${quiz.maxAttempts}) for this quiz.`,
        'MAX_ATTEMPTS_REACHED'
      );
    }

    // Calculate deadlineAt
    let deadlineAt = null;
    if (quiz.timeLimitMinutes && quiz.timeLimitMinutes > 0) {
      deadlineAt = new Date(now.getTime() + quiz.timeLimitMinutes * 60 * 1000);
      if (quiz.closesAt && new Date(quiz.closesAt) < deadlineAt) {
        deadlineAt = new Date(quiz.closesAt);
      }
    } else if (quiz.closesAt) {
      deadlineAt = new Date(quiz.closesAt);
    }

    attempt = await QuizAttempt.create({
      quiz: quiz._id,
      student: req.user._id,
      attemptNumber: submittedCount + 1,
      startedAt: now,
      deadlineAt,
      status: 'in_progress',
      answers: [],
    });
  }

  // Format questions: STRIP correctIndexes and explanations
  let questions = (quiz.questions || []).map((q) => ({
    _id: q._id,
    text: q.text,
    code: q.code || '',
    type: q.type,
    options: [...q.options],
    marks: q.marks,
  }));

  // Shuffle questions if configured
  if (quiz.shuffleQuestions) {
    questions = questions.sort(() => Math.random() - 0.5);
  }

  // Shuffle options if configured (for single/multiple questions)
  if (quiz.shuffleOptions) {
    questions = questions.map((q) => {
      if (q.type === 'true_false') return q;
      return {
        ...q,
        options: [...q.options].sort(() => Math.random() - 0.5),
      };
    });
  }

  const totalMarks = (quiz.questions || []).reduce((acc, curr) => acc + (curr.marks || 1), 0);

  return sendSuccess(res, {
    data: {
      attemptId: attempt._id,
      attemptNumber: attempt.attemptNumber,
      startedAt: attempt.startedAt,
      deadlineAt: attempt.deadlineAt,
      timeLimitMinutes: quiz.timeLimitMinutes,
      totalQuestions: questions.length,
      totalMarks,
      passingPercent: quiz.passingPercent,
      questions,
      savedAnswers: attempt.answers || [],
    },
  });
});

/**
 * PATCH /api/attempts/:id/answers
 * Autosave student answers during attempt. Checks server deadline.
 */
export const saveAttemptAnswersStudent = asyncHandler(async (req, res) => {
  const { answers } = req.body;
  const attempt = await QuizAttempt.findById(req.params.id);
  if (!attempt) {
    throw ApiError.notFound('Quiz attempt not found.', 'ATTEMPT_NOT_FOUND');
  }

  if (attempt.student.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You do not have permission to modify this attempt.', 'FORBIDDEN');
  }

  if (attempt.status !== 'in_progress') {
    throw ApiError.badRequest('This quiz attempt has already been finalized.', 'ATTEMPT_FINALIZED');
  }

  const now = new Date();

  // Enforce server deadline
  if (attempt.deadlineAt && now.getTime() > new Date(attempt.deadlineAt).getTime()) {
    const quiz = await Quiz.findById(attempt.quiz);
    attempt.answers = answers || attempt.answers;
    await gradeAndFinalizeAttempt(attempt, quiz, 'auto_submitted');

    return sendSuccess(res, {
      data: {
        status: 'auto_submitted',
        score: attempt.score,
        percent: attempt.percent,
      },
      message: 'Time expired. Your quiz answers were automatically submitted.',
    });
  }

  attempt.answers = answers;
  await attempt.save();

  return sendSuccess(res, {
    data: { status: 'in_progress', savedAt: now },
    message: 'Answers saved to cloud.',
  });
});

/**
 * POST /api/attempts/:id/submit
 * Finalize and auto-grade attempt on the server
 */
export const submitQuizAttemptStudent = asyncHandler(async (req, res) => {
  const attempt = await QuizAttempt.findById(req.params.id);
  if (!attempt) {
    throw ApiError.notFound('Quiz attempt not found.', 'ATTEMPT_NOT_FOUND');
  }

  if (attempt.student.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You do not have permission to submit this attempt.', 'FORBIDDEN');
  }

  if (attempt.status !== 'in_progress') {
    throw ApiError.badRequest('This attempt has already been submitted.', 'ALREADY_SUBMITTED');
  }

  const quiz = await Quiz.findById(attempt.quiz);
  if (!quiz) {
    throw ApiError.notFound('Associated quiz not found.', 'QUIZ_NOT_FOUND');
  }

  if (req.body.answers) {
    attempt.answers = req.body.answers;
  }

  const now = new Date();
  const isExpired = attempt.deadlineAt && now.getTime() > new Date(attempt.deadlineAt).getTime();
  const finalStatus = isExpired ? 'auto_submitted' : 'submitted';

  await gradeAndFinalizeAttempt(attempt, quiz, finalStatus);

  // Review Payload according to showAnswers policy
  const review = buildAttemptReview(attempt, quiz, now, false);

  return sendSuccess(res, {
    data: {
      attemptId: attempt._id,
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      percent: attempt.percent,
      passed: attempt.percent >= quiz.passingPercent,
      passingPercent: quiz.passingPercent,
      status: attempt.status,
      submittedAt: attempt.submittedAt,
      review,
    },
    message: isExpired
      ? 'Time limit exceeded. Quiz auto-submitted and graded.'
      : 'Quiz submitted and graded successfully.',
  });
});

/**
 * GET /api/attempts/:id
 * Retrieve attempt results and review (if showAnswers policy permits)
 */
export const getAttemptDetails = asyncHandler(async (req, res) => {
  const attempt = await QuizAttempt.findById(req.params.id).populate('quiz');
  if (!attempt) {
    throw ApiError.notFound('Quiz attempt not found.', 'ATTEMPT_NOT_FOUND');
  }

  const isAdmin = req.user.role === 'admin';
  const isOwner = attempt.student.toString() === req.user._id.toString();

  if (!isAdmin && !isOwner) {
    throw ApiError.forbidden('You cannot view another student’s quiz attempt.', 'FORBIDDEN');
  }

  const quiz = attempt.quiz;
  const now = new Date();
  const review = buildAttemptReview(attempt, quiz, now, isAdmin);

  return sendSuccess(res, {
    data: {
      attemptId: attempt._id,
      quizTitle: quiz.title,
      week: quiz.week,
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      percent: attempt.percent,
      passed: attempt.percent >= quiz.passingPercent,
      passingPercent: quiz.passingPercent,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      review,
    },
  });
});

// ==========================================
// GRADING & REVIEW HELPERS
// ==========================================

const gradeAndFinalizeAttempt = async (attempt, quiz, status) => {
  let score = 0;
  let totalMarks = 0;

  const answerMap = new Map();
  (attempt.answers || []).forEach((a) => {
    answerMap.set(a.questionId.toString(), a.selectedIndexes || []);
  });

  (quiz.questions || []).forEach((q) => {
    const qMarks = q.marks || 1;
    totalMarks += qMarks;

    const studentSelected = [...(answerMap.get(q._id.toString()) || [])].sort();
    const correctAnswers = [...(q.correctIndexes || [])].sort();

    const isCorrect =
      studentSelected.length === correctAnswers.length &&
      studentSelected.every((val, idx) => val === correctAnswers[idx]);

    if (isCorrect) {
      score += qMarks;
    }
  });

  attempt.score = score;
  attempt.totalMarks = totalMarks;
  attempt.percent = totalMarks === 0 ? 100 : Math.round((score / totalMarks) * 100);
  attempt.status = status;
  attempt.submittedAt = new Date();

  await attempt.save();
};

const buildAttemptReview = (attempt, quiz, now, isAdmin) => {
  // If not submitted yet, never return answers
  if (attempt.status === 'in_progress') {
    return null;
  }

  // Determine if answers can be shown
  let canShowAnswers = isAdmin;
  if (!canShowAnswers) {
    if (quiz.showAnswers === 'immediately') {
      canShowAnswers = true;
    } else if (quiz.showAnswers === 'after_close') {
      canShowAnswers = !!quiz.closesAt && now > new Date(quiz.closesAt);
    } else {
      canShowAnswers = false;
    }
  }

  const answerMap = new Map();
  (attempt.answers || []).forEach((a) => {
    answerMap.set(a.questionId.toString(), a.selectedIndexes || []);
  });

  const questionsReview = (quiz.questions || []).map((q) => {
    const studentSelected = answerMap.get(q._id.toString()) || [];
    const correctSorted = [...(q.correctIndexes || [])].sort();
    const studentSorted = [...studentSelected].sort();

    const isCorrect =
      studentSorted.length === correctSorted.length &&
      studentSorted.every((val, idx) => val === correctSorted[idx]);

    return {
      _id: q._id,
      text: q.text,
      code: q.code || '',
      type: q.type,
      options: q.options,
      marks: q.marks,
      studentSelected,
      isCorrect,
      correctIndexes: canShowAnswers ? q.correctIndexes : undefined,
      explanation: canShowAnswers ? q.explanation : undefined,
    };
  });

  return {
    canShowAnswers,
    policy: quiz.showAnswers,
    questions: questionsReview,
  };
};

export default {
  getAdminQuizzesByCourse,
  createQuizAdmin,
  getQuizByIdAdmin,
  updateQuizAdmin,
  deleteQuizAdmin,
  importQuestionsPlainTextAdmin,
  getQuizResultsAdmin,
  exportQuizResultsCSVAdmin,
  getCourseQuizzesStudent,
  startQuizAttemptStudent,
  saveAttemptAnswersStudent,
  submitQuizAttemptStudent,
  getAttemptDetails,
};
