import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate, authorize } from '../../middlewares/index.js';
import * as service from './emergency.service.js';

const router = Router();
const ok = (res, data) => res.json({ success: true, data });
const lookupLimit = rateLimit({ windowMs: 10 * 60000, max: 30, standardHeaders: true, legacyHeaders: false, keyGenerator: (req) => String(req.user._id),
  handler: (_req, res) => res.status(429).json({ success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many lookups. Try again later' } }) });

router.get('/me', authenticate, authorize('patient'), (req, res) => ok(res, service.toEmergencyCard(req.user, { includePhoto: true })));
router.get('/lookup/:dishaId', authenticate, authorize('doctor'), lookupLimit, asyncHandler(async (req, res) => ok(res, await service.lookup(req.user, req.params.dishaId))));
router.get('/access', authenticate, authorize('patient'), asyncHandler(async (req, res) => ok(res, await service.listUserSessions(req.user))));
router.delete('/access/:id', authenticate, authorize('patient'), asyncHandler(async (req, res) => { await service.revokeSession(req.user, req.params.id); ok(res, null); }));
export default router;
