import Enrollment from '../models/enrollment.model.js';
import Course from '../models/course.model.js';
import User from '../models/user.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, formatPagination } from '../utils/response.js';

/**
 * GET /api/admin/ledger
 * Real-time financial ledger, revenue aggregation and transaction log
 */
export const getAdminLedger = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, course, paymentMethod, search } = req.query;

  // 1. Revenue & Status Summary Aggregation
  const summaryAgg = await Enrollment.aggregate([
    {
      $group: {
        _id: '$status',
        totalPaid: { $sum: '$amountPaid' },
        totalDue: { $sum: '$amountDue' },
        count: { $sum: 1 },
      },
    },
  ]);

  let totalRevenue = 0;
  let pendingRevenue = 0;
  let approvedCount = 0;
  let pendingCount = 0;
  let rejectedCount = 0;

  summaryAgg.forEach((item) => {
    if (item._id === 'approved') {
      totalRevenue = item.totalPaid || 0;
      approvedCount = item.count;
    } else if (item._id === 'pending') {
      pendingRevenue = item.totalDue || 0;
      pendingCount = item.count;
    } else if (item._id === 'rejected') {
      rejectedCount = item.count;
    }
  });

  const averagePerSeat = approvedCount > 0 ? Math.round(totalRevenue / approvedCount) : 0;

  // 2. Revenue Breakdown by Payment Method (Approved only)
  const methodAgg = await Enrollment.aggregate([
    { $match: { status: 'approved' } },
    {
      $group: {
        _id: '$paymentMethod',
        totalAmount: { $sum: '$amountPaid' },
        count: { $sum: 1 },
      },
    },
    { $sort: { totalAmount: -1 } },
  ]);

  const methodBreakdown = methodAgg.map((m) => ({
    method: m._id || 'other',
    totalAmount: m.totalAmount,
    count: m.count,
    percentage: totalRevenue > 0 ? Math.round((m.totalAmount / totalRevenue) * 100) : 0,
  }));

  // 3. Revenue Breakdown by Course Cohort
  const courseAgg = await Enrollment.aggregate([
    {
      $group: {
        _id: '$course',
        totalCollected: {
          $sum: { $cond: [{ $eq: ['$status', 'approved'] }, '$amountPaid', 0] },
        },
        approvedSeats: {
          $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
        },
        pendingSeats: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
        },
        totalRequests: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'courses',
        localField: '_id',
        foreignField: '_id',
        as: 'course',
      },
    },
    { $unwind: '$course' },
    {
      $project: {
        courseId: '$_id',
        courseTitle: '$course.title',
        courseFee: '$course.fee',
        seatsTotal: '$course.seatsTotal',
        totalCollected: 1,
        approvedSeats: 1,
        pendingSeats: 1,
        totalRequests: 1,
      },
    },
    { $sort: { totalCollected: -1 } },
  ]);

  // 4. Build Paginated Transactions Query
  const query = {};

  if (status && status !== 'all') {
    query.status = status;
  }

  if (course) {
    query.course = course;
  }

  if (paymentMethod && paymentMethod !== 'all') {
    query.paymentMethod = paymentMethod;
  }

  if (search) {
    const [matchingUsers, matchingCourses] = await Promise.all([
      User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      }).select('_id'),
      Course.find({
        title: { $regex: search, $options: 'i' },
      }).select('_id'),
    ]);

    const userIds = matchingUsers.map((u) => u._id);
    const courseIds = matchingCourses.map((c) => c._id);

    query.$or = [
      { student: { $in: userIds } },
      { course: { $in: courseIds } },
      { transactionId: { $regex: search, $options: 'i' } },
      { senderName: { $regex: search, $options: 'i' } },
      { senderNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    Enrollment.find(query)
      .populate('student', 'name email phone')
      .populate('course', 'title slug fee')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Enrollment.countDocuments(query),
  ]);

  return sendSuccess(res, {
    data: {
      summary: {
        totalRevenue,
        pendingRevenue,
        approvedCount,
        pendingCount,
        rejectedCount,
        averagePerSeat,
      },
      methodBreakdown,
      courseBreakdown: courseAgg,
      transactions: formatPagination({ items, total, page: pageNum, limit: limitNum }),
    },
  });
});

/**
 * GET /api/admin/ledger/export
 * Export complete transaction ledger as CSV
 */
export const exportAdminLedgerCSV = asyncHandler(async (req, res) => {
  const { status, course, paymentMethod } = req.query;

  const query = {};
  if (status && status !== 'all') query.status = status;
  if (course) query.course = course;
  if (paymentMethod && paymentMethod !== 'all') query.paymentMethod = paymentMethod;

  const enrollments = await Enrollment.find(query)
    .populate('student', 'name email phone')
    .populate('course', 'title fee')
    .populate('reviewedBy', 'name email')
    .sort({ createdAt: -1 });

  // Build CSV content
  const headers = [
    'Date (PKT)',
    'Transaction ID',
    'Student Name',
    'Student Email',
    'Student Phone',
    'Course Cohort',
    'Payment Channel',
    'Sender Name',
    'Sender Account',
    'Amount Due (PKR)',
    'Amount Paid (PKR)',
    'Status',
    'Reviewed By',
    'Reviewed At (PKT)',
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = enrollments.map((e) => {
    const datePKT = e.createdAt
      ? new Date(e.createdAt).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })
      : '';
    const reviewedPKT = e.reviewedAt
      ? new Date(e.reviewedAt).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })
      : '';

    return [
      escapeCSV(datePKT),
      escapeCSV(e.transactionId || ''),
      escapeCSV(e.student?.name || ''),
      escapeCSV(e.student?.email || ''),
      escapeCSV(e.student?.phone || ''),
      escapeCSV(e.course?.title || ''),
      escapeCSV(e.paymentMethod || ''),
      escapeCSV(e.senderName || ''),
      escapeCSV(e.senderNumber || ''),
      escapeCSV(e.amountDue || 0),
      escapeCSV(e.amountPaid || 0),
      escapeCSV(e.status || ''),
      escapeCSV(e.reviewedBy?.name || ''),
      escapeCSV(reviewedPKT),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="codecraft-ledger-${new Date().toISOString().slice(0, 10)}.csv"`
  );

  return res.status(200).send(csvContent);
});

export default {
  getAdminLedger,
  exportAdminLedgerCSV,
};
