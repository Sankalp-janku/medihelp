import { body } from 'express-validator';
import { SPECIALITIES } from '../../config/constants.js';

const isDoctor = (field) => body(field).if(body('role').equals('doctor'));
export const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('phone').matches(/^\+?[0-9]{10,14}$/).withMessage('Valid phone number required'),
  body('password').isLength({ min: 8 }).withMessage('Password needs 8+ characters'),
  body('role').isIn(['patient', 'doctor']).withMessage('Invalid role'),
  isDoctor('speciality').isIn(SPECIALITIES).withMessage('Select a speciality'),
  body('specialityOther').if(body('speciality').equals('Other')).trim().notEmpty().withMessage('Enter your speciality'),
  isDoctor('qualifications').trim().notEmpty().withMessage('Qualifications are required'),
  isDoctor('councilRegNumber').trim().notEmpty().withMessage('Registration number required'),
  isDoctor('hospitalName').trim().notEmpty().withMessage('Hospital name required'),
  isDoctor('area').trim().notEmpty().withMessage('Area required'),
];
export const verifyRules = [body('otpId').notEmpty(), body('code').isLength({ min: 6, max: 6 }).withMessage('Enter the 6-digit code')];
export const loginRules = [body('email').isEmail().normalizeEmail(), body('password').isString().notEmpty(),
  body('expectedRole').optional().isIn(['patient', 'doctor', 'admin'])];

const BLOOD = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
export const profileRules = [
  body('dateOfBirth').optional({ values: 'falsy' }).isISO8601().withMessage('Enter a valid date').bail()
    .custom((v) => new Date(v) <= new Date()).withMessage('Date of birth cannot be in the future'),
  body('bloodGroup').optional({ values: 'falsy' }).isIn(BLOOD).withMessage('Select a valid blood group'),
  body('guardian.name').optional({ values: 'falsy' }).isString().trim().isLength({ max: 80 }).withMessage('Guardian name is too long'),
  body('guardian.phone').optional({ values: 'falsy' }).matches(/^\+?[0-9]{10,14}$/).withMessage('Enter a valid guardian phone number'),
  body('guardian.email').optional({ values: 'falsy' }).isEmail().withMessage('Enter a valid guardian email'),
];
