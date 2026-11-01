const mongoose = require('mongoose');

// A Quiz here is a student's personal practice session: generated once,
// attempted once. (Teacher-assigned quizzes in a later phase reuse the
// Question bank but are modeled separately via QuizAssignment, since
// their lifecycle — one quiz shared across many students — is different.)
const quizSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    grade: {
      type: String,
      enum: ['10th CBSE', '12th CBSE'],
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      default: null,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    totalQuestions: {
      type: Number,
      required: true,
    },
    // Records how this quiz was actually built, for transparency and
    // analytics — never fabricated, always reflects what really happened.
    generationSource: {
      type: String,
      enum: ['ai', 'database_fallback', 'mixed'],
      required: true,
    },
  },
  { timestamps: true }
);

quizSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('Quiz', quizSchema);
