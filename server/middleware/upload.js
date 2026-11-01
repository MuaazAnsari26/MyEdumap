const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const AppError = require('../utils/AppError');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'resources');

const ALLOWED_MIME_TYPES = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename(req, file, cb) {
    const ext = ALLOWED_MIME_TYPES[file.mimetype] || path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, uniqueName);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES[file.mimetype]) {
    cb(new AppError('Only PDF, DOC, and DOCX files are allowed.', 400, 'INVALID_FILE_TYPE'));
    return;
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = { upload, UPLOAD_DIR };
