import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, CreditCard, Mail, Phone, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import settingsService from '../../services/settings.service';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  FormField,
  Input,
  Textarea,
  Select,
  Button,
  useToast,
  Skeleton,
} from '../../components/ui';

const settingsSchema = z.object({
  whatsappNumber: z.string().trim().min(5, 'WhatsApp number is required'),
  supportEmail: z.string().trim().email('Valid support email is required'),
  address: z.string().trim().min(3, 'Address is required'),
  paymentMethods: z
    .array(
      z.object({
        type: z.enum(['jazzcash', 'easypaisa', 'bank', 'other']),
        accountTitle: z.string().trim().min(2, 'Account title is required'),
        accountNumber: z.string().trim().min(3, 'Account number is required'),
        instructions: z.string().trim().optional(),
      })
    )
    .min(1, 'At least one payment method is required'),
  socialLinks: z
    .object({
      github: z.string().trim().optional(),
      linkedin: z.string().trim().optional(),
      youtube: z.string().trim().optional(),
    })
    .optional(),
});

export const AdminSettingsPage = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      whatsappNumber: '',
      supportEmail: '',
      address: '',
      paymentMethods: [],
      socialLinks: { github: '', linkedin: '', youtube: '' },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'paymentMethods',
  });

  useEffect(() => {
    document.title = 'System & Payment Settings — Admin Workspace';

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const data = await settingsService.getAdminSettings();
        reset({
          whatsappNumber: data.whatsappNumber || '',
          supportEmail: data.supportEmail || '',
          address: data.address || '',
          paymentMethods: data.paymentMethods || [],
          socialLinks: data.socialLinks || { github: '', linkedin: '', youtube: '' },
        });
      } catch (err) {
        toast.error(err.message || 'Failed to load system settings.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [reset]);

  const onSubmit = async (values) => {
    try {
      await settingsService.updateAdminSettings(values);
      setSavedSuccess(true);
      toast.success('System settings and payment channels updated.');
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      toast.error(err.message || 'Failed to save settings.');
    }
  };

  if (loading) {
    return (
      <div className="py-8 space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Payment Channels & Contact Settings"
        description="Configure domestic payment receiver accounts (JazzCash, Easypaisa, Bank IBFT) and support contacts."
        breadcrumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Settings' },
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* PAYMENT METHODS SECTION */}
        <Card>
          <CardHeader
            title="Domestic Payment Methods"
            subtitle="Account details students copy when requesting enrollment."
            action={
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={Plus}
                onClick={() =>
                  append({
                    type: 'jazzcash',
                    accountTitle: '',
                    accountNumber: '',
                    instructions: '',
                  })
                }
              >
                Add Account
              </Button>
            }
          />
          <CardContent className="space-y-4">
            {fields.map((field, idx) => (
              <div key={field.id} className="p-4 bg-surface-alt/40 border border-line rounded space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-ink uppercase tracking-wider">
                    Channel #{idx + 1}
                  </span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="text-xs text-danger hover:underline inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField id={`pm-type-${idx}`} label="Channel Type" required>
                    <Select id={`pm-type-${idx}`} {...register(`paymentMethods.${idx}.type`)}>
                      <option value="jazzcash">JazzCash</option>
                      <option value="easypaisa">Easypaisa</option>
                      <option value="bank">Direct Bank (IBFT)</option>
                      <option value="other">Other Wallet</option>
                    </Select>
                  </FormField>

                  <FormField id={`pm-title-${idx}`} label="Account Title" required>
                    <Input
                      id={`pm-title-${idx}`}
                      placeholder="e.g. CodeCraft Academy"
                      {...register(`paymentMethods.${idx}.accountTitle`)}
                    />
                  </FormField>

                  <FormField id={`pm-num-${idx}`} label="Account Number / IBAN" required>
                    <Input
                      id={`pm-num-${idx}`}
                      placeholder="03001234567 or IBAN"
                      {...register(`paymentMethods.${idx}.accountNumber`)}
                    />
                  </FormField>
                </div>

                <FormField id={`pm-inst-${idx}`} label="Special Payment Instructions (Optional)">
                  <Input
                    id={`pm-inst-${idx}`}
                    placeholder="e.g. Enter your mobile number in payment description"
                    {...register(`paymentMethods.${idx}.instructions`)}
                  />
                </FormField>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* CONTACT & SUPPORT DETAILS */}
        <Card>
          <CardHeader title="Support & Admissions Contact" subtitle="Displayed across the website footer and student notifications." />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField id="s-whatsapp" label="Support WhatsApp Number" required error={errors.whatsappNumber?.message}>
                <Input id="s-whatsapp" placeholder="+92 300 1234567" leftIcon={Phone} {...register('whatsappNumber')} />
              </FormField>

              <FormField id="s-email" label="Admissions Support Email" required error={errors.supportEmail?.message}>
                <Input id="s-email" type="email" placeholder="admissions@codecraft.academy" leftIcon={Mail} {...register('supportEmail')} />
              </FormField>
            </div>

            <FormField id="s-address" label="Physical Address" required error={errors.address?.message}>
              <Input id="s-address" placeholder="Gulberg III, Lahore, Pakistan" leftIcon={MapPin} {...register('address')} />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-line">
              <FormField id="s-github" label="GitHub Profile">
                <Input id="s-github" placeholder="https://github.com/..." {...register('socialLinks.github')} />
              </FormField>

              <FormField id="s-linkedin" label="LinkedIn Profile">
                <Input id="s-linkedin" placeholder="https://linkedin.com/in/..." {...register('socialLinks.linkedin')} />
              </FormField>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <span className="text-xs text-success flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Settings saved successfully
            </span>
          )}
          <div className="ml-auto">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
            >
              Save Settings
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsPage;
