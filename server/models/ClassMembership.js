const mongoose = require('mongoose');

const classMembershipSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// A student can only join a given class once.
classMembershipSchema.index({ class: 1, student: 1 }, { unique: true });
classMembershipSchema.index({ student: 1 });

module.exports = mongoose.model('ClassMembership', classMembershipSchema);
