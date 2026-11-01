const mongoose = require('mongoose');

// Created lazily the first time either party sends a message to the
// other. Requiring an active Connection to create one (enforced in the
// service layer, not here) keeps chat consistent with the rest of the
// app's security model — you can only message someone you're actually
// connected with.
const chatThreadSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    lastMessagePreview: {
      type: String,
      trim: true,
      maxlength: 140,
    },
  },
  { timestamps: true }
);

chatThreadSchema.index({ teacher: 1, student: 1 }, { unique: true });
chatThreadSchema.index({ teacher: 1, lastMessageAt: -1 });
chatThreadSchema.index({ student: 1, lastMessageAt: -1 });

module.exports = mongoose.model('ChatThread', chatThreadSchema);
