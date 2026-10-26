import { z } from 'zod';

const pakistanPhoneRegex = /^(\+92|0)?3[0-9]{9}$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name cannot exceed 60 characters'),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Please provide a valid email address')
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Password must contain at least one letter and one number'),
  phone: z
    .string()
    .trim()
    .refine((val) => !val || pakistanPhoneRegex.test(val.replace(/\s+/g, '')), {
      message: 'Please provide a valid Pakistani mobile number (e.g. 03001234567 or +923001234567)',
    })
    .optional(),
  // Explicitly disallow client setting role - if sent, it is stripped
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Please provide a valid email address')
    .toLowerCase(),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name cannot exceed 60 characters')
    .optional(),
  phone: z
    .string()
    .trim()
    .refine((val) => !val || pakistanPhoneRegex.test(val.replace(/\s+/g, '')), {
      message: 'Please provide a valid Pakistani mobile number (e.g. 03001234567 or +923001234567)',
    })
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string({ required_error: 'Current password is required' }).min(1, 'Current password is required'),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, 'New password must be at least 8 characters')
    .regex(passwordRegex, 'New password must contain at least one letter and one number'),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Please provide a valid email address')
    .toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string({ required_error: 'Reset token is required' }).min(1, 'Reset token is required'),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(8, 'New password must be at least 8 characters')
    .regex(passwordRegex, 'New password must contain at least one letter and one number'),
});
