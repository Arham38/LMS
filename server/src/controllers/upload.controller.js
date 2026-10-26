import { createUploadUrl, createDownloadUrl, FILE_RULES } from '../services/storage.service.js';
import Enrollment from '../models/enrollment.model.js';
import Session from '../models/session.model.js';
import Assignment from '../models/assignment.model.js';
import Submission from '../models/submission.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

// POST /api/uploads/presign
export const presignUpload = asyncHandler(async (req, res) => {
  const { kind, contentType, size, filename } = req.body;

  // Enforce role rule: kind 'pdf' is admin-only (for notes and course attachments)
  if (kind === 'pdf' && req.user.role !== 'admin') {
    throw ApiError.forbidden('Only instructors and administrators can request upload URLs for PDF notes.', 'ADMIN_ONLY_UPLOAD');
  }

  const { uploadUrl, key } = await createUploadUrl({
    kind,
    contentType,
    size,
    userId: req.user._id,
  });

  return sendSuccess(res, {
    statusCode: 200,
    data: {
      uploadUrl,
      key,
      filename: filename || null,
      maxSize: FILE_RULES[kind]?.maxSize,
    },
    message: 'Presigned upload URL generated successfully.',
  });
});

// GET /api/files/url?key=...
export const getFileDownloadUrl = asyncHandler(async (req, res) => {
  const { key } = req.query;

  if (!key) {
    throw ApiError.badRequest('Storage key parameter is required.', 'MISSING_KEY');
  }

  const isAdmin = req.user.role === 'admin';
  let isAllowed = isAdmin;

  // If not admin, check if the key belongs to a record the caller is authorized to view
  if (!isAllowed) {
    // 1. Check if it is a payment proof belonging to this student
    const enrollment = await Enrollment.findOne({ paymentProofKey: key });
    if (enrollment) {
      if (enrollment.student.toString() === req.user._id.toString()) {
        isAllowed = true;
      }
    }

    // 2. Check if key is a course lecture note or session resource
    if (!isAllowed) {
      const sessionWithResource = await Session.findOne({ 'resources.fileKey': key });
      if (sessionWithResource) {
        const approvedEnrollment = await Enrollment.findOne({
          student: req.user._id,
          course: sessionWithResource.course,
          status: 'approved',
        });
        if (approvedEnrollment) {
          isAllowed = true;
        }
      }
    }

    // 3. Check if key is an assignment attachment (starter code / spec PDF)
    if (!isAllowed) {
      const assignmentWithAttachment = await Assignment.findOne({ attachmentKey: key });
      if (assignmentWithAttachment) {
        const approvedEnrollment = await Enrollment.findOne({
          student: req.user._id,
          course: assignmentWithAttachment.course,
          status: 'approved',
        });
        if (approvedEnrollment) {
          isAllowed = true;
        }
      }
    }

    // 4. Check if key is a student assignment submission file
    if (!isAllowed) {
      const submission = await Submission.findOne({
        $or: [{ fileKey: key }, { 'history.fileKey': key }],
      });
      if (submission) {
        // Enforce strictly: only the owner student can access their submitted homework file
        if (submission.student.toString() === req.user._id.toString()) {
          isAllowed = true;
        }
      }
    }
  }

  if (!isAllowed) {
    throw ApiError.forbidden('You do not have permission to access or download this file.', 'FILE_ACCESS_DENIED');
  }

  const downloadUrl = await createDownloadUrl(key, 3600);

  return sendSuccess(res, {
    data: {
      downloadUrl,
      expiresIn: 3600, // 1 hour
    },
  });
});

export default {
  presignUpload,
  getFileDownloadUrl,
};
