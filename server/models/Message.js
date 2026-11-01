const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    thread: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatThread',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: 2000,
    },
    // Read state is tracked from the recipient's side only — a message
    // is "read" once the other participant has fetched the thread after
    // it was sent.
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

messageSchema.index({ thread: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
