import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

// Replace the production branch with your DLT-registered SMS provider.
export async function sendSms(phone, text) {
  if (env.nodeEnv !== 'production') return console.log(`[SMS dev] to ${phone}: ${text}`);
  throw new ApiError(501, 'SMS_NOT_CONFIGURED', 'SMS provider is not configured');
}
