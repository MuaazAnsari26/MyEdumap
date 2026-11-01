import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import PublicLayout from '../layouts/PublicLayout';
import StudentLayout from '../layouts/StudentLayout';
import TeacherLayout from '../layouts/TeacherLayout';
import ProtectedRoute from './ProtectedRoute';

import LandingPage from '../pages/public/LandingPage';
import Login from '../pages/public/Login';
import StudentRegister from '../pages/public/StudentRegister';
import TeacherRegister from '../pages/public/TeacherRegister';
import VerifyEmail from '../pages/public/VerifyEmail';
import NotFound from '../pages/public/NotFound';

import StudentDashboard from '../pages/student/StudentDashboard';
import StudentProfile from '../pages/student/StudentProfile';
import StudentConnections from '../pages/student/StudentConnections';
import StudentCurriculum from '../pages/student/StudentCurriculum';
import StudentResources from '../pages/student/StudentResources';
import StudentQuizzes from '../pages/student/StudentQuizzes';
import QuizAttempt from '../pages/student/QuizAttempt';
import QuizResult from '../pages/student/QuizResult';
import AssignedQuizAttempt from '../pages/student/AssignedQuizAttempt';
import AssignedQuizResult from '../pages/student/AssignedQuizResult';
import TeacherDashboard from '../pages/teacher/TeacherDashboard';
import TeacherProfile from '../pages/teacher/TeacherProfile';
import TeacherConnections from '../pages/teacher/TeacherConnections';
import TeacherClasses from '../pages/teacher/TeacherClasses';
import TeacherResources from '../pages/teacher/TeacherResources';
import TeacherCreateQuiz from '../pages/teacher/TeacherCreateQuiz';
import TeacherAnalytics from '../pages/teacher/TeacherAnalytics';
import StudentChat from '../pages/teacher/StudentChat';
import StudentProgress from '../pages/student/StudentProgress';
import AIDoubtSolver from '../pages/student/AIDoubtSolver';
import TeacherChat from '../pages/student/TeacherChat';

// Placeholder pages for sections that are structurally routed now but
// whose real functionality lands in later phases (Curriculum, Resources,
// Quizzes, etc. in Phase 3+). Each is explicit about being not-yet-built,
// per the "Coming Soon" vs "Empty" distinction the product spec requires.
function ComingSoon({ title }) {
  return (
    <div>
      <span className="eyebrow">Coming soon</span>
      <h2>{title}</h2>
      <div className="empty-state">
        <h4>This feature isn&rsquo;t built yet</h4>
        <p style={{ margin: 0 }}>{title} will be available in a later phase of development.</p>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public site */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login/student" element={<Login role="student" />} />
        <Route path="/login/teacher" element={<Login role="teacher" />} />
        <Route path="/register/student" element={<StudentRegister />} />
        <Route path="/register/teacher" element={<TeacherRegister />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Route>

      {/* Student area */}
      <Route
        element={
          <ProtectedRoute allowedRole="student">
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/curriculum" element={<StudentCurriculum />} />
        <Route path="/student/resources" element={<StudentResources />} />
        <Route path="/student/quizzes" element={<StudentQuizzes />} />
        <Route path="/student/quizzes/:quizId/attempt" element={<QuizAttempt />} />
        <Route path="/student/quizzes/results/:attemptId" element={<QuizResult />} />
        <Route path="/student/quizzes/assigned/:assignmentId/attempt" element={<AssignedQuizAttempt />} />
        <Route path="/student/quizzes/assigned/:assignmentId/result" element={<AssignedQuizResult />} />
        <Route path="/student/progress" element={<StudentProgress />} />
        <Route path="/student/ai-doubt-solver" element={<AIDoubtSolver />} />
        <Route path="/student/teacher-chat" element={<TeacherChat />} />
        <Route path="/student/connections" element={<StudentConnections />} />
        <Route path="/student/profile" element={<StudentProfile />} />
      </Route>

      {/* Teacher area */}
      <Route
        element={
          <ProtectedRoute allowedRole="teacher">
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/classes" element={<TeacherClasses />} />
        <Route path="/teacher/resources" element={<TeacherResources />} />
        <Route path="/teacher/students" element={<ComingSoon title="Students" />} />
        <Route path="/teacher/create-quiz" element={<TeacherCreateQuiz />} />
        {/* Quiz Reports and AI Insights were merged into one Analytics page — 
            these redirects keep any old links/bookmarks working. */}
        <Route path="/teacher/quiz-reports" element={<Navigate to="/teacher/analytics" replace />} />
        <Route path="/teacher/analytics" element={<TeacherAnalytics />} />
        <Route path="/teacher/ai-insights" element={<Navigate to="/teacher/analytics" replace />} />
        <Route path="/teacher/student-chat" element={<StudentChat />} />
        <Route path="/teacher/connections" element={<TeacherConnections />} />
        <Route path="/teacher/profile" element={<TeacherProfile />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
