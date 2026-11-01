const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    grade: {
      type: String,
      enum: ['10th CBSE', '12th CBSE'],
      required: [true, 'Grade/standard is required'],
    },
    connectionKey: {
      type: String,
      required: true,
      unique: true, // unique: true already creates an index; no need for index: true too
    },
    // Denormalized counters kept in sync by the connection/class services
    // in later phases, so dashboard cards don't need heavy aggregations.
    connectedTeacherCount: { type: Number, default: 0 },
    classCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
