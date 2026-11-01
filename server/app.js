const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const { env } = require('./config/env');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const classRoutes = require('./routes/classRoutes');
const curriculumRoutes = require('./routes/curriculumRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const quizRoutes = require('./routes/quizRoutes');
const teacherQuizRoutes = require('./routes/teacherQuizRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const aiRoutes = require('./routes/aiRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// ---------- Security & parsing middleware ----------
app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true, // required so the refresh-token cookie is sent/received
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(mongoSanitize()); // strips $ / . operators from user input to block NoSQL injection

if (env.nodeEnv !== 'production') {
  app.use(morgan('dev'));
}

// Generic API-wide rate limit; auth routes layer a stricter one on top.
app.use(
  '/api',
  rateLimit({
    windowMs: env.rateLimit.windowMs,
    max: env.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ---------- Health check ----------
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'EduMap API is running.' });
});

// ---------- Routes ----------
// Uploaded resource files (PDFs/docs) are served statically. They're
// course materials, not private user data, so no auth gate is needed
// beyond the app already requiring login to discover their URLs via /api/resources.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/teacher-quizzes', teacherQuizRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);

// ---------- 404 + error handling ----------
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
