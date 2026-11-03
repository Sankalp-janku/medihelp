import 'dotenv/config';

const required = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
};

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: required('MONGO_URI'),
  jwtSecret: required('JWT_SECRET'),
  clientUrl: required('CLIENT_URL'),
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  photoMaxBytes: 2 * 1024 * 1024,
  docMaxBytes: 15 * 1024 * 1024,
  otpTtlMinutes: 5,
  otpMaxAttempts: 3,
  accessSessionMinutes: 45,
});

if (env.jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');
