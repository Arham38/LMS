import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  X,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import enrollmentService from '../../services/enrollment.service';
import courseService from '../../services/course.service';
import storageService from '../../services/storage.service';
import {
  PageHeader,
  Button,
  Tabs,
  Table,
  Badge,
  Input,
  Select,
  ConfirmDialog,
  FormField,
  Textarea,
  Avatar,
  Spinner,
  useToast,
} from '../../components/ui';

export const AdminEnrollmentsPage = () => {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('pending');
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  // Slide-over side panel
  const [activePanelEnrollment, setActivePanelEnrollment] = useState(null);
  const [proofUrl, setProofUrl] = useState(null);
  const [loadingProof, setLoadingProof] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (activePanelEnrollment?.paymentProofKey) {
      setLoadingProof(true);
      setProofUrl(null);
      storageService
        .getFileUrl(activePanelEnrollment.paymentProofKey)
        .then((res) => {
          if (isMounted) {
            setProofUrl(res?.downloadUrl || null);
          }
        })
        .catch((err) => {
          console.error('Failed to load payment proof signed URL:', err);
          if (isMounted) {
            setProofUrl(null);
          }
        })
        .finally(() => {
          if (isMounted) {
            setLoadingProof(false);
          }
        });
    } else {
      setProofUrl(null);
      setLoadingProof(false);
    }
    return () => {
      isMounted = false;
    };
  }, [activePanelEnrollment?.paymentProofKey]);

  // Review Dialog States
  const [reviewAction, setReviewAction] = useState(null); // 'approve' | 'reject' | null
  const [customAmountPaid, setCustomAmountPaid] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchEnrollments = async () => {
    setLoading(true);
    try {
      const [res, countRes, coursesRes] = await Promise.all([
        enrollmentService.getAdminEnrollments({
          page,
          limit: 15,
          status: activeTab === 'all' ? undefined : activeTab,
          course: selectedCourse || undefined,
          search: search || undefined,
        }),
        enrollmentService.getPendingCount(),
        courseService.getAdminCourses({ limit: 50 }),
      ]);

      setEnrollments(res.items || []);
      setTotal(res.total || 0);
      setPendingCount(countRes?.count || 0);
      setCourses(coursesRes.items || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load enrollments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Enrollment Queue — Admin Workspace';
    fetchEnrollments();
  }, [page, activeTab, selectedCourse]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEnrollments();
  };

  const handleOpenApproveDialog = (enr) => {
    setReviewAction('approve');
    setCustomAmountPaid(String(enr.amountDue));
  };

  const handleOpenRejectDialog = (enr) => {
    setReviewAction('reject');
    setRejectReason('');
  };

  const handleReviewSubmit = async () => {
    if (!activePanelEnrollment || !reviewAction) return;

    if (reviewAction === 'reject' && (!rejectReason || rejectReason.trim().length === 0)) {
      toast.error('A rejection reason is required to notify the student.');
      return;
    }

    setReviewLoading(true);
    try {
      const payload = {
        action: reviewAction,
        amountPaid: reviewAction === 'approve' ? Number(customAmountPaid || activePanelEnrollment.amountDue) : undefined,
        adminNote: reviewAction === 'reject' ? rejectReason : undefined,
      };

      const updated = await enrollmentService.reviewEnrollment(activePanelEnrollment._id, payload);
      toast.success(`Enrollment successfully ${reviewAction === 'approve' ? 'approved' : 'rejected'}.`);

      // Update local state
      setActivePanelEnrollment(updated);
      setReviewAction(null);
      fetchEnrollments();
    } catch (err) {
      toast.error(err.message || 'Failed to update enrollment status.');
    } finally {
      setReviewLoading(false);
    }
  };

  const formatPKR = (val) => `Rs. ${Number(val || 0).toLocaleString('en-PK')}`;

  const tabs = [
    { id: 'pending', label: 'Pending Review', count: pendingCount },
    { id: 'approved', label: 'Approved Students' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'all', label: 'All Requests' },
  ];

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (_, row) => {
        const student = row.student || {};
        return (
          <div className="flex items-center gap-2.5">
            <Avatar name={student.name || 'Student'} size="sm" />
            <div className="flex flex-col">
              <span className="font-medium text-ink">{student.name}</span>
              <span className="text-[11px] text-ink-muted font-mono">{student.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'course',
      header: 'Course & Cohort',
      render: (_, row) => (
        <span className="text-xs text-ink truncate max-w-[200px] block" title={row.course?.title}>
          {row.course?.title}
        </span>
      ),
    },
    {
      key: 'transactionId',
      header: 'Transaction ID',
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs text-ink font-semibold select-all">{val}</span>
          <span className="text-[11px] text-ink-muted uppercase">{row.paymentMethod}</span>
        </div>
      ),
    },
    {
      key: 'amountDue',
      header: 'Tuition Fee',
      align: 'right',
      render: (val, row) => (
        <span className="font-display font-semibold text-xs text-ink tabular-nums">
          {formatPKR(row.amountPaid || val)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (val) => {
        const map = {
          approved: { variant: 'success', label: 'Approved' },
          pending: { variant: 'warning', label: 'Pending' },
          rejected: { variant: 'danger', label: 'Rejected' },
          cancelled: { variant: 'neutral', label: 'Cancelled' },
        };
        const conf = map[val] || { variant: 'neutral', label: val };
        return <Badge variant={conf.variant} dot>{conf.label}</Badge>;
      },
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (val) => (
        <span className="text-xs text-ink-muted">
          {new Date(val).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (_, row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setActivePanelEnrollment(row)}
        >
          Review
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enrollment Requests & Verification"
        description="Verify manual domestic payment receipts (JazzCash, Easypaisa, Bank IBFT) and approve student seats."
        breadcrumbs={[
          { label: 'Admin', to: '/admin/dashboard' },
          { label: 'Enrollments' },
        ]}
        action={
          <Button variant="secondary" size="md" leftIcon={RefreshCw} onClick={fetchEnrollments}>
            Refresh Queue
          </Button>
        }
      />

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => { setActiveTab(id); setPage(1); }} />

      {/* Filters Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-3 border border-line rounded-lg">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-sm w-full">
          <Input
            placeholder="Search student, email, phone, or TID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={Search}
          />
        </form>

        <div className="w-full sm:w-auto">
          <Select
            value={selectedCourse}
            onChange={(e) => { setSelectedCourse(e.target.value); setPage(1); }}
            className="w-full sm:w-[240px]"
          >
            <option value="">All Bootcamps</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={enrollments}
        isLoading={loading}
        emptyTitle="No Enrollment Requests"
        emptyDescription={`There are currently no enrollments under '${activeTab}'.`}
        pagination={{
          page,
          limit: 15,
          total,
          totalPages: Math.ceil(total / 15) || 1,
        }}
        onPageChange={(p) => setPage(p)}
      />

      {/* Slide-over Side Panel for Enrollment Review */}
      {activePanelEnrollment && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-ink/40 transition-opacity duration-200"
            onClick={() => setActivePanelEnrollment(null)}
          />

          {/* Panel Container */}
          <div className="relative w-full max-w-md bg-surface border-l border-line h-full shadow-popover z-10 flex flex-col justify-between overflow-y-auto">
            {/* Header */}
            <div className="px-5 py-4 border-b border-line flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  Enrollment Review
                </span>
                <h3 className="font-display font-semibold text-base text-ink">
                  {activePanelEnrollment.student?.name}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setActivePanelEnrollment(null)}
                className="p-1 text-ink-muted hover:text-ink rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Details */}
            <div className="p-6 space-y-6 flex-1 text-xs">
              {/* Status Badge */}
              <div className="flex justify-between items-center pb-3 border-b border-line">
                <span className="text-ink-muted font-medium">Application Status</span>
                <Badge
                  variant={
                    activePanelEnrollment.status === 'approved'
                      ? 'success'
                      : activePanelEnrollment.status === 'rejected'
                      ? 'danger'
                      : 'warning'
                  }
                  dot
                >
                  {activePanelEnrollment.status.toUpperCase()}
                </Badge>
              </div>

              {/* Student Information */}
              <div className="space-y-2">
                <span className="font-semibold text-ink uppercase tracking-wider text-[11px] block">
                  Student Information
                </span>
                <div className="p-3 bg-surface-alt/60 rounded space-y-1.5">
                  <p><strong className="text-ink-muted">Name:</strong> {activePanelEnrollment.student?.name}</p>
                  <p><strong className="text-ink-muted">Email:</strong> {activePanelEnrollment.student?.email}</p>
                  <p><strong className="text-ink-muted">Phone:</strong> {activePanelEnrollment.student?.phone || 'Not provided'}</p>
                </div>
              </div>

              {/* Course & Fee */}
              <div className="space-y-2">
                <span className="font-semibold text-ink uppercase tracking-wider text-[11px] block">
                  Bootcamp Course
                </span>
                <div className="p-3 bg-surface-alt/60 rounded space-y-1.5">
                  <p className="font-medium text-ink">{activePanelEnrollment.course?.title}</p>
                  <div className="flex justify-between pt-1 border-t border-line/60">
                    <span className="text-ink-muted">Tuition Due:</span>
                    <span className="font-display font-semibold text-ink tabular-nums">
                      {formatPKR(activePanelEnrollment.amountDue)}
                    </span>
                  </div>
                  {activePanelEnrollment.amountPaid > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Confirmed Paid:</span>
                      <span className="font-semibold tabular-nums">{formatPKR(activePanelEnrollment.amountPaid)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Receipt Submission */}
              <div className="space-y-2">
                <span className="font-semibold text-ink uppercase tracking-wider text-[11px] block">
                  Domestic Payment Details
                </span>
                <div className="p-3 bg-surface-alt/60 rounded space-y-2">
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Channel:</span>
                    <span className="font-semibold text-ink uppercase">{activePanelEnrollment.paymentMethod}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-ink-muted">Transaction ID:</span>
                    <span className="font-mono font-bold text-ink select-all">{activePanelEnrollment.transactionId}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-ink-muted">Sender Account:</span>
                    <span className="text-ink font-medium">{activePanelEnrollment.senderName} ({activePanelEnrollment.senderNumber})</span>
                  </div>

                  {activePanelEnrollment.paymentNote && (
                    <div className="pt-2 border-t border-line/60 text-ink-muted italic">
                      Note: "{activePanelEnrollment.paymentNote}"
                    </div>
                  )}

                  {/* Payment Proof Receipt Screenshot */}
                  <div className="pt-2 border-t border-line/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-ink-muted font-medium">Receipt Screenshot:</span>
                      {proofUrl && (
                        <a
                          href={proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 font-medium"
                        >
                          <span>Open Image</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {activePanelEnrollment.paymentProofKey ? (
                      loadingProof ? (
                        <div className="h-28 bg-surface flex items-center justify-center border border-line rounded">
                          <Spinner size="sm" />
                        </div>
                      ) : proofUrl ? (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-mono text-ink-muted block truncate" title={activePanelEnrollment.paymentProofName || storageService.getDisplayFilename(activePanelEnrollment.paymentProofKey)}>
                            {activePanelEnrollment.paymentProofName || storageService.getDisplayFilename(activePanelEnrollment.paymentProofKey)}
                          </span>
                          <a
                            href={proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group overflow-hidden rounded border border-line bg-surface"
                          >
                            <img
                              src={proofUrl}
                              alt="Payment receipt proof"
                              className="w-full max-h-48 object-contain p-1 group-hover:scale-[1.01] transition-transform"
                            />
                          </a>
                        </div>
                      ) : (
                        <div className="text-[11px] text-danger bg-danger-soft/40 p-2 rounded border border-danger/20">
                          Unable to generate preview link.
                        </div>
                      )
                    ) : (
                      <div className="text-[11px] text-ink-muted italic">
                        No receipt screenshot uploaded by student.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rejection / Admin Note */}
              {activePanelEnrollment.adminNote && (
                <div className="p-3 bg-danger-soft/60 border border-danger/20 rounded space-y-1">
                  <span className="font-semibold text-danger block">Instructor Rejection Note</span>
                  <p className="text-ink leading-relaxed">{activePanelEnrollment.adminNote}</p>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="p-5 border-t border-line bg-surface-alt/30 flex items-center justify-between gap-3">
              {activePanelEnrollment.status !== 'approved' && (
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  leftIcon={CheckCircle2}
                  onClick={() => handleOpenApproveDialog(activePanelEnrollment)}
                >
                  Approve Seat
                </Button>
              )}

              {activePanelEnrollment.status !== 'rejected' && (
                <Button
                  variant="danger"
                  size="md"
                  className="flex-1"
                  leftIcon={XCircle}
                  onClick={() => handleOpenRejectDialog(activePanelEnrollment)}
                >
                  Reject Proof
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Dialog */}
      <ConfirmDialog
        isOpen={reviewAction === 'approve'}
        onClose={() => setReviewAction(null)}
        title="Approve Student Enrollment"
        message={`Confirm tuition payment receipt for ${activePanelEnrollment?.student?.name}. The student will immediately gain full classroom access.`}
        confirmText="Confirm & Approve Seat"
        cancelText="Cancel"
        isDestructive={false}
        isLoading={reviewLoading}
        onConfirm={handleReviewSubmit}
      />

      {/* Reject Dialog with required reason */}
      {reviewAction === 'reject' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40">
          <div className="w-full max-w-md bg-surface border border-line rounded-lg shadow-popover p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-danger-soft text-danger flex items-center justify-center shrink-0 border border-danger/20">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-base text-ink">
                  Reject Payment Receipt
                </h3>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Provide a clear reason for why the transaction could not be verified (e.g. invalid TID, amount mismatch).
                </p>
              </div>
            </div>

            <FormField id="reject-reason" label="Rejection Reason" required helperText="The student will see this note to correct and re-submit">
              <Textarea
                id="reject-reason"
                rows={3}
                placeholder="e.g. Transaction ID was not found in our bank statement. Please verify the 12-digit number."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </FormField>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button variant="secondary" size="md" onClick={() => setReviewAction(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                isLoading={reviewLoading}
                onClick={handleReviewSubmit}
              >
                Reject Enrollment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEnrollmentsPage;
