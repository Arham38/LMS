import { z } from 'zod';

const rubricItemValidator = z.object({
  _id: z.string().optional(),
  criterion: z.string().trim().min(1, 'Criterion description is required').max(120, 'Criterion cannot exceed 120 characters'),
  maxMarks: z.coerce.number().min(1, 'Criterion marks must be at least 1'),
});

export const createAssignmentSchema = z.object({
  week: z.coerce.number().int().min(1, 'Curriculum week must be at least 1'),
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(140, 'Title cannot exceed 140 characters'),
  description: z.string().trim().min(2, 'Description is required'),
  attachmentKey: z.string().trim().nullable().optional(),
  attachmentName: z.string().trim().nullable().optional(),
  dueAt: z
    .string()
    .trim()
    .refine((val) => !isNaN(new Date(val).getTime()), { message: 'Valid due date is required' }),
  maxMarks: z.coerce.number().int().min(1, 'Maximum marks must be at least 1').default(100),
  submissionType: z.enum(['file', 'link', 'either']).default('either'),
  allowLate: z.boolean().default(true),
  latePenaltyPercent: z.coerce.number().min(0).max(100).default(10),
  allowResubmit: z.boolean().default(false),
  rubric: z.array(rubricItemValidator).optional().default([]),
  isPublished: z.boolean().optional().default(true),
  session: z.string().nullable().optional(),
});

export const updateAssignmentSchema = createAssignmentSchema.partial();

export const submitSolutionSchema = z.object({
  fileKey: z.string().trim().nullable().optional(),
  fileName: z.string().trim().nullable().optional(),
  link: z
    .string()
    .trim()
    .nullable()
    .optional()
    .refine((val) => !val || /^https?:\/\/.+/i.test(val), {
      message: 'Submission link must be a valid HTTP or HTTPS URL (e.g. GitHub or Google Drive)',
    }),
  comment: z.string().trim().optional().default(''),
});

export const gradeSubmissionSchema = z.object({
  marks: z.coerce.number().min(0, 'Marks cannot be negative'),
  rubricMarks: z
    .array(
      z.object({
        criterion: z.string().trim(),
        marks: z.coerce.number().min(0),
      })
    )
    .optional()
    .default([]),
  feedback: z.string().trim().optional().default(''),
  action: z.enum(['grade', 'return']).default('grade'),
});

export default {
  createAssignmentSchema,
  updateAssignmentSchema,
  submitSolutionSchema,
  gradeSubmissionSchema,
};
