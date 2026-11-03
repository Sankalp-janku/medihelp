import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { generateDishaId } from '../../utils/crypto.js';
import { env } from '../../config/env.js';
import { assertUploadedFile } from '../../utils/files.js';
import { IMAGE_TYPES, DOCUMENT_TYPES } from '../../config/constants.js';
import { calculateAge, profileCompletion } from './profile.js';
import { issueOtp, verifyOtp } from '../../services/otp.service.js';

export const toPublicUser = (u) => ({ id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role, status: u.status,
  dishaId: u.dishaId, bloodGroup: u.bloodGroup, dateOfBirth: u.dateOfBirth, guardian: u.guardian, hospitalName: u.hospitalName,
  speciality: u.speciality === 'Other' ? u.specialityOther : u.speciality, hasPhoto: !!u.photo?.key,
  age: calculateAge(u.dateOfBirth), profileCompletion: u.role === 'patient' ? profileCompletion(u) : undefined });

const toStoredFile = (f) => ({ key: f.filename, originalName: f.originalname, mimeType: f.mimetype });

export async function register(input, files) {
  const photo = files?.photo?.[0], docs = files?.verificationDocs || [];
  assertUploadedFile(photo, { field: 'photo', allowed: IMAGE_TYPES, maxBytes: env.photoMaxBytes });
  const isDoctor = input.role === 'doctor';
  if (isDoctor) {
    if (!docs.length) assertUploadedFile(undefined, { field: 'verificationDocs', allowed: [], maxBytes: 0 });
    docs.forEach((d) => assertUploadedFile(d, { field: 'verificationDocs', allowed: DOCUMENT_TYPES, maxBytes: env.docMaxBytes }));
  }
  if (await User.exists({ $or: [{ email: input.email }, { phone: input.phone }] }))
    throw new ApiError(409, 'DUPLICATE', 'Email or phone is already registered');
  const user = await User.create({
    name: input.name, email: input.email, phone: input.phone, role: input.role,
    passwordHash: await bcrypt.hash(input.password, 12), photo: toStoredFile(photo),
    ...(isDoctor
      ? { speciality: input.speciality, specialityOther: input.speciality === 'Other' ? input.specialityOther : undefined,
          qualifications: input.qualifications, councilRegNumber: input.councilRegNumber, hospitalName: input.hospitalName,
          area: input.area, verificationDocs: docs.map(toStoredFile) }
      : { dishaId: generateDishaId() }),
  });
  const otp = await issueOtp({ purpose: 'signup', requesterId: user._id, phones: [user.phone], message: 'Disha signup.' });
  return { otpId: otp._id };
}

export async function verifyPhone({ otpId, code }) {
  const otp = await verifyOtp({ otpId, code, purpose: 'signup' });
  const user = await User.findById(otp.requesterId);
  user.status = user.role === 'doctor' ? 'pending_approval' : 'active';
  await user.save();
  return { status: user.status };
}
const ROLE_LABEL = { patient: 'user', doctor: 'doctor', admin: 'administrator' };
export async function login({ email, password, expectedRole }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new ApiError(401, 'INVALID_CREDENTIALS', 'Wrong email or password');
  if (expectedRole && user.role !== expectedRole) throw new ApiError(403, 'ROLE_MISMATCH', `This account is not a ${ROLE_LABEL[expectedRole]} account. Choose the correct account type.`);
  if (user.status === 'pending_verification') throw new ApiError(403, 'PHONE_NOT_VERIFIED', 'Please verify your phone number');
  if (user.status === 'rejected') throw new ApiError(403, 'REJECTED', `Your registration was rejected. Reason: ${user.rejectionReason || 'not provided'}`);
  if (user.status === 'pending_approval') throw new ApiError(403, 'NOT_APPROVED', 'Your account is awaiting admin approval');
  return { token: jwt.sign({ id: user._id }, env.jwtSecret, { expiresIn: '7d' }), user: toPublicUser(user) };
}

export async function updateProfile(user, { dateOfBirth, bloodGroup, guardian = {} }) {
  const clean = (v) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
  user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined;
  user.bloodGroup = clean(bloodGroup);
  user.guardian = { name: clean(guardian.name), phone: clean(guardian.phone), email: clean(guardian.email) };
  await user.save();
  return toPublicUser(user);
}
