# 🎓 EduMap

A full-stack MERN educational platform that connects students and teachers through AI-powered quizzes, real-time chat, curriculum management, analytics, and resource sharing.

## ✨ Features

| Role | Capabilities |
|------|-------------|
| **Student** | AI quiz generation, assigned quizzes, AI doubt solver, curriculum viewer, resource access, teacher chat, progress analytics, connection key system |
| **Teacher** | Bulk & custom quiz builder, quiz assignment, resource uploads, student analytics & insights, class management, student chat |

## 🛠️ Tech Stack

**Frontend**
- React 18 + Vite
- React Router v6
- Recharts (analytics charts)
- KaTeX + react-markdown (math & markdown rendering)
- Axios

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication (access + rotating refresh tokens, httpOnly cookies)
- Nodemailer (email verification)
- Google Gemini API (AI quiz generation & doubt solver)
- Multer (file uploads)
- Helmet, CORS, rate limiting, NoSQL sanitization

## 📁 Project Structure

```
MyEduMap/
├── client/               # React + Vite frontend
│   └── src/
│       ├── components/   # analytics, auth, chat, common, quiz, teacher, student
│       ├── context/      # AuthContext
│       ├── layouts/      # DashboardShell, role-based layouts
│       ├── pages/        # public, student, teacher pages
│       ├── routes/       # AppRoutes, ProtectedRoute
│       └── services/     # API client + domain services
└── server/               # Express + MongoDB backend
    ├── config/           # DB connection, env
    ├── controllers/      # Route handlers
    ├── middleware/        # Auth, error, rate-limit, validation, upload
    ├── models/           # Mongoose schemas
    ├── routes/           # Express routers
    ├── scripts/          # seedCurriculum.js
    ├── services/         # ai, analytics, assignment, auth, chat, class,
    │                     #   connection, curriculum, notifications, quiz,
    │                     #   resources, user
    ├── utils/            # AppError, asyncHandler
    └── validators/       # express-validator rule sets
```

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (Atlas free tier works)
- A Google Gemini API key (optional — app falls back to saved questions)

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/MyEduMap.git
cd MyEduMap
```

### 2. Backend setup

```bash
cd server
npm install
cp .env.example .env
```

Open `server/.env` and fill in at minimum:
- `MONGO_URI` — your MongoDB connection string
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `EMAIL_VERIFICATION_SECRET` — any long random strings
- `GEMINI_API_KEY` — for AI features (optional)

```bash
npm run dev          # starts API on http://localhost:5000
```

#### Seed the curriculum (required for quiz/curriculum features)

```bash
npm run seed:curriculum
```

### 3. Frontend setup

```bash
cd ../client
npm install
cp .env.example .env
npm run dev          # starts app on http://localhost:5173
```

## 🔑 Environment Variables

| File | Key variable | Description |
|------|-------------|-------------|
| `server/.env` | `MONGO_URI` | MongoDB connection string |
| `server/.env` | `JWT_SECRET` | Access token signing key |
| `server/.env` | `JWT_REFRESH_SECRET` | Refresh token signing key |
| `server/.env` | `EMAIL_VERIFICATION_SECRET` | Email link signing key |
| `server/.env` | `GEMINI_API_KEY` | Google Gemini AI key |
| `server/.env` | `SMTP_*` | Email settings (optional for dev) |
| `client/.env` | `VITE_API_BASE_URL` | API base path (default `/api`) |

> **Note:** Never commit `.env` files. Use the provided `.env.example` files as templates.

## 📖 Usage Guide

1. Register as a **student** or **teacher** at `/register`
2. Copy the verification link from the server console (or your inbox)
3. Log in — each user gets a unique connection key (`EDU-STU-XXXXXX` / `EDU-TCH-XXXXXX`)
4. Use connection keys to link students and teachers, or create/join classes
5. **Students:** generate AI quizzes, attempt assigned quizzes, chat with teachers, browse resources
6. **Teachers:** build and assign quizzes, upload resources, view per-student analytics

## 🤝 Contributing

Pull requests are welcome! Please open an issue first to discuss what you'd like to change.

## 📄 License

[MIT](LICENSE)
