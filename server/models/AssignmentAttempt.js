const mongoose = require('mongoose');

// Mirrors QuizAttempt's shape (see model + gradingUtils comments) but
// references a QuizAssignment instead of a personal Quiz — kept as a
// separate model rather than a polymorphic ref so queries stay simple
// and each side's "one attempt per X" constraint is enforced cleanly.
const assignmentAttemptSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuizAssignment',
      required: true,
      unique: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    answers: [
      {
        question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
        selectedOptionIndex: { type: Number, default: null },
        isCorrect: { type: Boolean, required: true },
      },
    ],
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    percentage: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

assignmentAttemptSchema.index({ student: 1, submittedAt: -1 });

module.exports = mongoose.model('AssignmentAttempt', assignmentAttemptSchema);
