const mongoose = require('mongoose');

// A single request from one user to another, initiated by entering the
// other person's connection key. Either a student or a teacher can be
// the requester — the recipient is always the opposite role, since
// same-role connections aren't part of the product.
const connectionRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requesterRole: {
      type: String,
      enum: ['student', 'teacher'],
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipientRole: {
      type: String,
      enum: ['student', 'teacher'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
    },
    respondedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

connectionRequestSchema.index({ recipient: 1, status: 1 });
connectionRequestSchema.index({ requester: 1, status: 1 });

// Prevents more than one pending request existing at a time between the
// same pair of users, regardless of who initiated it. Enforced at the
// DB level (partial index) rather than only in application code, so a
// race condition can't slip a duplicate through.
connectionRequestSchema.index(
  { requester: 1, recipient: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

module.exports = mongoose.model('ConnectionRequest', connectionRequestSchema);
