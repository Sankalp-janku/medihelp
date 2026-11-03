import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate, authorize, validate } from '../../middlewares/index.js';
import { createUpload, cleanupOnFailure } from '../../utils/files.js';
import { IMAGE_TYPES, DOCUMENT_TYPES } from '../../config/constants.js';
import * as service from './auth.service.js';
import { registerRules, verifyRules, loginRules, profileRules } from './auth.validator.js';

const router = Router();
router.use(rateLimit({ windowMs: 15 * 60000, max: 60, standardHeaders: true, legacyHeaders: false }));
const registerUpload = createUpload({ maxBytes: 15 * 1024 * 1024, allowedByField: { photo: IMAGE_TYPES, verificationDocs: DOCUMENT_TYPES } })
  .fields([{ name: 'photo', maxCount: 1 }, { name: 'verificationDocs', maxCount: 3 }]);
const send = (res, data, status = 200) => res.status(status).json({ success: true, data });

router.post('/register', cleanupOnFailure, registerUpload, registerRules, validate,
  asyncHandler(async (req, res) => send(res, await service.register(req.body, req.files), 201)));
router.post('/verify-phone', verifyRules, validate, asyncHandler(async (req, res) => send(res, await service.verifyPhone(req.body))));
router.post('/login', loginRules, validate, asyncHandler(async (req, res) => send(res, await service.login(req.body))));
router.get('/me', authenticate, (req, res) => send(res, service.toPublicUser(req.user)));
router.put('/profile', authenticate, authorize('patient'), profileRules, validate, asyncHandler(async (req, res) =>
  send(res, await service.updateProfile(req.user, req.body))));
export default router;
