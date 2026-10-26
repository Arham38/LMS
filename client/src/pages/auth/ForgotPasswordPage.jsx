import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import authService from '../../services/auth.service';
import AuthSplitLayout from '../../components/auth/AuthSplitLayout';
import { FormField, Input, Button } from '../../components/ui';
import { useDocumentMeta } from '../../utils/seo';

const forgotSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
});

export const ForgotPasswordPage = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  useDocumentMeta({
    title: 'Reset Forgotten Password — CodeCraft Portal',
    description: 'Request a password reset link for your CodeCraft student account.',
    canonicalPath: '/forgot-password',
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      await authService.forgotPassword(values.email);
      setIsSubmitted(true);
    } catch (err) {
      setServerError(err.message || 'An error occurred. Please try again later.');
    }
  };

  return (
    <AuthSplitLayout
      title="Reset your password"
      subtitle="Enter your account email to receive a single-use recovery link."
      badgeText="Account Recovery"
    >
      {isSubmitted ? (
        <div className="p-6 bg-surface border border-line rounded-lg space-y-4">
          <div className="w-10 h-10 rounded-full bg-success-soft text-success flex items-center justify-center border border-success/20">
            <CheckCircle2 className="w-5 h-5 stroke-[1.5]" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-lg text-ink">
              Check your recovery instructions
            </h3>
            <p className="text-xs text-ink-muted mt-2 leading-relaxed">
              If an active account exists for that email address, a password reset link has been issued. In development mode, the link is logged to the server terminal.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/login">
              <Button variant="secondary" size="md" leftIcon={ArrowLeft}>
                Return to Sign In
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
            id="forgot-email"
            label="Email Address"
            required
            error={errors.email?.message}
            helperText="The email address you used when applying"
          >
            <Input
              id="forgot-email"
              type="email"
              placeholder="student@example.com"
              autoComplete="email"
              leftIcon={Mail}
              hasError={!!errors.email}
              {...register('email')}
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
              Send Reset Instructions
            </Button>
          </div>

          <div className="pt-4 text-center text-xs text-ink-muted border-t border-line mt-6">
            <Link
              to="/login"
              className="text-ink-muted hover:text-ink font-medium inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}
    </AuthSplitLayout>
  );
};

export default ForgotPasswordPage;
