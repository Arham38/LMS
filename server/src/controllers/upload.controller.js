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
  const { kind, contentType, size, filename, courseId } = req.body;

  // Enforce role rule: kind 'pdf' is admin-only (for notes and course attachments)
  if (kind === 'pdf' && req.user.role !== 'admin') {
    throw ApiError.forbidden('Only instructors and administrators can request upload URLs for PDF notes.', 'ADMIN_ONLY_UPLOAD');
  }

  const { uploadUrl, key, originalFilename } = await createUploadUrl({
    kind,
    contentType,
    size,
    userId: req.user._id,
    courseId,
    filename,
  });

  return sendSuccess(res, {
    statusCode: 200,
    data: {
      uploadUrl,
      key,
      filename: originalFilename || filename || null,
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
  let targetFileName = null;

  // 1. Check if it is a payment proof
  const enrollment = await Enrollment.findOne({ paymentProofKey: key });
  if (enrollment) {
    targetFileName = enrollment.paymentProofName;
    if (isAdmin || enrollment.student.toString() === req.user._id.toString()) {
      isAllowed = true;
    }
  }

  // 2. Check if key is a course lecture note or session resource
  if (!isAllowed || !targetFileName) {
    const sessionWithResource = await Session.findOne({ 'resources.fileKey': key });
    if (sessionWithResource) {
      const resItem = sessionWithResource.resources.find((r) => r.fileKey === key);
      if (resItem) {
        targetFileName = resItem.fileName || resItem.title;
      }
      if (isAdmin) {
        isAllowed = true;
      } else {
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
  }

  // 3. Check if key is an assignment attachment (starter code / spec PDF)
  if (!isAllowed || !targetFileName) {
    const assignmentWithAttachment = await Assignment.findOne({ attachmentKey: key });
    if (assignmentWithAttachment) {
      targetFileName = assignmentWithAttachment.attachmentName;
      if (isAdmin) {
        isAllowed = true;
      } else {
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
  }

  // 4. Check if key is a student assignment submission file
  if (!isAllowed || !targetFileName) {
    const submission = await Submission.findOne({
      $or: [{ fileKey: key }, { 'history.fileKey': key }],
    });
    if (submission) {
      if (submission.fileKey === key) {
        targetFileName = submission.fileName;
      } else {
        const histItem = submission.history.find((h) => h.fileKey === key);
        if (histItem) targetFileName = histItem.fileName;
      }
      if (isAdmin || submission.student.toString() === req.user._id.toString()) {
        isAllowed = true;
      }
    }
  }

  if (!isAllowed) {
    throw ApiError.forbidden('You do not have permission to access or download this file.', 'FILE_ACCESS_DENIED');
  }

  const downloadUrl = await createDownloadUrl(key, 3600, targetFileName);

  return sendSuccess(res, {
    data: {
      downloadUrl,
      fileName: targetFileName || undefined,
      expiresIn: 3600, // 1 hour
    },
  });
});

export default {
  presignUpload,
  getFileDownloadUrl,
};
