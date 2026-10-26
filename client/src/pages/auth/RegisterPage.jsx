import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, User, Mail, Phone, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AuthSplitLayout from '../../components/auth/AuthSplitLayout';
import { FormField, Input, PasswordInput, Checkbox, Button } from '../../components/ui';
import { useDocumentMeta } from '../../utils/seo';

const pakistanPhoneRegex = /^(\+92|0)?3[0-9]{9}$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name cannot exceed 60 characters'),
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .toLowerCase(),
  phone: z
    .string()
    .trim()
    .refine((val) => !val || pakistanPhoneRegex.test(val.replace(/\s+/g, '')), {
      message: 'Enter a valid Pakistani mobile number (e.g. 03001234567)',
    })
    .optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Must contain at least one letter and one number'),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must acknowledge the live bootcamp attendance policy',
  }),
});

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [serverError, setServerError] = useState('');

  useDocumentMeta({
    title: 'Create Account — Apply for Bootcamp',
    description: 'Register a student account to enroll in live online cohorts at CodeCraft Bootcamp.',
    canonicalPath: '/register',
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      acceptTerms: false,
    },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
      });

      // Role is always student on public registration
      navigate('/student/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please check the details entered.');
    }
  };

  return (
    <AuthSplitLayout
      title="Apply for live bootcamp"
      subtitle="Create your student account to reserve your seat in the next cohort."
      badgeText="Fall 2026 Cohort"
    >
      {serverError && (
        <div
          role="alert"
          className="mb-6 p-3.5 bg-danger-soft border border-danger/30 rounded text-xs text-danger flex items-start gap-2.5 leading-relaxed"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 stroke-[1.5]" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          id="reg-name"
          label="Full Name"
          required
          error={errors.name?.message}
          helperText="As it appears on your CNIC or certificate"
        >
          <Input
            id="reg-name"
            placeholder="Muhammad Ali"
            autoComplete="name"
            leftIcon={User}
            hasError={!!errors.name}
            {...register('name')}
          />
        </FormField>

        <FormField
          id="reg-email"
          label="Email Address"
          required
          error={errors.email?.message}
        >
          <Input
            id="reg-email"
            type="email"
            placeholder="student@example.com"
            autoComplete="email"
            leftIcon={Mail}
            hasError={!!errors.email}
            {...register('email')}
          />
        </FormField>

        <FormField
          id="reg-phone"
          label="Mobile / WhatsApp Number (Optional)"
          error={errors.phone?.message}
          helperText="Used for urgent class announcements and JazzCash/Easypaisa matching"
        >
          <Input
            id="reg-phone"
            type="tel"
            placeholder="0300 1234567"
            autoComplete="tel"
            leftIcon={Phone}
            hasError={!!errors.phone}
            {...register('phone')}
          />
        </FormField>

        <FormField
          id="reg-password"
          label="Account Password"
          required
          error={errors.password?.message}
          helperText="Minimum 8 characters with at least one letter and one number"
        >
          <PasswordInput
            id="reg-password"
            placeholder="••••••••"
            autoComplete="new-password"
            hasError={!!errors.password}
            {...register('password')}
          />
        </FormField>

        <div className="pt-1">
          <Checkbox
            id="reg-terms"
            label="I understand that all sessions are live and attendance is mandatory."
            description="We do not provide video recordings; active participation is required."
            hasError={!!errors.acceptTerms}
            {...register('acceptTerms')}
          />
          {errors.acceptTerms && (
            <p className="text-xs text-danger flex items-center gap-1.5 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 stroke-[1.5]" />
              <span>{errors.acceptTerms.message}</span>
            </p>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="w-full"
            rightIcon={ArrowRight}
          >
            Create Student Account
          </Button>
        </div>

        <div className="pt-4 text-center text-xs text-ink-muted border-t border-line mt-6">
          <span>Already have an account? </span>
          <Link
            to="/login"
            className="text-primary hover:text-primary-hover font-semibold underline underline-offset-2 ml-1"
          >
            Sign In here
          </Link>
        </div>
      </form>
    </AuthSplitLayout>
  );
};

export default RegisterPage;
