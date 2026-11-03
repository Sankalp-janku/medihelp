import { Router } from 'express';
import { env } from '../../config/env.js';
import { DOCUMENT_TYPES } from '../../config/constants.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { createUpload, cleanupOnFailure } from '../../utils/files.js';
import { authenticate, authorize } from '../../middlewares/index.js';
import * as service from './documents.service.js';

const upload = createUpload({ maxBytes: env.docMaxBytes, allowedByField: { file: DOCUMENT_TYPES } }).single('file');
const router = Router();
const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
router.use(authenticate, authorize('patient', 'doctor'));
const scope = (write) => asyncHandler(async (req, _res, next) => {
  req.patientId = await service.resolvePatientId(req.user, req.query.patientId, { write });
  next();
});

router.get('/', scope(false), asyncHandler(async (req, res) => ok(res, await service.list(req.patientId, req.query))));
router.post('/', cleanupOnFailure, upload, scope(true), asyncHandler(async (req, res) => ok(res, await service.create(req.user, req.body, req.file), 201)));
router.get('/:id', scope(false), asyncHandler(async (req, res) => ok(res, await service.getOne(req.patientId, req.params.id))));
router.delete('/:id', scope(true), asyncHandler(async (req, res) => { await service.remove(req.user, req.params.id); ok(res, null); }));
router.get('/:id/file', scope(false), asyncHandler(async (req, res) => {
  const { filePath, mimeType } = await service.getFile(req.user, req.patientId, req.params.id);
  res.type(mimeType).sendFile(filePath);
}));
export default router;
