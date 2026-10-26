import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import enrollmentService from '../../services/enrollment.service';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Skeleton,
  useToast,
} from '../../components/ui';

export const MyEnrollmentsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cancellation state
  const [cancelTargetId, setCancelTargetId] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchEnrollments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await enrollmentService.getMyEnrollments();
      setEnrollments(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load your enrollments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'My Enrollments & Payments — CodeCraft Academy';
    fetchEnrollments();
  }, []);

  const handleCancelConfirm = async () => {
    if (!cancelTargetId) return;

    setCancelling(true);
    try {
      await enrollmentService.cancelEnrollment(cancelTargetId);
      toast.success('Enrollment request cancelled.');
      setCancelTargetId(null);
      fetchEnrollments();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel enrollment request.');
    } finally {
      setCancelling(false);
    }
  };

  const formatPKR = (val) => {
    return `Rs. ${Number(val || 0).toLocaleString('en-PK')}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success" dot>Approved</Badge>;
      case 'pending':
        return <Badge variant="warning" dot>Pending Verification</Badge>;
      case 'rejected':
        return <Badge variant="danger" dot>Payment Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="neutral">Cancelled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Enrollments & Payments"
        description="Track your bootcamp admission status, payment receipts, and approved courses."
        breadcrumbs={[
          { label: 'Portal', to: '/student/dashboard' },
          { label: 'Enrollments & Payments' },
        ]}
      />

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      )}

      {!loading && error && (
        <div className="p-8 bg-surface border border-line rounded-lg text-center max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 text-danger mx-auto mb-2" />
          <p className="text-xs text-ink-muted mb-4">{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchEnrollments} leftIcon={RefreshCw}>
            Retry
          </Button>
        </div>
      )}

      {!loading && !error && enrollments.length === 0 && (
        <EmptyState
          icon={CreditCard}
          title="No Enrollment Requests"
          description="You haven't requested enrollment in any bootcamp cohort yet."
          actionLabel="Browse Available Bootcamps"
          onAction={() => navigate('/courses')}
        />
      )}

      {!loading && !error && enrollments.length > 0 && (
        <div className="space-y-6">
          {enrollments.map((enr) => {
            const course = enr.course || {};

            return (
              <Card key={enr._id}>
                <CardHeader
                  title={course.title || 'Bootcamp Course'}
                  subtitle={`Applied on ${new Date(enr.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                  action={getStatusBadge(enr.status)}
                />

                <CardContent className="space-y-5">
                  {/* Status Timeline */}
                  <div className="p-3 bg-surface-alt/60 rounded flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-success" />
                      <span className="font-medium text-ink">Submitted</span>
                    </div>

                    <div className="h-px bg-line-strong flex-1 mx-3" />

                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${enr.status === 'pending' ? 'bg-warning' : 'bg-success'}`} />
                      <span className="font-medium text-ink">Review</span>
                    </div>

                    <div className="h-px bg-line-strong flex-1 mx-3" />

                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          enr.status === 'approved'
                            ? 'bg-success'
                            : enr.status === 'rejected'
                            ? 'bg-danger'
                            : 'bg-line-strong'
                        }`}
                      />
                      <span className="font-medium text-ink">
                        {enr.status === 'rejected' ? 'Rejected' : 'Approved'}
                      </span>
                    </div>
                  </div>

                  {/* Rejection Notice & Re-submit action */}
                  {enr.status === 'rejected' && (
                    <div className="p-4 bg-danger-soft/60 border border-danger/30 rounded text-xs space-y-2">
                      <div className="flex items-center gap-2 text-danger font-semibold">
                        <XCircle className="w-4 h-4 stroke-[1.5]" />
                        <span>Payment Verification Failed</span>
                      </div>
                      <p className="text-ink leading-relaxed">
                        <strong>Reason from Instructor:</strong> {enr.adminNote || 'Transaction could not be verified against bank statements.'}
                      </p>
                      <div className="pt-1">
                        <Link to={`/enroll/${course._id}`}>
                          <Button variant="danger" size="sm" rightIcon={ArrowRight}>
                            Re-submit Corrected Payment Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Approved Notice */}
                  {enr.status === 'approved' && (
                    <div className="p-4 bg-success-soft/60 border border-success/30 rounded text-xs flex items-center justify-between gap-4">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-ink block">Admission Approved</span>
                          <span className="text-ink-muted">
                            Payment verified: {formatPKR(enr.amountPaid)}. Live sessions and notes are active.
                          </span>
                        </div>
                      </div>
                      <Link to={`/student/courses/${course._id}`}>
                        <Button variant="primary" size="sm">
                          Enter Course Space
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Payment Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2">
                    <div>
                      <span className="text-ink-muted block text-[11px]">Payment Channel</span>
                      <span className="font-semibold text-ink uppercase">{enr.paymentMethod}</span>
                    </div>

                    <div>
                      <span className="text-ink-muted block text-[11px]">Transaction ID</span>
                      <span className="font-mono text-ink font-medium select-all">{enr.transactionId}</span>
                    </div>

                    <div>
                      <span className="text-ink-muted block text-[11px]">Sender Name / Phone</span>
                      <span className="text-ink font-medium">{enr.senderName} ({enr.senderNumber})</span>
                    </div>

                    <div>
                      <span className="text-ink-muted block text-[11px]">Amount Due / Paid</span>
                      <span className="font-display font-semibold text-ink tabular-nums">
                        {formatPKR(enr.amountPaid || enr.amountDue)}
                      </span>
                    </div>
                  </div>

                  {enr.paymentNote && (
                    <p className="text-xs text-ink-muted italic border-t border-line/50 pt-2">
                      Note: "{enr.paymentNote}"
                    </p>
                  )}

                  {/* Pending Actions */}
                  {enr.status === 'pending' && (
                    <div className="pt-2 flex items-center justify-between border-t border-line text-xs">
                      <span className="text-ink-muted flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Awaiting instructor review</span>
                      </span>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setCancelTargetId(enr._id)}
                      >
                        Cancel Request
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!cancelTargetId}
        onClose={() => setCancelTargetId(null)}
        title="Cancel Enrollment Request"
        message="Are you sure you want to cancel this enrollment request? Your seat reservation will be released immediately."
        confirmText="Cancel Enrollment"
        cancelText="Keep Request"
        isDestructive={true}
        isLoading={cancelling}
        onConfirm={handleCancelConfirm}
      />
    </div>
  );
};

export default MyEnrollmentsPage;
