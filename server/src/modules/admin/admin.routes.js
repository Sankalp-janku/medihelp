import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate, authorize } from '../../middlewares/index.js';
import * as service from './admin.service.js';

const router = Router();
const ok = (res, data) => res.json({ success: true, data });
router.use(authenticate, authorize('admin'));
router.get('/stats', asyncHandler(async (_req, res) => ok(res, await service.stats())));
router.get('/doctors', asyncHandler(async (req, res) => ok(res, await service.listDoctors(req.query))));
router.get('/doctors/:id', asyncHandler(async (req, res) => ok(res, await service.getDoctor(req.params.id))));
router.get('/doctors/:id/verification/:index', asyncHandler(async (req, res) => {
  const { filePath, mimeType } = await service.getVerificationFile(req.params.id, req.params.index);
  res.type(mimeType).sendFile(filePath);
}));
router.patch('/doctors/:id/approve', asyncHandler(async (req, res) => ok(res, await service.approveDoctor(req.params.id, req.user))));
router.patch('/doctors/:id/reject', asyncHandler(async (req, res) => ok(res, await service.rejectDoctor(req.params.id, req.user, req.body.reason))));
export default router;
