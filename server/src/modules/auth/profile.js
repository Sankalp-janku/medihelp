const FIELDS = [
  ['name', 'Full name', 10, (u) => u.name], ['email', 'Email', 10, (u) => u.email], ['phone', 'Phone number', 10, (u) => u.phone],
  ['dateOfBirth', 'Date of birth', 15, (u) => u.dateOfBirth], ['bloodGroup', 'Blood group', 15, (u) => u.bloodGroup],
  ['guardianName', 'Guardian name', 15, (u) => u.guardian?.name], ['guardianPhone', 'Guardian phone', 15, (u) => u.guardian?.phone],
  ['guardianEmail', 'Guardian email', 10, (u) => u.guardian?.email],
];
export const PROFILE_WEIGHTS_TOTAL = FIELDS.reduce((sum, f) => sum + f[2], 0);

export function calculateAge(dateOfBirth, now = new Date()) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday = now.getUTCMonth() < dob.getUTCMonth() || (now.getUTCMonth() === dob.getUTCMonth() && now.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : null;
}

const filled = (v) => v !== undefined && v !== null && String(v).trim() !== '';
export function profileCompletion(user) {
  const done = FIELDS.filter((f) => filled(f[3](user)));
  return {
    percent: done.reduce((sum, f) => sum + f[2], 0),
    missing: FIELDS.filter((f) => !done.includes(f)).map(([key, label, weight]) => ({ key, label, weight })),
  };
}
