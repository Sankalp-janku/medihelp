import crypto from 'crypto';

const ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');
export const randomOtp = () => String(crypto.randomInt(100000, 1000000));
export const generateDishaId = () =>
  'DSH-' + Array.from({ length: 6 }, () => ID_ALPHABET[crypto.randomInt(ID_ALPHABET.length)]).join('');
export const safeEqual = (a, b) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
