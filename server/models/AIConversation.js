const mongoose = require('mongoose');

// One document per student, holding their entire AI doubt-solver history.
// Kept simple (embedded messages, not a separate collection) since this
// is a single ongoing thread per student, not a multi-thread inbox like
// teacher/student chat.
const aiConversationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    messages: [
      {
        role: { type: String, enum: ['user', 'assistant'], required: true },
        content: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('AIConversation', aiConversationSchema);
