import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Receipt,
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  CreditCard,
  Building2,
  Smartphone,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import ledgerService from '../../services/ledger.service';
import courseService from '../../services/course.service';
import { useDocumentMeta } from '../../utils/seo';
import {
  PageHeader,
  Card,
  CardHeader,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
  Skeleton,
  EmptyState,
  Pagination,
  useToast,
} from '../../components/ui';

export const AdminLedgerPage = () => {
  useDocumentMeta({
    title: 'Financial Ledger & Revenue — Instructor Admin',
    description: 'Accounting ledger, tuition fee collection records, and domestic payment gateway reconciliation.',
  });

  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState(null);
  const [courses, setCourses] = useState([]);

  // Filters
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [selectedCourse, setSelectedCourse] = useState(searchParams.get('course') || '');
  const [selectedMethod, setSelectedMethod] = useState(searchParams.get('method') || 'all');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  // Copy state for transaction IDs
  const [copiedId, setCopiedId] = useState(null);

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const [ledgerRes, coursesRes] = await Promise.all([
        ledgerService.getAdminLedger({
          page,
          limit: 15,
          status: status === 'all' ? undefined : status,
          course: selectedCourse || undefined,
          paymentMethod: selectedMethod === 'all' ? undefined : selectedMethod,
          search: search || undefined,
        }),
        courseService.getCoursesAdmin(),
      ]);

      setData(ledgerRes);
      setCourses(coursesRes?.items || coursesRes || []);
    } catch (err) {
      toast.error('Failed to load financial ledger data.');
    } finally {
      setLoading(false);
    }
  }, [page, status, selectedCourse, selectedMethod, search, toast]);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const handleCopyTx = (txId) => {
    if (!txId) return;
    navigator.clipboard.writeText(txId);
    setCopiedId(txId);
    toast.success(`Copied "${txId}" to clipboard`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const response = await ledgerService.exportLedgerCSV({
        status: status === 'all' ? undefined : status,
        course: selectedCourse || undefined,
        paymentMethod: selectedMethod === 'all' ? undefined : selectedMethod,
      });

      // Create blob download
      const blob = new Blob([response.data || response], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `codecraft-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Financial ledger exported to CSV successfully.');
    } catch (err) {
      toast.error('Failed to export ledger CSV.');
    } finally {
      setExporting(false);
    }
  };

  const formatPKR = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatPKTDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('en-PK', {
        timeZone: 'Asia/Karachi',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return String(dateStr);
    }
  };

  const summary = data?.summary || {};
  const methodBreakdown = data?.methodBreakdown || [];
  const courseBreakdown = data?.courseBreakdown || [];
  const transactions = data?.transactions?.items || [];
  const pagination = data?.transactions?.pagination || { totalPages: 1, total: 0 };

  const getMethodBadge = (method) => {
    switch (method?.toLowerCase()) {
      case 'jazzcash':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-red-950/10 text-red-700 border border-red-200">
            <Smartphone className="w-2.5 h-2.5" />
            JazzCash
          </span>
        );
      case 'easypaisa':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-950/10 text-emerald-700 border border-emerald-200">
            <Smartphone className="w-2.5 h-2.5" />
            EasyPaisa
          </span>
        );
      case 'bank':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-950/10 text-blue-700 border border-blue-200">
            <Building2 className="w-2.5 h-2.5" />
            Bank (IBFT)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-ink-muted/10 text-ink border border-line">
            <CreditCard className="w-2.5 h-2.5" />
            {method || 'Manual'}
          </span>
        );
    }
  };

  const getStatusBadge = (txStatus) => {
    switch (txStatus) {
      case 'approved':
        return (
          <Badge variant="success" size="sm" className="font-mono text-[10px]">
            APPROVED
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="warning" size="sm" className="font-mono text-[10px]">
            PENDING
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="danger" size="sm" className="font-mono text-[10px]">
            REJECTED
          </Badge>
        );
      default:
        return (
          <Badge variant="default" size="sm" className="font-mono text-[10px]">
            {txStatus?.toUpperCase() || 'UNKNOWN'}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ledger & Revenue Operations"
        subtitle="Comprehensive accounting ledger, tuition collections, and domestic payment method reconciliation."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLedger}
              disabled={loading}
              icon={RefreshCw}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportCSV}
              disabled={exporting || loading}
              isLoading={exporting}
              icon={Download}
            >
              Export CSV
            </Button>
          </div>
        }
      />

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-paper">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Total Revenue Collected
          </p>
          <p className="text-2xl font-bold font-mono text-ink mt-1">
            {loading ? <Skeleton className="h-7 w-28" /> : formatPKR(summary.totalRevenue)}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            {summary.approvedCount || 0} verified paid seats
          </p>
        </Card>

        <Card className="p-4 bg-paper">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Pending Receivables
          </p>
          <p className={`text-2xl font-bold font-mono mt-1 ${summary.pendingRevenue > 0 ? 'text-warning' : 'text-ink'}`}>
            {loading ? <Skeleton className="h-7 w-24" /> : formatPKR(summary.pendingRevenue)}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            {summary.pendingCount || 0} awaiting verification
          </p>
        </Card>

        <Card className="p-4 bg-paper">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Average Tuition / Seat
          </p>
          <p className="text-2xl font-bold font-mono text-ink mt-1">
            {loading ? <Skeleton className="h-7 w-24" /> : formatPKR(summary.averagePerSeat)}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            Across active bootcamps
          </p>
        </Card>

        <Card className="p-4 bg-paper">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
            Collection Inquiries
          </p>
          <p className="text-2xl font-bold font-mono text-ink mt-1">
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              (summary.approvedCount || 0) + (summary.pendingCount || 0) + (summary.rejectedCount || 0)
            )}
          </p>
          <p className="text-[11px] text-ink-muted mt-1">
            Total transaction records
          </p>
        </Card>
      </div>

      {/* Domestic Payment Method Distribution Strip */}
      <Card>
        <CardHeader className="p-4 pb-3 border-b border-line">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink">
                Payment Channel Breakdown
              </h3>
              <p className="text-xs text-ink-muted">
                Collections aggregated across approved tuition receipts
              </p>
            </div>
            <CreditCard className="w-4 h-4 text-ink-muted" />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <Skeleton className="h-16 w-full" />
          ) : methodBreakdown.length === 0 ? (
            <div className="py-4 text-center text-xs text-ink-muted">
              No approved payments yet to display method distribution.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {methodBreakdown.map((m) => (
                  <div
                    key={m.method}
                    className="p-3 bg-surface rounded border border-line flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        {getMethodBadge(m.method)}
                        <span className="text-[11px] text-ink-muted">({m.count} tx)</span>
                      </div>
                      <p className="text-base font-bold font-mono text-ink mt-1">
                        {formatPKR(m.totalAmount)}
                      </p>
                    </div>
                    <span className="text-lg font-mono font-bold text-ink-muted">
                      {m.percentage}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Stacked Visual Bar */}
              <div className="h-2 w-full rounded-full bg-surface-alt overflow-hidden flex">
                {methodBreakdown.map((m, idx) => {
                  const colors = ['bg-primary', 'bg-emerald-600', 'bg-blue-600', 'bg-amber-600'];
                  return (
                    <div
                      key={m.method}
                      style={{ width: `${m.percentage}%` }}
                      className={`${colors[idx % colors.length]} h-full transition-all`}
                      title={`${m.method}: ${formatPKR(m.totalAmount)} (${m.percentage}%)`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cohort Revenue Breakdown Table */}
      {courseBreakdown.length > 0 && (
        <Card>
          <CardHeader className="p-4 pb-2 border-b border-line">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-ink">
                  Revenue by Bootcamp Cohort
                </h3>
                <p className="text-xs text-ink-muted">
                  Cohort enrollment capacity and gross revenue ledger
                </p>
              </div>
              <TrendingUp className="w-4 h-4 text-ink-muted" />
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface border-b border-line font-mono text-ink-muted uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Bootcamp Cohort</th>
                  <th className="py-2.5 px-4 font-medium">Tuition Fee</th>
                  <th className="py-2.5 px-4 font-medium">Approved Seats</th>
                  <th className="py-2.5 px-4 font-medium">Pending Verification</th>
                  <th className="py-2.5 px-4 font-medium text-right">Total Collected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {courseBreakdown.map((c) => (
                  <tr key={c.courseId} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-ink">
                      {c.courseTitle}
                    </td>
                    <td className="py-3 px-4 font-mono text-ink">
                      {formatPKR(c.courseFee)}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="font-semibold text-ink">{c.approvedSeats}</span>
                      <span className="text-ink-muted"> / {c.seatsTotal || 25} capacity</span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {c.pendingSeats > 0 ? (
                        <span className="text-warning font-semibold">{c.pendingSeats} pending</span>
                      ) : (
                        <span className="text-ink-muted">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-ink text-right">
                      {formatPKR(c.totalCollected)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Main Financial Transactions Ledger */}
      <Card>
        <CardHeader className="p-4 pb-3 border-b border-line space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-ink">
                Transaction Journal & Receipts
              </h3>
              <p className="text-xs text-ink-muted">
                Line-item audit of every domestic transaction, reference ID, and student verification
              </p>
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-surface p-1 rounded border border-line text-xs">
              {['all', 'approved', 'pending', 'rejected'].map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setStatus(st);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded transition-colors capitalize ${
                    status === st
                      ? 'bg-paper text-ink font-semibold shadow-xs'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <Input
              type="text"
              placeholder="Search Tx ID, student name, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              icon={Search}
              size="sm"
            />

            <Select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setPage(1);
              }}
              size="sm"
            >
              <option value="">All Cohorts</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </Select>

            <Select
              value={selectedMethod}
              onChange={(e) => {
                setSelectedMethod(e.target.value);
                setPage(1);
              }}
              size="sm"
            >
              <option value="all">All Payment Channels</option>
              <option value="jazzcash">JazzCash</option>
              <option value="easypaisa">EasyPaisa</option>
              <option value="bank">Bank Transfer (IBFT)</option>
              <option value="other">Other / Manual</option>
            </Select>
          </div>
        </CardHeader>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface border-b border-line font-mono text-ink-muted uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-4 font-medium">Date (PKT)</th>
                <th className="py-2.5 px-4 font-medium">Transaction ID</th>
                <th className="py-2.5 px-4 font-medium">Student</th>
                <th className="py-2.5 px-4 font-medium">Cohort</th>
                <th className="py-2.5 px-4 font-medium">Channel</th>
                <th className="py-2.5 px-4 font-medium">Sender</th>
                <th className="py-2.5 px-4 font-medium">Amount</th>
                <th className="py-2.5 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="py-3 px-4">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-ink-muted">
                    <EmptyState
                      title="No transactions found"
                      description="No ledger receipts match your selected filter criteria."
                      icon={Receipt}
                    />
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-ink-muted whitespace-nowrap">
                      {formatPKTDate(tx.createdAt)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-medium text-ink text-[11px]">
                          {tx.transactionId || '—'}
                        </span>
                        {tx.transactionId && (
                          <button
                            type="button"
                            onClick={() => handleCopyTx(tx.transactionId)}
                            className="text-ink-muted hover:text-ink transition-colors p-0.5 rounded hover:bg-surface"
                            title="Copy Transaction ID"
                          >
                            {copiedId === tx.transactionId ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-ink">{tx.student?.name || '—'}</p>
                      <p className="text-[10px] text-ink-muted font-mono">{tx.student?.email || '—'}</p>
                    </td>
                    <td className="py-3 px-4 text-ink max-w-[180px] truncate">
                      {tx.course?.title || '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getMethodBadge(tx.paymentMethod)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-ink">{tx.senderName || '—'}</p>
                      <p className="text-[10px] font-mono text-ink-muted">{tx.senderNumber || '—'}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-ink whitespace-nowrap">
                      {tx.status === 'approved'
                        ? formatPKR(tx.amountPaid)
                        : formatPKR(tx.amountDue)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(tx.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-line flex items-center justify-between">
            <p className="text-xs text-ink-muted">
              Showing page <span className="font-mono font-medium text-ink">{page}</span> of{' '}
              <span className="font-mono font-medium text-ink">{pagination.totalPages}</span> (
              <span className="font-mono">{pagination.total}</span> total transactions)
            </p>
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminLedgerPage;
