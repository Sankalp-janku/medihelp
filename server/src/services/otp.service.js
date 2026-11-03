import { env } from '../config/env.js';
import { Otp } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { randomOtp, sha256, safeEqual } from '../utils/crypto.js';
import { sendSms } from './sms.service.js';

const hashCode = (code, id) => sha256(`${code}:${id}`);

export async function issueOtp({ purpose, requesterId, patientId, phones, message }) {
  const code = randomOtp();
  const otp = new Otp({ purpose, requesterId, patientId, codeHash: 'pending',
    expiresAt: new Date(Date.now() + env.otpTtlMinutes * 60000) });
  otp.codeHash = hashCode(code, otp._id);
  await otp.save();
  await Promise.all(phones.filter(Boolean).map((p) => sendSms(p, `${message} Code: ${code}. Valid ${env.otpTtlMinutes} min.`)));
  return otp;
}

export async function verifyOtp({ otpId, code, purpose, requesterId }) {
  const invalid = () => new ApiError(400, 'INVALID_OTP', 'Invalid or expired code');
  const otp = await Otp.findById(otpId).catch(() => null);
  if (!otp || otp.usedAt || otp.purpose !== purpose || (requesterId && String(otp.requesterId) !== String(requesterId))) throw invalid();
  if (otp.attempts >= env.otpMaxAttempts) throw new ApiError(429, 'OTP_LOCKED', 'Too many wrong attempts. Request a new code');
  otp.attempts += 1;
  if (!safeEqual(otp.codeHash, hashCode(String(code), otp._id))) { await otp.save(); throw invalid(); }
  otp.usedAt = new Date();
  await otp.save();
  return otp;
}
