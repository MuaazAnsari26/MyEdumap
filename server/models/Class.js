const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Class name is required'],
      trim: true,
      maxlength: [60, 'Class name cannot exceed 60 characters'],
    },
    classKey: {
      type: String,
      required: true,
      unique: true, // unique: true already creates an index
    },
    // Denormalized, best-effort convenience count. ClassMembership is the
    // source of truth; this can be recomputed via aggregation if it ever
    // drifts (e.g. after a manual DB fix).
    studentCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

classSchema.index({ teacher: 1 });

module.exports = mongoose.model('Class', classSchema);
