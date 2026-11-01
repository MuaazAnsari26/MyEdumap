const mongoose = require('mongoose');

// An established, accepted link between exactly one student and one
// teacher. Created either by accepting a ConnectionRequest, or
// automatically when a student joins a class (see classService).
const connectionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    source: {
      type: String,
      enum: ['connection_request', 'class_join'],
      required: true,
    },
    sourceRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ConnectionRequest',
    },
    // 'active' today; kept as an enum (rather than a boolean) so
    // disconnect/block features described in the spec can be added later
    // without a schema migration.
    status: {
      type: String,
      enum: ['active', 'disconnected', 'blocked'],
      default: 'active',
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// A student and teacher can only be connected once.
connectionSchema.index({ student: 1, teacher: 1 }, { unique: true });
connectionSchema.index({ teacher: 1, status: 1 });
connectionSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model('Connection', connectionSchema);
