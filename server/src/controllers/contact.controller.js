import ContactMessage from '../models/contactMessage.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';
import notificationService from '../services/notification.service.js';

/**
 * @desc    Submit public contact inquiry
 * @route   POST /api/contact
 * @access  Public
 */
export const submitContactMessage = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  const contactMessage = await ContactMessage.create({
    name,
    email,
    phone: phone || '',
    subject: subject || 'General Inquiry',
    message,
  });

  // Notify academy administrators
  await notificationService.notifyAdmins({
    type: 'contact_message',
    title: `New Inquiry from ${name}`,
    body: `${subject || 'General Inquiry'}: "${message.slice(0, 100)}${message.length > 100 ? '...' : ''}"`,
    link: '/admin/messages',
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Your message has been sent successfully. We will get back to you shortly.',
    data: {
      id: contactMessage._id,
      name: contactMessage.name,
      email: contactMessage.email,
      createdAt: contactMessage.createdAt,
    },
  });
});

/**
 * @desc    Get all contact messages (Admin)
 * @route   GET /api/admin/messages
 * @access  Private (Admin)
 */
export const getAdminMessages = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {};

  if (req.query.read === 'true') {
    filter.read = true;
  } else if (req.query.read === 'false') {
    filter.read = false;
  }

  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search.trim(), 'i');
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { subject: searchRegex },
      { message: searchRegex },
      { phone: searchRegex },
    ];
  }

  const [messages, total, unreadCount] = await Promise.all([
    ContactMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ContactMessage.countDocuments(filter),
    ContactMessage.countDocuments({ read: false }),
  ]);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Contact messages retrieved successfully',
    data: {
      messages,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit) || 1,
        limit,
        unreadCount,
      },
    },
  });
});

/**
 * @desc    Update contact message status (read / replied / notes)
 * @route   PATCH /api/admin/messages/:id
 * @access  Private (Admin)
 */
export const updateMessageStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { read, replySent, adminNotes } = req.body;

  const message = await ContactMessage.findById(id);
  if (!message) {
    throw new ApiError(404, 'Contact message not found');
  }

  if (read !== undefined) message.read = read;
  if (replySent !== undefined) message.replySent = replySent;
  if (adminNotes !== undefined) message.adminNotes = adminNotes;

  await message.save();

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Message updated successfully',
    data: message,
  });
});

/**
 * @desc    Delete contact message
 * @route   DELETE /api/admin/messages/:id
 * @access  Private (Admin)
 */
export const deleteContactMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const message = await ContactMessage.findByIdAndDelete(id);
  if (!message) {
    throw new ApiError(404, 'Contact message not found');
  }

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Message deleted successfully',
    data: { id },
  });
});
