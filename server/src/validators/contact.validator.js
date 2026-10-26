import { z } from 'zod';

export const submitContactMessageSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().trim().email('Please enter a valid email address'),
  phone: z.string().trim().optional().or(z.literal('')),
  subject: z.string().trim().max(200, 'Subject cannot exceed 200 characters').optional().or(z.literal('')),
  message: z.string().trim().min(5, 'Message must be at least 5 characters').max(5000, 'Message cannot exceed 5000 characters'),
});

export const updateContactMessageSchema = z.object({
  read: z.boolean().optional(),
  replySent: z.boolean().optional(),
  adminNotes: z.string().trim().optional(),
});
