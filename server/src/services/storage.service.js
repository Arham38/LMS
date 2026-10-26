import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import env from '../config/env.js';
import ApiError from '../utils/ApiError.js';

// Allowed kinds, MIME types, extensions, and byte size limits
export const FILE_RULES = {
  pdf: {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedMimes: ['application/pdf'],
    defaultExt: 'pdf',
    adminOnly: true,
  },
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedMimes: ['image/png', 'image/jpeg', 'image/jpg'],
    defaultExt: 'png',
    adminOnly: false,
  },
  zip: {
    maxSize: 50 * 1024 * 1024, // 50MB (zip or pdf for assignments)
    allowedMimes: [
      'application/zip',
      'application/x-zip-compressed',
      'application/octet-stream',
      'application/pdf',
    ],
    defaultExt: 'zip',
    adminOnly: false,
  },
};

const mimeToExt = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
  'application/octet-stream': 'zip',
};

// Initialize S3/R2 client
export const s3Client = new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

/**
 * Creates a short-lived presigned PUT URL for client-side direct upload
 */
export const createUploadUrl = async ({ kind, contentType, size, userId }) => {
  const rule = FILE_RULES[kind];
  if (!rule) {
    throw ApiError.badRequest(`Unsupported upload kind: '${kind}'. Allowed: pdf, image, zip.`, 'INVALID_UPLOAD_KIND');
  }

  // 1. Validate MIME type
  if (!rule.allowedMimes.includes(contentType)) {
    throw ApiError.badRequest(
      `Invalid MIME type '${contentType}' for kind '${kind}'. Allowed: ${rule.allowedMimes.join(', ')}`,
      'INVALID_MIME_TYPE'
    );
  }

  // 2. Validate Size Limit
  if (size > rule.maxSize) {
    const maxMB = Math.round(rule.maxSize / (1024 * 1024));
    throw ApiError.badRequest(
      `File size (${(size / (1024 * 1024)).toFixed(2)}MB) exceeds maximum allowed size of ${maxMB}MB for kind '${kind}'.`,
      'FILE_TOO_LARGE'
    );
  }

  // 3. Generate secure storage key: uploads/{kind}/{userId}/{uuid}.{ext}
  const ext = mimeToExt[contentType] || rule.defaultExt;
  const uniqueId = crypto.randomUUID();
  const key = `uploads/${kind}/${userId}/${uniqueId}.${ext}`;

  // 4. Create signed PUT URL (valid for 10 minutes)
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });

  return {
    uploadUrl,
    key,
  };
};

/**
 * Creates a short-lived presigned GET URL for secure download / preview
 */
export const createDownloadUrl = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Deletes an object from R2 storage
 */
export const deleteObject = async (key) => {
  const command = new DeleteObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: key,
  });

  return s3Client.send(command);
};

export default {
  FILE_RULES,
  createUploadUrl,
  createDownloadUrl,
  deleteObject,
};
