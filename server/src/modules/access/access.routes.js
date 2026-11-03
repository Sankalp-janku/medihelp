import { Router } from 'express';
import { body } from 'express-validator';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate, authorize, validate } from '../../middlewares/index.js';
import * as service from './access.service.js';

const router = Router();
router.use(authenticate, authorize('doctor'));
router.post('/request', body('dishaId').trim().notEmpty(), validate, asyncHandler(async (req, res) =>
  res.status(202).json({ success: true, data: await service.requestAccess(req.user, req.body.dishaId) })));
router.post('/verify', body('otpId').notEmpty(), body('code').isLength({ min: 6, max: 6 }), validate, asyncHandler(async (req, res) =>
  res.json({ success: true, data: await service.grantAccess(req.user, req.body) })));
router.get('/sessions', asyncHandler(async (req, res) => res.json({ success: true, data: await service.listSessions(req.user) })));
export default router;
