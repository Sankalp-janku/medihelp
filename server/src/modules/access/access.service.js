import mongoose from 'mongoose';
import { env } from '../../config/env.js';
import { User, AccessSession, Otp } from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { issueOtp, verifyOtp } from '../../services/otp.service.js';
import { looksLikeObjectId } from '../../utils/regex.js';
import { recordActivity } from '../../services/history.service.js';

export const hasActiveSession = (doctorId, patientId) => {
  const id = String(patientId);
  if (!looksLikeObjectId(id)) return false;
  return AccessSession.exists({ doctorId, patientId: id, revokedAt: null, expiresAt: { $gt: new Date() } });
};

export async function requestAccess(doctor, dishaId) {
  const recent = await Otp.countDocuments({ requesterId: doctor._id, purpose: 'doctor_access', createdAt: { $gt: new Date(Date.now() - 10 * 60000) } });
  if (recent >= 5) throw new ApiError(429, 'TOO_MANY_REQUESTS', 'Too many requests. Try again in a few minutes');
  const patient = await User.findOne({ dishaId: String(dishaId).toUpperCase(), role: 'patient', status: 'active' });
  // Same response whether or not the ID exists, so IDs cannot be probed.
  if (!patient) return { otpId: new mongoose.Types.ObjectId() };
  const otp = await issueOtp({ purpose: 'doctor_access', requesterId: doctor._id, patientId: patient._id,
    phones: [patient.phone, patient.guardian?.phone], message: `Dr. ${doctor.name} (${doctor.hospitalName}) requests access to your Disha records.` });
  return { otpId: otp._id };
}

export async function grantAccess(doctor, { otpId, code }) {
  const otp = await verifyOtp({ otpId, code, purpose: 'doctor_access', requesterId: doctor._id });
  const expiresAt = new Date(Date.now() + env.accessSessionMinutes * 60000);
  await AccessSession.create({ patientId: otp.patientId, doctorId: doctor._id, expiresAt });
  await recordActivity({ patientId: otp.patientId, actor: { id: doctor._id, role: 'doctor', name: doctor.name }, action: 'access.granted',
    entity: { type: 'AccessSession', title: doctor.hospitalName } });
  const patient = await User.findById(otp.patientId).select('name dishaId bloodGroup photo');
  return { patient: { id: patient._id, name: patient.name, dishaId: patient.dishaId, bloodGroup: patient.bloodGroup }, expiresAt };
}

export async function listSessions(doctor) {
  const sessions = await AccessSession.find({ doctorId: doctor._id, revokedAt: null, expiresAt: { $gt: new Date() } })
    .populate('patientId', 'name dishaId bloodGroup photo').sort('-createdAt').lean();
  return sessions.map((s) => ({ expiresAt: s.expiresAt, patient: { id: s.patientId._id, name: s.patientId.name,
    dishaId: s.patientId.dishaId, bloodGroup: s.patientId.bloodGroup, hasPhoto: !!s.patientId.photo?.key } }));
}
