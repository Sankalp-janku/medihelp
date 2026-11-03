import path from 'path';
import { Router } from 'express';
import { env } from '../../config/env.js';
import { User } from '../../models/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middlewares/index.js';
import { hasActiveSession } from '../access/access.service.js';

const router = Router();
// Profile photos: the owner, admins, and doctors inside an active OTP session may view them.
router.get('/:id/photo', authenticate, asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id).select('photo role').catch(() => null);
  if (!target?.photo?.key) throw new ApiError(404, 'NOT_FOUND', 'Photo not found');
  const { user } = req;
  const allowed = String(user._id) === String(target._id) || user.role === 'admin'
    || (user.role === 'doctor' && target.role === 'patient' && (await hasActiveSession(user._id, target._id)));
  if (!allowed) throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this photo');
  res.type(target.photo.mimeType).sendFile(path.resolve(env.uploadDir, target.photo.key));
}));
export default router;
