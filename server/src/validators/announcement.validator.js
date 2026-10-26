import { z } from 'zod';

export const createAnnouncementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Title must be at least 2 characters')
    .max(180, 'Title cannot exceed 180 characters'),
  body: z
    .string()
    .trim()
    .min(2, 'Announcement content is required'),
  pinned: z.boolean().optional().default(false),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

export const updateStudentStatusSchema = z.object({
  isActive: z.boolean({ required_error: 'isActive boolean flag is required' }),
});

export const updateStudentNotesSchema = z.object({
  privateNotes: z.string().trim().default(''),
});

export default {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  updateStudentStatusSchema,
  updateStudentNotesSchema,
};
