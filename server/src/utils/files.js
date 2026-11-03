import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from './ApiError.js';

const SIGNATURES = { 'image/jpeg': [0xff, 0xd8, 0xff], 'image/png': [0x89, 0x50, 0x4e, 0x47], 'application/pdf': [0x25, 0x50, 0x44, 0x46], 'image/webp': [0x52, 0x49, 0x46, 0x46] };
fs.mkdirSync(env.uploadDir, { recursive: true });

/** True when the file's first bytes match its declared type (not just the extension). */
export const matchesSignature = (filePath, mime) => {
  const sig = SIGNATURES[mime];
  if (!sig) return false;
  const fd = fs.openSync(filePath, 'r'), buf = Buffer.alloc(4);
  fs.readSync(fd, buf, 0, 4, 0);
  fs.closeSync(fd);
  return sig.every((b, i) => buf[i] === b);
};
export const flattenFiles = (files) => (Array.isArray(files) ? files : Object.values(files || {}).flat());
export const removeFiles = (files) => flattenFiles(files).forEach((f) => fs.unlink(f.path, () => {}));

/** Deletes uploaded files when the request ends in an error, so nothing is orphaned. */
export const cleanupOnFailure = (req, res, next) => {
  res.on('finish', () => { if (res.statusCode >= 400) removeFiles(req.files || (req.file ? [req.file] : [])); });
  next();
};

/** Checks size and real content type of an uploaded file; throws a field-level validation error. */
export const assertUploadedFile = (file, { field, allowed, maxBytes }) => {
  const fail = (message) => new ApiError(422, 'VALIDATION_ERROR', message, [{ field, message }]);
  if (!file) throw fail('This file is required');
  if (file.size > maxBytes) throw fail(`File must be under ${Math.round(maxBytes / 1048576)} MB`);
  if (!allowed.includes(file.mimetype) || !matchesSignature(file.path, file.mimetype)) throw fail('File content does not match an allowed type');
};

export const createUpload = ({ maxBytes, allowedByField }) => multer({
  storage: multer.diskStorage({ destination: env.uploadDir,
    filename: (_r, f, cb) => cb(null, crypto.randomUUID() + path.extname(f.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '')) }),
  limits: { fileSize: maxBytes },
  fileFilter: (_r, f, cb) => (allowedByField[f.fieldname]?.includes(f.mimetype) ? cb(null, true)
    : cb(new ApiError(422, 'VALIDATION_ERROR', 'Unsupported file type', [{ field: f.fieldname, message: 'Unsupported file type' }]))),
});
