import fs from 'fs';
import path from 'path';
import { env } from '../../config/env.js';
import { Doc } from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { asString, escapeRegex, pageParams } from '../../utils/regex.js';
import { assertUploadedFile } from '../../utils/files.js';
import { DOCUMENT_TYPES } from '../../config/constants.js';
import { recordActivity } from '../../services/history.service.js';
import { hasActiveSession } from '../access/access.service.js';

const actorOf = (u) => ({ id: u._id, role: u.role, name: u.name });
const entityOf = (d) => ({ type: 'Doc', id: d._id, title: d.title });
const notFound = () => new ApiError(404, 'NOT_FOUND', 'Document not found');

/** Patients act on themselves; approved doctors only inside an OTP session (read-only). */
export async function resolvePatientId(user, requestedId, { write }) {
  if (user.role === 'patient') return user._id;
  if (user.role === 'doctor' && !write && typeof requestedId === 'string' && (await hasActiveSession(user._id, requestedId))) return requestedId;
  throw new ApiError(403, 'FORBIDDEN', 'You do not have access to these records');
}

/** Converts a YYYY-MM-DD string in the viewer's time zone (tz = getTimezoneOffset minutes) to a UTC day range. */
function dayRange(value, tzMinutes = 0) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const start = new Date(Date.parse(`${value}T00:00:00Z`) + (Number(tzMinutes) || 0) * 60000);
  return { $gte: start, $lt: new Date(start.getTime() + 86400000) };
}
const TYPES = ['prescription', 'lab_report', 'scan', 'discharge_summary', 'other'];

export async function list(patientId, query) {
  const { page, limit, skip } = pageParams(query);
  const filter = { patientId, deletedAt: null };
  const q = asString(query.q).trim();
  if (q) filter.title = { $regex: escapeRegex(q), $options: 'i' };
  if (TYPES.includes(query.type)) filter.type = query.type;
  const uploadDay = dayRange(asString(query.uploadDate), query.tz);
  if (uploadDay) filter.createdAt = uploadDay;
  const [items, total] = await Promise.all([
    Doc.find(filter).sort('-createdAt').skip(skip).limit(limit).lean(), Doc.countDocuments(filter)]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getOne(patientId, id) {
  const doc = await Doc.findOne({ _id: id, patientId, deletedAt: null }).lean().catch(() => null);
  if (!doc) throw notFound();
  return { _id: doc._id, title: doc.title, type: doc.type, documentDate: doc.documentDate, createdAt: doc.createdAt, mimeType: doc.file.mimeType };
}

export async function create(user, { title, type, documentDate }, file) {
  assertUploadedFile(file, { field: 'file', allowed: DOCUMENT_TYPES, maxBytes: env.docMaxBytes });
  const date = documentDate ? new Date(documentDate) : new Date();
  if (Number.isNaN(date.getTime())) throw new ApiError(422, 'VALIDATION_ERROR', 'Invalid document date', [{ field: 'documentDate', message: 'Invalid date' }]);
  const doc = await Doc.create({ patientId: user._id, title: title?.trim() || file.originalname, type, documentDate: date, uploadedBy: user._id,
    file: { key: file.filename, originalName: file.originalname, mimeType: file.mimetype, sizeBytes: file.size } });
  await recordActivity({ patientId: user._id, actor: actorOf(user), action: 'document.uploaded', entity: entityOf(doc) });
  return doc;
}

export async function remove(user, id) {
  const doc = await Doc.findOne({ _id: id, patientId: user._id, deletedAt: null }).catch(() => null);
  if (!doc) throw notFound();
  doc.deletedAt = new Date();
  await doc.save();
  await recordActivity({ patientId: user._id, actor: actorOf(user), action: 'document.deleted', entity: entityOf(doc) });
}

export async function getFile(user, patientId, id) {
  const doc = await Doc.findOne({ _id: id, patientId, deletedAt: null }).catch(() => null);
  if (!doc) throw notFound();
  const filePath = path.resolve(env.uploadDir, doc.file.key);
  if (!fs.existsSync(filePath)) throw new ApiError(404, 'FILE_MISSING', 'File is no longer available');
  await recordActivity({ patientId, actor: actorOf(user), action: 'document.viewed', entity: entityOf(doc) });
  return { filePath, mimeType: doc.file.mimeType };
}
