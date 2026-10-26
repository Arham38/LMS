import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User as UserIcon, Mail, Phone, Lock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  FormField,
  Input,
  PasswordInput,
  Button,
  Badge,
  useToast,
} from '../../components/ui';

const pakistanPhoneRegex = /^(\+92|0)?3[0-9]{9}$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
  phone: z
    .string()
    .trim()
    .refine((val) => !val || pakistanPhoneRegex.test(val.replace(/\s+/g, '')), {
      message: 'Enter a valid Pakistani mobile number (e.g. 03001234567)',
    })
    .optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(passwordRegex, 'Must contain at least one letter and one number'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

export const ProfilePage = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const toast = useToast();

  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Profile Form
  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
    },
  });

  // Password Form
  const {
    register: regPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onProfileSubmit = async (values) => {
    setProfileSuccess(false);
    try {
      await updateProfile(values);
      setProfileSuccess(true);
      toast.success('Your profile details have been saved.', 'Profile Updated');
      setTimeout(() => setProfileSuccess(false), 4000);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    }
  };

  const onPasswordSubmit = async (values) => {
    setPasswordSuccess(false);
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      setPasswordSuccess(true);
      resetPasswordForm();
      toast.success('Password changed successfully. All previous sessions invalidated.', 'Security Updated');
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err) {
      toast.error(err.message || 'Failed to change password.');
    }
  };

  return (
    <div className="space-y-8 max-w-form">
      <PageHeader
        title="Account Settings"
        description="Manage your personal contact details and account security."
        breadcrumbs={[
          { label: 'Portal', to: user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard' },
          { label: 'Profile' },
        ]}
        badge={
          <Badge variant={user?.role === 'admin' ? 'primary' : 'success'} dot>
            {user?.role === 'admin' ? 'Instructor (Admin)' : 'Enrolled Student'}
          </Badge>
        }
      />

      {/* Section 1: Personal Profile */}
      <Card>
        <CardHeader
          title="Personal Information"
          subtitle="Your display name and notification mobile number."
        />
        <CardContent>
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4" noValidate>
            <FormField id="profile-email" label="Email Address" helperText="Email address cannot be changed directly.">
              <Input
                id="profile-email"
                type="email"
                value={user?.email || ''}
                disabled
                leftIcon={Mail}
              />
            </FormField>

            <FormField
              id="profile-name"
              label="Full Name"
              required
              error={profileErrors.name?.message}
            >
              <Input
                id="profile-name"
                placeholder="Muhammad Ali"
                leftIcon={UserIcon}
                hasError={!!profileErrors.name}
                {...regProfile('name')}
              />
            </FormField>

            <FormField
              id="profile-phone"
              label="Phone Number"
              error={profileErrors.phone?.message}
              helperText="Pakistani mobile format (e.g. 03001234567)"
            >
              <Input
                id="profile-phone"
                placeholder="0300 1234567"
                leftIcon={Phone}
                hasError={!!profileErrors.phone}
                {...regProfile('phone')}
              />
            </FormField>

            <div className="pt-2 flex items-center justify-between">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isProfileSubmitting}
              >
                Save Profile Changes
              </Button>
              {profileSuccess && (
                <span className="text-xs text-success flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Saved
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Section 2: Security & Password */}
      <Card>
        <CardHeader
          title="Security & Password"
          subtitle="Updating your password will immediately invalidate all older login sessions."
        />
        <CardContent>
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4" noValidate>
            <FormField
              id="curr-pass"
              label="Current Password"
              required
              error={passwordErrors.currentPassword?.message}
            >
              <PasswordInput
                id="curr-pass"
                placeholder="••••••••"
                autoComplete="current-password"
                hasError={!!passwordErrors.currentPassword}
                {...regPassword('currentPassword')}
              />
            </FormField>

            <FormField
              id="new-pass"
              label="New Password"
              required
              error={passwordErrors.newPassword?.message}
              helperText="Minimum 8 characters with at least one letter and one number"
            >
              <PasswordInput
                id="new-pass"
                placeholder="••••••••"
                autoComplete="new-password"
                hasError={!!passwordErrors.newPassword}
                {...regPassword('newPassword')}
              />
            </FormField>

            <FormField
              id="conf-pass"
              label="Confirm New Password"
              required
              error={passwordErrors.confirmPassword?.message}
            >
              <PasswordInput
                id="conf-pass"
                placeholder="••••••••"
                autoComplete="new-password"
                hasError={!!passwordErrors.confirmPassword}
                {...regPassword('confirmPassword')}
              />
            </FormField>

            <div className="pt-2 flex items-center justify-between">
              <Button
                type="submit"
                variant="secondary"
                size="md"
                isLoading={isPasswordSubmitting}
              >
                Change Password
              </Button>
              {passwordSuccess && (
                <span className="text-xs text-success flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Updated
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
