import { User, AccessSession } from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { looksLikeObjectId, asString } from '../../utils/regex.js';
import { recordActivity } from '../../services/history.service.js';
import { calculateAge } from '../auth/profile.js';

// Emergency access policy: an approved doctor who knows a Disha ID may see this limited card
// (no documents). Each lookup is written to the user's history. Documents always need the user's OTP.
export const toEmergencyCard = (u, { includePhoto }) => ({
  id: u._id, name: u.name, dishaId: u.dishaId, dateOfBirth: u.dateOfBirth || null, age: calculateAge(u.dateOfBirth),
  bloodGroup: u.bloodGroup || null, guardian: { name: u.guardian?.name || null, phone: u.guardian?.phone || null },
  hasPhoto: includePhoto && !!u.photo?.key,
});

export async function lookup(doctor, dishaId) {
  const user = await User.findOne({ dishaId: asString(dishaId).trim().toUpperCase(), role: 'patient', status: 'active' });
  if (!user) throw new ApiError(404, 'NOT_FOUND', 'No user found with this Disha ID');
  await recordActivity({ patientId: user._id, actor: { id: doctor._id, role: 'doctor', name: doctor.name },
    action: 'emergency.viewed', entity: { type: 'Emergency', title: doctor.hospitalName } });
  return toEmergencyCard(user, { includePhoto: false });
}

export async function listUserSessions(user) {
  const rows = await AccessSession.find({ patientId: user._id, revokedAt: null, expiresAt: { $gt: new Date() } })
    .populate('doctorId', 'name hospitalName').sort('-createdAt').lean();
  return rows.map((s) => ({ id: s._id, startedAt: s.createdAt, expiresAt: s.expiresAt, doctor: { name: s.doctorId?.name, hospitalName: s.doctorId?.hospitalName } }));
}

export async function revokeSession(user, id) {
  const session = looksLikeObjectId(id) && await AccessSession.findOneAndUpdate({ _id: id, patientId: user._id, revokedAt: null }, { revokedAt: new Date() });
  if (!session) throw new ApiError(404, 'NOT_FOUND', 'Active access not found');
  await recordActivity({ patientId: user._id, actor: { id: user._id, role: user.role, name: user.name },
    action: 'access.revoked', entity: { type: 'AccessSession', title: 'Doctor access' } });
}
