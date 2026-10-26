import { z } from 'zod';

const syllabusModuleSchema = z.object({
  order: z.number().int().min(1).default(1),
  title: z.string().trim().min(1, 'Module title is required'),
  topics: z.array(z.string().trim()).default([]),
});

export const createCourseSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
  tagline: z.string().trim().min(3, 'Tagline is required').max(200),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'All Levels']).default('All Levels'),
  durationWeeks: z.coerce.number().int().min(1, 'Duration must be at least 1 week').max(52),
  schedule: z.string().trim().min(3, 'Schedule is required (e.g. Tue & Thu 8 to 10 PM PKT)'),
  startDate: z.coerce.date(),
  seatsTotal: z.coerce.number().int().min(1, 'Total seats must be at least 1').max(500),
  fee: z.coerce.number().min(0, 'Fee cannot be negative'),
  installmentsAllowed: z.boolean().default(false),
  installmentPlan: z.string().trim().optional(),
  syllabus: z.array(syllabusModuleSchema).default([]),
  outcomes: z.array(z.string().trim()).default([]),
  requirements: z.array(z.string().trim()).default([]),
  isPublished: z.boolean().default(false),
  isEnrollmentOpen: z.boolean().default(true),
});

export const updateCourseSchema = createCourseSchema.partial();
