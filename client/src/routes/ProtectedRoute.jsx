import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Wrap route elements with this to require authentication, and optionally
// a specific role. Unauthorized users are redirected, never shown a
// blank page or the protected content.
export default function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, isBootstrapping, user } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return <LoadingSpinner label="Checking your session…" />;
  }

  if (!isAuthenticated) {
    const loginPath = allowedRole === 'teacher' ? '/login/teacher' : '/login/student';
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    // Logged in, but as the wrong role — send them to their own dashboard
    // rather than an access-denied dead end.
    const ownDashboard = user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard';
    return <Navigate to={ownDashboard} replace />;
  }

  return children;
}
