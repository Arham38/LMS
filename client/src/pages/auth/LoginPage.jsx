import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import AuthSplitLayout from '../../components/auth/AuthSplitLayout';
import { FormField, Input, PasswordInput, Button } from '../../components/ui';
import { useDocumentMeta } from '../../utils/seo';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [serverError, setServerError] = useState('');

  useDocumentMeta({
    title: 'Student Sign In — CodeCraft Portal',
    description: 'Sign in to access your live classes, homework assignments, quizzes, and gradebook.',
    canonicalPath: '/login',
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const response = await login(values.email, values.password);
      const user = response.user;

      // Check if redirect destination was stored in location state
      const fromPath = location.state?.from?.pathname;
      if (fromPath && fromPath !== '/login') {
        navigate(fromPath, { replace: true });
        return;
      }

      // Default role routing
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    } catch (err) {
      setServerError(err.message || 'Unable to sign in. Please check your credentials.');
    }
  };

  return (
    <AuthSplitLayout
      title="Sign in to your account"
      subtitle="Access your live class schedule, assignments, and notes."
      badgeText="Secure Account Portal"
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
          id="login-email"
          label="Email Address"
          required
          error={errors.email?.message}
        >
          <Input
            id="login-email"
            type="email"
            placeholder="student@example.com"
            autoComplete="email"
            leftIcon={Mail}
            hasError={!!errors.email}
            {...register('email')}
          />
        </FormField>

        <FormField
          id="login-password"
          label="Password"
          required
          error={errors.password?.message}
        >
          <PasswordInput
            id="login-password"
            placeholder="••••••••"
            autoComplete="current-password"
            hasError={!!errors.password}
            {...register('password')}
          />
        </FormField>

        <div className="flex items-center justify-between text-xs pt-1">
          <Link
            to="/forgot-password"
            className="text-primary hover:text-primary-hover font-medium underline underline-offset-2"
          >
            Forgot password?
          </Link>
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
            Sign In
          </Button>
        </div>

        <div className="pt-4 text-center text-xs text-ink-muted border-t border-line mt-6">
          <span>Don't have an account? </span>
          <Link
            to="/register"
            className="text-primary hover:text-primary-hover font-semibold underline underline-offset-2 ml-1"
          >
            Apply for upcoming cohort
          </Link>
        </div>
      </form>
    </AuthSplitLayout>
  );
};

export default LoginPage;
