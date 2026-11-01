const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
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
    // Every seeded chapter starts as false (per spec: chapter-level
    // content is a future feature and must visibly read "Coming Soon",
    // never appear as if it already exists). This flag is the single
    // source of truth the frontend checks — no chapter is faked as
    // available.
    hasContent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

chapterSchema.index({ subject: 1, slug: 1 }, { unique: true });
chapterSchema.index({ subject: 1, order: 1 });

module.exports = mongoose.model('Chapter', chapterSchema);
