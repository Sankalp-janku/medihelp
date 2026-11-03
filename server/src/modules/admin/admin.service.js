import path from 'path';
import { env } from '../../config/env.js';
import { User } from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { asString, escapeRegex, pageParams } from '../../utils/regex.js';

const STATUS = { approved: 'active', pending: 'pending_approval', rejected: 'rejected' };
const REVIEWABLE = Object.values(STATUS);
const notFound = () => new ApiError(404, 'NOT_FOUND', 'Doctor not found');

export async function stats() {
  const rows = await User.aggregate([{ $match: { role: 'doctor', status: { $in: REVIEWABLE } } }, { $group: { _id: '$status', n: { $sum: 1 } } }]);
  const count = (s) => rows.find((r) => r._id === s)?.n || 0;
  const [approved, pending, rejected] = [count('active'), count('pending_approval'), count('rejected')];
  const users = await User.countDocuments({ role: 'patient', status: 'active' });
  return { total: approved + pending + rejected, approved, pending, rejected, users };
}

export async function listDoctors(query) {
  const { page, limit, skip } = pageParams(query);
  const filter = { role: 'doctor', status: STATUS[query.status] || { $in: REVIEWABLE } };
  if (asString(query.speciality)) filter.speciality = asString(query.speciality);
  if (asString(query.q).trim()) {
    const rx = { $regex: escapeRegex(asString(query.q).trim()), $options: 'i' };
    filter.$or = [{ name: rx }, { email: rx }, { councilRegNumber: rx }];
  }
  const sortField = query.sort === 'name' ? 'name' : 'createdAt';
  const sort = { [sortField]: query.order === 'asc' ? 1 : -1 };
  const [items, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit).select('name email phone speciality specialityOther status hospitalName area councilRegNumber createdAt').lean(),
    User.countDocuments(filter),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getDoctor(id) {
  const d = await User.findOne({ _id: id, role: 'doctor' }).select('-passwordHash').populate('reviewedBy', 'name').lean().catch(() => null);
  if (!d) throw notFound();
  return { ...d, photo: undefined, reviewedBy: d.reviewedBy?.name || null, hasPhoto: !!d.photo?.key,
    verificationDocs: (d.verificationDocs || []).map((f, index) => ({ index, originalName: f.originalName, mimeType: f.mimeType })) };
}

export async function getVerificationFile(id, index) {
  const d = await User.findOne({ _id: id, role: 'doctor' }).select('verificationDocs').catch(() => null);
  const file = d?.verificationDocs?.[Number(index)];
  if (!file) throw notFound();
  return { filePath: path.resolve(env.uploadDir, file.key), mimeType: file.mimeType };
}

async function review(id, admin, update) {
  const doctor = await User.findOneAndUpdate({ _id: id, role: 'doctor', status: 'pending_approval' },
    { ...update, reviewedAt: new Date(), reviewedBy: admin._id }, { new: true }).catch(() => null);
  if (!doctor) throw new ApiError(409, 'NOT_PENDING', 'Only pending doctors can be reviewed');
  return { id: doctor._id, status: doctor.status };
}
export const approveDoctor = (id, admin) => review(id, admin, { status: 'active', $unset: { rejectionReason: 1 } });
export const rejectDoctor = (id, admin, reason) => {
  if (!reason || reason.trim().length < 10) throw new ApiError(422, 'VALIDATION_ERROR', 'A rejection reason of at least 10 characters is required', [{ field: 'reason', message: 'Reason is required (10+ characters)' }]);
  return review(id, admin, { status: 'rejected', rejectionReason: reason.trim() });
};
