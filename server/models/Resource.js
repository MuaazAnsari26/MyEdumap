const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
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
    // Optional: a resource can apply to a whole subject rather than one
    // specific chapter.
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      default: null,
    },
    type: {
      type: String,
      enum: ['pdf', 'document', 'notes', 'video', 'link', 'assignment'],
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    // Exactly one of these is populated depending on `type`: an uploaded
    // file gets fileUrl, a 'link' type gets externalUrl. Validated in the
    // service layer, not just here, since multer runs before validation.
    fileUrl: { type: String, default: null },
    fileOriginalName: { type: String, default: null },
    externalUrl: { type: String, default: null },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

resourceSchema.index({ grade: 1, subject: 1, chapter: 1 });
resourceSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('Resource', resourceSchema);
