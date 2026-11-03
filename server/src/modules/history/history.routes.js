import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate, authorize } from '../../middlewares/index.js';
import { listActivity } from '../../services/history.service.js';

const router = Router();
router.get('/', authenticate, authorize('patient'), asyncHandler(async (req, res) =>
  res.json({ success: true, data: await listActivity(req.user._id, { before: req.query.before }) })));
export default router;
