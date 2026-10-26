import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Calendar,
  Clock,
  CreditCard,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import courseService from '../../services/course.service';
import enrollmentService from '../../services/enrollment.service';
import settingsService from '../../services/settings.service';
import { useAuth } from '../../context/AuthContext';
import {
  Card,
  CardHeader,
  CardContent,
  FormField,
  Input,
  Textarea,
  Radio,
  Button,
  Badge,
  Skeleton,
  useToast,
  FileUploader,
} from '../../components/ui';

const enrollmentSchema = z.object({
  paymentMethod: z.enum(['jazzcash', 'easypaisa', 'bank', 'other']),
  transactionId: z.string().trim().min(3, 'Transaction ID / Reference number is required'),
  senderName: z.string().trim().min(2, 'Sender account name is required'),
  senderNumber: z.string().trim().min(4, 'Sender account / mobile number is required'),
  paymentNote: z.string().trim().optional(),
});

export const EnrollmentWizardPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [course, setCourse] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedAccount, setCopiedAccount] = useState(null);
  const [createdEnrollment, setCreatedEnrollment] = useState(null);
  const [serverError, setServerError] = useState('');
  const [proofKey, setProofKey] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      paymentMethod: 'jazzcash',
      transactionId: '',
      senderName: user?.name || '',
      senderNumber: user?.phone || '',
      paymentNote: '',
    },
  });

  const selectedMethod = watch('paymentMethod');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [coursesList, pubSettings] = await Promise.all([
          courseService.getPublicCourses(),
          settingsService.getPublicSettings(),
        ]);

        const targetCourse = coursesList.find((c) => c._id === courseId);
        if (!targetCourse) {
          setError('Selected bootcamp course is currently unavailable or full.');
        } else {
          setCourse(targetCourse);
          document.title = `Enrollment: ${targetCourse.title} — CodeCraft Academy`;
        }

        setSettings(pubSettings);
      } catch (err) {
        setError(err.message || 'Failed to load enrollment details.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  const copyToClipboard = (text, identifier) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(identifier);
    toast.success('Account number copied to clipboard.');
    setTimeout(() => setCopiedAccount(null), 3000);
  };

  const formatPKR = (amount) => {
    return `Rs. ${Number(amount).toLocaleString('en-PK')}`;
  };

  const onFormSubmit = async (values) => {
    setServerError('');
    try {
      const response = await enrollmentService.createEnrollment({
        courseId: course._id,
        paymentMethod: values.paymentMethod,
        transactionId: values.transactionId,
        senderName: values.senderName,
        senderNumber: values.senderNumber,
        paymentNote: values.paymentNote,
        paymentProofKey: proofKey || undefined,
      });

      setCreatedEnrollment(response);
      setStep(3); // Advance to Confirmation
    } catch (err) {
      setServerError(err.message || 'Enrollment request failed. Please check your transaction details.');
    }
  };

  if (loading) {
    return (
      <div className="py-12 max-w-form mx-auto px-4 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="py-16 max-w-md mx-auto px-4 text-center">
        <AlertCircle className="w-10 h-10 text-danger mx-auto mb-3" />
        <h2 className="font-display font-semibold text-xl text-ink">Cannot Proceed with Enrollment</h2>
        <p className="text-xs text-ink-muted mt-2 mb-6">{error}</p>
        <Link to="/courses">
          <Button variant="secondary" size="md">
            Return to Bootcamps
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-10 max-w-form mx-auto px-4 sm:px-6">
      {/* 3-Step Breadcrumb Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-medium text-ink-muted select-none">
          <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-primary font-semibold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 1 ? 'bg-primary text-surface' : 'bg-surface-alt text-ink-muted'}`}>
              1
            </span>
            <span>Review & Fee</span>
          </div>

          <div className="h-px bg-line flex-1 mx-3" />

          <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-primary font-semibold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 2 ? 'bg-primary text-surface' : 'bg-surface-alt text-ink-muted'}`}>
              2
            </span>
            <span>Payment Proof</span>
          </div>

          <div className="h-px bg-line flex-1 mx-3" />

          <div className={`flex items-center gap-1.5 ${step === 3 ? 'text-primary font-semibold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${step === 3 ? 'bg-primary text-surface' : 'bg-surface-alt text-ink-muted'}`}>
              3
            </span>
            <span>Confirmation</span>
          </div>
        </div>
      </div>

      {/* STEP 1: REVIEW COURSE & FEE */}
      {step === 1 && (
        <Card>
          <CardHeader
            title="Step 1: Review Course & Tuition Fee"
            subtitle="Verify schedule and payment amount before making your transfer."
          />
          <CardContent className="space-y-6">
            <div className="p-4 bg-surface-alt rounded space-y-2">
              <span className="text-[11px] font-mono text-ink-muted uppercase">Selected Bootcamp</span>
              <h3 className="font-display font-semibold text-lg text-ink">
                {course.title}
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                {course.tagline}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-line">
                <span className="text-ink-muted flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Start Date</span>
                </span>
                <span className="font-medium text-ink">
                  {new Date(course.startDate).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-line">
                <span className="text-ink-muted flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Class Schedule</span>
                </span>
                <span className="font-medium text-ink">{course.schedule}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-line">
                <span className="text-ink-muted flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Total Tuition Due</span>
                </span>
                <span className="font-display font-semibold text-base text-ink tabular-nums">
                  {formatPKR(course.fee)}
                </span>
              </div>
            </div>

            {course.installmentsAllowed && course.installmentPlan && (
              <div className="p-3 bg-primary-soft/50 border border-primary/20 rounded text-xs text-primary space-y-1">
                <span className="font-semibold block">Installment Notice</span>
                <p className="text-[11px] leading-relaxed">{course.installmentPlan}</p>
              </div>
            )}

            <div className="pt-4 flex items-center justify-between border-t border-line">
              <Link to={`/courses/${course.slug}`}>
                <Button variant="ghost" size="md" leftIcon={ArrowLeft}>
                  Back
                </Button>
              </Link>
              <Button
                variant="primary"
                size="md"
                onClick={() => setStep(2)}
                rightIcon={ArrowRight}
              >
                Proceed to Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: PAYMENT INSTRUCTIONS & TRANSACTION FORM */}
      {step === 2 && (
        <Card>
          <CardHeader
            title="Step 2: Payment Transfer & Proof"
            subtitle="Transfer tuition via JazzCash, Easypaisa, or IBFT and submit your transaction ID."
          />
          <CardContent className="space-y-6">
            {serverError && (
              <div className="p-3.5 bg-danger-soft border border-danger/30 rounded text-xs text-danger flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Official Payment Accounts with Copy Buttons */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-ink block mb-3">
                Official Account Information
              </span>
              <div className="space-y-3">
                {settings?.paymentMethods?.map((method) => {
                  const isSelected = selectedMethod === method.type;
                  const isCopied = copiedAccount === method.accountNumber;

                  return (
                    <div
                      key={method._id || method.type}
                      onClick={() => setValue('paymentMethod', method.type)}
                      className={`p-3.5 border rounded cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary-soft/20 ring-1 ring-primary'
                          : 'border-line bg-surface hover:bg-surface-alt/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-ink uppercase tracking-wide">
                            {method.type}
                          </span>
                          {isSelected && <Badge variant="primary">Selected</Badge>}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(method.accountNumber, method.accountNumber);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-muted hover:text-ink border border-line bg-surface px-2 py-1 rounded"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-success" />
                              <span className="text-success">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Account</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="text-xs space-y-0.5">
                        <p className="text-ink font-medium">Title: {method.accountTitle}</p>
                        <p className="font-mono text-ink-muted select-all">
                          Number: <span className="font-semibold text-ink">{method.accountNumber}</span>
                        </p>
                        {method.instructions && (
                          <p className="text-[11px] text-ink-muted pt-1 leading-relaxed">
                            {method.instructions}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Transaction Form */}
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 pt-4 border-t border-line" noValidate>
              <span className="text-xs font-semibold uppercase tracking-wider text-ink block">
                Submit Your Transaction Proof
              </span>

              <FormField
                id="txn-id"
                label="Transaction ID / Reference Number"
                required
                error={errors.transactionId?.message}
                helperText="Found in your bank/JazzCash confirmation SMS or receipt"
              >
                <Input
                  id="txn-id"
                  placeholder="e.g. 1283918239 or IBFT-0981"
                  hasError={!!errors.transactionId}
                  {...register('transactionId')}
                />
              </FormField>

              <FormField
                id="sender-name"
                label="Sender Account Title / Name"
                required
                error={errors.senderName?.message}
                helperText="Name of the person who sent the funds"
              >
                <Input
                  id="sender-name"
                  placeholder="e.g. Muhammad Ali"
                  hasError={!!errors.senderName}
                  {...register('senderName')}
                />
              </FormField>

              <FormField
                id="sender-number"
                label="Sender Mobile / Account Number"
                required
                error={errors.senderNumber?.message}
                helperText="The mobile or account number from which money was transferred"
              >
                <Input
                  id="sender-number"
                  placeholder="e.g. 0300 1234567"
                  hasError={!!errors.senderNumber}
                  {...register('senderNumber')}
                />
              </FormField>

              <FileUploader
                kind="image"
                accept="image/png,image/jpeg"
                label="Payment Receipt Screenshot (Optional)"
                helperText="Upload a screenshot or photo of your transfer receipt (PNG or JPG up to 5MB)"
                value={proofKey}
                onChange={setProofKey}
              />

              <FormField
                id="payment-note"
                label="Payment Note / Installment Detail (Optional)"
                helperText="Any additional notes or bank branch info"
              >
                <Textarea
                  id="payment-note"
                  rows={2}
                  placeholder="e.g. Transferred 1st installment of Rs. 12,000 via Meezan mobile app"
                  {...register('paymentNote')}
                />
              </FormField>

              <div className="pt-4 flex items-center justify-between border-t border-line">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setStep(1)}
                  leftIcon={ArrowLeft}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                >
                  Submit Payment Proof
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: CONFIRMATION */}
      {step === 3 && (
        <Card>
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-12 h-12 rounded-full bg-warning-soft text-warning flex items-center justify-center mx-auto border border-warning/20">
              <CheckCircle2 className="w-6 h-6 stroke-[1.5]" />
            </div>

            <div className="space-y-2">
              <Badge variant="warning" dot>
                Enrollment Pending Verification
              </Badge>
              <h2 className="font-display font-semibold text-2xl text-ink">
                Payment Request Submitted
              </h2>
              <p className="text-xs text-ink-muted max-w-sm mx-auto leading-relaxed">
                Thank you! Your payment details for <strong className="text-ink">{course.title}</strong> have been logged.
              </p>
            </div>

            <div className="p-4 bg-surface-alt rounded text-left text-xs space-y-2 max-w-sm mx-auto">
              <div className="flex justify-between">
                <span className="text-ink-muted">Transaction ID:</span>
                <span className="font-mono font-medium text-ink">
                  {createdEnrollment?.transactionId || watch('transactionId')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Tuition Due:</span>
                <span className="font-medium text-ink">{formatPKR(course.fee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Verification Window:</span>
                <span className="font-medium text-ink">Within 24 Hours</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/student/payments">
                <Button variant="primary" size="md">
                  View My Enrollments
                </Button>
              </Link>
              <Link to="/student/dashboard">
                <Button variant="secondary" size="md">
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnrollmentWizardPage;
