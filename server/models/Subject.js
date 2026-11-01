const mongoose = require('mongoose');

// Curriculum data is deliberately DB-driven (seeded via scripts/seedCurriculum.js)
// rather than hardcoded into React components, so new grades/subjects can be
// added later without touching application code — see spec section 47.
const subjectSchema = new mongoose.Schema(
  {
    grade: {
      type: String,
      enum: ['10th CBSE', '12th CBSE'],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

subjectSchema.index({ grade: 1, slug: 1 }, { unique: true });
subjectSchema.index({ grade: 1, order: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
