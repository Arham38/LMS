import { z } from 'zod';

const paymentMethodSchema = z.object({
  type: z.enum(['jazzcash', 'easypaisa', 'bank', 'other']),
  accountTitle: z.string().trim().min(2, 'Account title is required'),
  accountNumber: z.string().trim().min(3, 'Account number is required'),
  instructions: z.string().trim().optional(),
});

export const updateSettingsSchema = z.object({
  paymentMethods: z.array(paymentMethodSchema).min(1, 'At least one payment method is required'),
  whatsappNumber: z.string().trim().min(5, 'WhatsApp number is required'),
  supportEmail: z.string().trim().email('Valid support email is required'),
  address: z.string().trim().min(3, 'Address is required'),
  socialLinks: z
    .object({
      github: z.string().trim().optional(),
      linkedin: z.string().trim().optional(),
      youtube: z.string().trim().optional(),
      twitter: z.string().trim().optional(),
    })
    .optional(),
});
