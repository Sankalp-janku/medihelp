import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateAge, profileCompletion, PROFILE_WEIGHTS_TOTAL } from '../src/modules/auth/profile.js';
import { asString, looksLikeObjectId, escapeRegex, pageParams } from '../src/utils/regex.js';

test('profile weights add up to 100', () => assert.equal(PROFILE_WEIGHTS_TOTAL, 100));
test('age handles birthdays', () => {
  const now = new Date('2026-11-03T00:00:00Z');
  assert.equal(calculateAge('2000-11-03', now), 26);
  assert.equal(calculateAge('2000-11-04', now), 25);
  assert.equal(calculateAge('2030-01-01', now), null);
  assert.equal(calculateAge(undefined, now), null);
});
test('new account is 30% complete and lists missing fields', () => {
  const c = profileCompletion({ name: 'A', email: 'a@x.com', phone: '+911234567890' });
  assert.equal(c.percent, 30);
  assert.deepEqual(c.missing.map((m) => m.key), ['dateOfBirth', 'bloodGroup', 'guardianName', 'guardianPhone', 'guardianEmail']);
});
test('full profile is 100%', () => {
  const c = profileCompletion({ name: 'A', email: 'a@x.com', phone: '1', dateOfBirth: new Date(), bloodGroup: 'O+', guardian: { name: 'G', phone: '2', email: 'g@x.com' } });
  assert.equal(c.percent, 100); assert.equal(c.missing.length, 0);
});
test('operator objects are rejected as ids and strings', () => {
  assert.equal(looksLikeObjectId({ $ne: 'x' }), false);
  assert.equal(looksLikeObjectId('64b7f0c2a1b2c3d4e5f60718'), true);
  assert.equal(looksLikeObjectId('64b7f0c2a1b2c3d4e5f6071'), false);
  assert.equal(asString({ $ne: 1 }), '');
});
test('regex escape and paging', () => {
  assert.equal(escapeRegex('a.b*'), 'a\\.b\\*');
  assert.deepEqual(pageParams({ page: '0', limit: '999' }), { page: 1, limit: 50, skip: 0 });
});
