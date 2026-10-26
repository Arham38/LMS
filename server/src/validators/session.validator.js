import { z } from 'zod';

export const createSessionSchema = z.object({
  week: z.coerce.number().int().min(1, 'Week must be at least 1'),
  order: z.coerce.number().int().min(1, 'Order must be at least 1'),
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(120, 'Title cannot exceed 120 characters'),
  description: z.string().trim().optional().default(''),
  scheduledAt: z
    .string()
    .trim()
    .refine((val) => !isNaN(new Date(val).getTime()), {
      message: 'Scheduled date and time must be a valid date format',
    }),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(15, 'Session must be at least 15 minutes')
    .max(360, 'Session cannot exceed 6 hours (360 minutes)')
    .default(120),
  meetingLink: z.string().trim().url('Meeting link must be a valid Google Meet or Zoom URL'),
  resources: z
    .array(
      z.object({
        title: z.string().trim().min(1, 'Resource title is required').max(100),
        fileKey: z.string().trim().min(1, 'Resource fileKey is required'),
        fileName: z.string().trim().optional(),
      })
    )
    .optional()
    .default([]),
  status: z.enum(['upcoming', 'live', 'completed', 'cancelled']).optional().default('upcoming'),
  isPublished: z.boolean().optional().default(true),
});

export const updateSessionSchema = createSessionSchema.partial();

export const updateSessionStatusSchema = z.object({
  status: z.enum(['upcoming', 'live', 'completed', 'cancelled']),
});

export const updateAttendanceBulkSchema = z.object({
  attendance: z
    .array(
      z.object({
        studentId: z.string().trim().min(1, 'Student ID is required'),
        status: z.enum(['present', 'late', 'absent']),
      })
    )
    .min(1, 'Attendance list cannot be empty'),
});

export default {
  createSessionSchema,
  updateSessionSchema,
  updateSessionStatusSchema,
  updateAttendanceBulkSchema,
};
