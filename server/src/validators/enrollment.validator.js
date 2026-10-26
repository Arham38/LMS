import { z } from 'zod';

export const createEnrollmentSchema = z.object({
  courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course ID format'),
  paymentMethod: z.enum(['jazzcash', 'easypaisa', 'bank', 'other'], {
    required_error: 'Payment method is required',
  }),
  transactionId: z.string().trim().min(3, 'Transaction ID / Reference number is required'),
  senderName: z.string().trim().min(2, 'Sender name is required'),
  senderNumber: z.string().trim().min(4, 'Sender account / mobile number is required'),
  paymentNote: z.string().trim().optional(),
  paymentProofKey: z.string().trim().optional(),
});

export const adminReviewEnrollmentSchema = z
  .object({
    action: z.enum(['approve', 'reject'], {
      required_error: 'Action must be either approve or reject',
    }),
    amountPaid: z.coerce.number().min(0, 'Amount paid cannot be negative').optional(),
    adminNote: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (data.action === 'reject') {
        return !!data.adminNote && data.adminNote.trim().length > 0;
      }
      return true;
    },
    {
      message: 'A rejection reason (adminNote) is required when rejecting an enrollment.',
      path: ['adminNote'],
    }
  );
