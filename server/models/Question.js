const mongoose = require('mongoose');

// Every question carries full curriculum metadata for analytics, but the
// quiz-taking endpoints deliberately strip subject/chapter/topic/correctAnswer
// before sending a question to a student mid-attempt (see quizController) —
// this schema itself stays complete; the stripping happens at the API layer.
const questionSchema = new mongoose.Schema(
  {
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
    // Freeform, finer-grained than chapter — lets AI or a teacher tag a
    // specific concept within a chapter for later weak-spot analytics,
    // without requiring the curriculum tree itself to go that deep.
    topic: {
      type: String,
      trim: true,
      default: null,
    },
    questionText: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator(arr) {
          return (
            Array.isArray(arr) &&
            arr.length === 4 &&
            arr.every((opt) => typeof opt === 'string' && opt.trim().length > 0) &&
            new Set(arr.map((o) => o.trim().toLowerCase())).size === 4
          );
        },
        message: 'A question must have exactly 4 non-empty, unique options.',
      },
    },
    correctAnswerIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    explanation: {
      type: String,
      required: [true, 'An explanation is required'],
      trim: true,
    },
    // Where this question originated — used both for analytics and to
    // decide reuse eligibility in the fallback flow.
    source: {
      type: String,
      enum: ['ai', 'teacher'],
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for AI-generated questions
    },
  },
  { timestamps: true }
);

questionSchema.index({ grade: 1, subject: 1, chapter: 1 });

module.exports = mongoose.model('Question', questionSchema);
