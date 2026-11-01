const crypto = require('crypto');
const StudentProfile = require('../../models/StudentProfile');
const TeacherProfile = require('../../models/TeacherProfile');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid ambiguity

function randomSegment(length = 6) {
  let out = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

// Generates a key like EDU-STU-A9F3K2, retrying on the rare collision.
// Checked against the DB (not just format) so uniqueness is guaranteed,
// not assumed.
async function generateUniqueKey(role) {
  const prefix = role === 'student' ? 'EDU-STU-' : 'EDU-TCH-';
  const Model = role === 'student' ? StudentProfile : TeacherProfile;

  const MAX_ATTEMPTS = 10;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const candidate = `${prefix}${randomSegment(6)}`;
    // eslint-disable-next-line no-await-in-loop
    const existing = await Model.findOne({ connectionKey: candidate }).lean();
    if (!existing) return candidate;
  }
  throw new Error('Failed to generate a unique connection key after multiple attempts.');
}

// Generates a class key like EDU-CLS-9K2F7Q. Defined here so both the
// class model (Phase 2) and any script sharing key logic can reuse it.
async function generateUniqueClassKey(ClassModel) {
  const MAX_ATTEMPTS = 10;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const candidate = `EDU-CLS-${randomSegment(6)}`;
    // eslint-disable-next-line no-await-in-loop
    const existing = await ClassModel.findOne({ classKey: candidate }).lean();
    if (!existing) return candidate;
  }
  throw new Error('Failed to generate a unique class key after multiple attempts.');
}

module.exports = { generateUniqueKey, generateUniqueClassKey };
