const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// The User model holds only identity/auth concerns. Role-specific data
// (grade, connection keys, classes, etc.) lives in StudentProfile /
// TeacherProfile so this collection stays lean and reusable.
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true, // teachers don't have a username; sparse allows many nulls
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // never returned by default in queries
    },
    role: {
      type: String,
      enum: ['student', 'teacher'],
      required: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// email and username already get a unique index from `unique: true` above;
// only role needs one declared explicitly here.
userSchema.index({ role: 1 });

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.statics.hashPassword = async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plain, salt);
};

// Never send the hash back even if something forgets to .select('-passwordHash')
userSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
