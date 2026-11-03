import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/index.js';

export const requestId = (req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
};

export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  let payload;
  try { payload = jwt.verify(token, env.jwtSecret); } catch { throw new ApiError(401, 'UNAUTHORIZED', 'Please log in again'); }
  const user = await User.findById(payload.id);
  if (!user || user.status !== 'active') throw new ApiError(401, 'UNAUTHORIZED', 'Please log in again');
  req.user = user;
  next();
});

export const authorize = (...roles) => (req, _res, next) =>
  roles.includes(req.user.role) ? next() : next(new ApiError(403, 'FORBIDDEN', 'You do not have access'));

export const validate = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  next(new ApiError(422, 'VALIDATION_ERROR', 'Please check the highlighted fields',
    result.array().map((e) => ({ field: e.path, message: e.msg }))));
};

export const notFound = (_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'Route not found'));

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  let status = 500, code = 'INTERNAL_ERROR', message = 'Something went wrong', details;
  if (err instanceof ApiError) ({ status, code, message, details } = err);
  else if (err.code === 11000) [status, code, message] = [409, 'DUPLICATE', 'This value is already registered'];
  else if (err.code === 'LIMIT_FILE_SIZE') [status, code, message] = [413, 'FILE_TOO_LARGE', 'File is too large'];
  if (status === 500) console.error(`[${req.id}]`, err);
  res.status(status).json({ success: false, error: { code, message, details }, requestId: req.id });
};
