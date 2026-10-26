import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import authService from '../../services/auth.service';
import AuthSplitLayout from '../../components/auth/AuthSplitLayout';
import { FormField, PasswordInput, Button } from '../../components/ui';
import { useDocumentMeta } from '../../utils/seo';

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const resetSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(passwordRegex, 'Must contain at least one letter and one number'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  useDocumentMeta({
    title: 'Create New Password — CodeCraft Portal',
    description: 'Enter your new account password.',
    canonicalPath: '/reset-password',
  });

  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values) => {
    if (!token) {
      setServerError('Missing reset token. Please request a new recovery link.');
      return;
    }

    setServerError('');
    try {
      await authService.resetPassword({
        token,
        newPassword: values.newPassword,
      });
      setIsSuccess(true);
    } catch (err) {
      setServerError(err.message || 'Failed to reset password. The link may have expired.');
    }
  };

  return (
    <AuthSplitLayout
      title="Create new password"
      subtitle="Choose a secure password with at least 8 characters, a letter, and a number."
      badgeText="Security"
    >
      {!token ? (
        <div className="p-6 bg-surface border border-line rounded-lg text-center space-y-4">
          <div className="w-10 h-10 rounded-full bg-danger-soft text-danger flex items-center justify-center mx-auto border border-danger/20">
            <AlertCircle className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg text-ink">
              Invalid or Missing Reset Token
            </h3>
            <p className="text-xs text-ink-muted mt-2 leading-relaxed">
              This password reset link is incomplete or missing the required authorization token.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/forgot-password">
              <Button variant="secondary" size="md">
                Request New Reset Link
              </Button>
            </Link>
          </div>
        </div>
      ) : isSuccess ? (
        <div className="p-6 bg-surface border border-line rounded-lg text-center space-y-4">
          <div className="w-10 h-10 rounded-full bg-success-soft text-success flex items-center justify-center mx-auto border border-success/20">
            <CheckCircle2 className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg text-ink">
              Password Reset Successfully
            </h3>
            <p className="text-xs text-ink-muted mt-2 leading-relaxed">
              Your account password has been updated. All previous sessions have been invalidated.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/login">
              <Button variant="primary" size="md" rightIcon={ArrowRight}>
                Sign In With New Password
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError && (
            <div
              role="alert"
              className="mb-4 p-3.5 bg-danger-soft border border-danger/30 rounded text-xs text-danger flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 stroke-[1.5]" />
              <span>{serverError}</span>
            </div>
          )}

          <FormField
            id="new-password"
            label="New Password"
            required
            error={errors.newPassword?.message}
            helperText="At least 8 characters with at least one letter and one number"
          >
            <PasswordInput
              id="new-password"
              placeholder="••••••••"
              autoComplete="new-password"
              hasError={!!errors.newPassword}
              {...register('newPassword')}
            />
          </FormField>

          <FormField
            id="confirm-password"
            label="Confirm New Password"
            required
            error={errors.confirmPassword?.message}
          >
            <PasswordInput
              id="confirm-password"
              placeholder="••••••••"
              autoComplete="new-password"
              hasError={!!errors.confirmPassword}
              {...register('confirmPassword')}
            />
          </FormField>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="w-full"
            >
              Save New Password
            </Button>
          </div>
        </form>
      )}
    </AuthSplitLayout>
  );
};

export default ResetPasswordPage;
