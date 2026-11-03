import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const ref = (name) => ({ type: Schema.Types.ObjectId, ref: name });

export const User = model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], required: true },
  status: { type: String, enum: ['pending_verification', 'pending_approval', 'active', 'rejected'], default: 'pending_verification' },
  dishaId: { type: String, unique: true, sparse: true },
  dateOfBirth: Date,
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  guardian: { name: String, phone: String, email: String },
  photo: { key: String, mimeType: String },
  councilRegNumber: String,
  hospitalName: String,
  area: String,
  speciality: String,
  specialityOther: String,
  qualifications: String,
  verificationDocs: [{ key: String, originalName: String, mimeType: String }],
  rejectionReason: String,
  reviewedAt: Date,
  reviewedBy: ref('User'),
}, { timestamps: true }).index({ role: 1, status: 1 }));

export const Doc = model('Doc', new Schema({
  patientId: { ...ref('User'), required: true },
  title: { type: String, required: true, trim: true },
  documentDate: { type: Date, default: Date.now },
  type: { type: String, enum: ['prescription', 'lab_report', 'scan', 'discharge_summary', 'other'], default: 'other' },
  file: { key: String, originalName: String, mimeType: String, sizeBytes: Number },
  uploadedBy: ref('User'),
  deletedAt: Date,
}, { timestamps: true }).index({ patientId: 1, deletedAt: 1, createdAt: -1 }).index({ patientId: 1, title: 1 }));

export const Otp = model('Otp', new Schema({
  purpose: { type: String, enum: ['signup', 'doctor_access'], required: true },
  requesterId: { ...ref('User'), required: true },
  patientId: ref('User'),
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  usedAt: Date,
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true }).index({ requesterId: 1, purpose: 1, createdAt: -1 }));

export const AccessSession = model('AccessSession', new Schema({
  patientId: { ...ref('User'), required: true },
  doctorId: { ...ref('User'), required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  revokedAt: Date,
}, { timestamps: true }).index({ patientId: 1, doctorId: 1 }));

const logSchema = new Schema({
  patientId: { ...ref('User'), required: true },
  seq: { type: Number, required: true },
  occurredAt: { type: Date, required: true },
  actorId: ref('User'), actorRole: String, actorName: String,
  action: { type: String, required: true },
  entityType: String, entityId: Schema.Types.ObjectId, entityTitle: String,
  prevHash: String, hash: String,
}, { timestamps: false }).index({ patientId: 1, seq: 1 }, { unique: true });
// Patient History is append-only: block every update and delete path.
['updateOne', 'updateMany', 'findOneAndUpdate', 'replaceOne', 'deleteOne', 'deleteMany', 'findOneAndDelete']
  .forEach((op) => logSchema.pre(op, () => { throw new Error('Activity logs are append-only'); }));
export const ActivityLog = model('ActivityLog', logSchema);
