const mongoose = require('mongoose');

// Distinct from the student's personal Quiz model — a TeacherQuiz is a
// reusable template that gets assigned to (potentially many) students,
// whereas Quiz is a one-shot personal practice session. Their lifecycles
// are different enough to warrant separate models rather than one
// polymorphic schema.
const teacherQuizSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
      maxlength: 150,
    },
    grade: {
      type: String,
      enum: ['10th CBSE', '12th CBSE'],
      required: true,
    },
    mode: {
      type: String,
      enum: ['generated', 'custom'],
      required: true,
    },
    // Set for 'generated' mode (single subject/chapter scope). Left null
    // for 'custom' mode, since each question may span a different
    // subject/chapter — the quiz itself has no single scope.
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
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
    generationSource: {
      type: String,
      enum: ['ai', 'database_fallback', 'mixed', 'manual'],
      required: true,
    },
  },
  { timestamps: true }
);

teacherQuizSchema.index({ teacher: 1, createdAt: -1 });

module.exports = mongoose.model('TeacherQuiz', teacherQuizSchema);
