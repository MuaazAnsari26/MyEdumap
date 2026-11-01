const mongoose = require('mongoose');

// One document per (teacherQuiz, student) pair — even for "entire class"
// or "all students" assignment, each recipient gets their own row. This
// keeps "is this assigned to me" and "who has completed this" trivial
// queries instead of requiring array-membership checks everywhere.
const quizAssignmentSchema = new mongoose.Schema(
  {
    teacherQuiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TeacherQuiz',
      required: true,
    },
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
    // Records how this recipient was selected, for transparency/debugging
    // — not used for access control (the row existing is what grants access).
    assignedVia: {
      type: String,
      enum: ['single', 'selected', 'class', 'all'],
      required: true,
    },
    classRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// A given quiz can only be assigned to the same student once — re-running
// an "assign to all" doesn't create duplicates for students already assigned.
quizAssignmentSchema.index({ teacherQuiz: 1, student: 1 }, { unique: true });
quizAssignmentSchema.index({ student: 1, status: 1 });
quizAssignmentSchema.index({ teacher: 1, teacherQuiz: 1 });

module.exports = mongoose.model('QuizAssignment', quizAssignmentSchema);
