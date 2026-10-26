import { z } from 'zod';

const questionValidator = z.object({
  _id: z.string().optional(),
  text: z.string().trim().min(2, 'Question text must be at least 2 characters'),
  code: z.string().trim().optional().default(''),
  type: z.enum(['single', 'multiple', 'true_false']).default('single'),
  options: z.array(z.string().trim()).min(2, 'At least 2 options are required'),
  correctIndexes: z.array(z.number().int().min(0)).min(1, 'At least one correct answer is required'),
  explanation: z.string().trim().optional().default(''),
  marks: z.coerce.number().int().min(1, 'Marks must be at least 1').default(1),
});

export const createQuizSchema = z.object({
  week: z.coerce.number().int().min(1, 'Curriculum week must be at least 1'),
  title: z.string().trim().min(2, 'Quiz title must be at least 2 characters').max(140, 'Title cannot exceed 140 characters'),
  instructions: z.string().trim().optional().default(''),
  timeLimitMinutes: z.coerce.number().int().min(0).nullable().optional().default(null),
  maxAttempts: z.coerce.number().int().min(1).max(10).default(1),
  opensAt: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || !isNaN(new Date(val).getTime()), { message: 'Invalid opensAt date format' }),
  closesAt: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || !isNaN(new Date(val).getTime()), { message: 'Invalid closesAt date format' }),
  passingPercent: z.coerce.number().min(0).max(100).default(60),
  shuffleQuestions: z.boolean().optional().default(false),
  shuffleOptions: z.boolean().optional().default(false),
  showAnswers: z.enum(['immediately', 'after_close', 'never']).default('immediately'),
  isPublished: z.boolean().optional().default(true),
  session: z.string().nullable().optional(),
  questions: z.array(questionValidator).optional().default([]),
});

export const updateQuizSchema = createQuizSchema.partial();

export const importPlainTextSchema = z.object({
  text: z.string().min(1, 'Pasted plain text question content is required'),
  mode: z.enum(['append', 'replace']).optional().default('append'),
});

export const saveAnswersSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().trim().min(1, 'Question ID is required'),
      selectedIndexes: z.array(z.number().int().min(0)),
    })
  ),
});

export default {
  createQuizSchema,
  updateQuizSchema,
  importPlainTextSchema,
  saveAnswersSchema,
};
