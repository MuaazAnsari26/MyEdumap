const mongoose = require('mongoose');

const teacherProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    connectionKey: {
      type: String,
      required: true,
      unique: true, // unique: true already creates an index; no need for index: true too
    },
    // Denormalized counters kept in sync by the connection/class services
    // in later phases.
    connectedStudentCount: { type: Number, default: 0 },
    classCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TeacherProfile', teacherProfileSchema);
