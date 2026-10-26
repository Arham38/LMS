import { z } from 'zod';

export const presignUploadSchema = z.object({
  kind: z.enum(['pdf', 'image', 'zip'], {
    required_error: "Upload kind is required ('pdf', 'image', or 'zip')",
  }),
  contentType: z.string({
    required_error: 'Content-Type is required',
  }).trim().min(1),
  size: z.coerce.number().int().positive('File size must be greater than 0'),
  filename: z.string().trim().optional(),
  courseId: z.string().trim().optional(),
});

export const fileUrlQuerySchema = z.object({
  key: z.string({
    required_error: 'Storage key is required in query (?key=...)',
  }).trim().min(5),
});
