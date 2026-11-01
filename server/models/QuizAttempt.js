const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema(
  {
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
      unique: true, // one attempt per generated quiz — see Quiz model note
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    answers: [
      {
        question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
        selectedOptionIndex: { type: Number, default: null }, // null = left unanswered
        isCorrect: { type: Boolean, required: true },
      },
    ],
    score: {
      type: Number,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

quizAttemptSchema.index({ student: 1, submittedAt: -1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
