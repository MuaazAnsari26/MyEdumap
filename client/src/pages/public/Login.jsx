import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthCard from '../../components/auth/AuthCard';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';

// Renders the login form for either role. Keeping one component avoids
// duplicating the same form/validation/error logic twice.
export default function Login({ role }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendState, setResendState] = useState('idle'); // idle | sending | sent
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isTeacher = role === 'teacher';
  const registerPath = isTeacher ? '/register/teacher' : '/register/student';
  const otherLoginPath = isTeacher ? '/login/student' : '/login/teacher';
  const dashboardPath = isTeacher ? '/teacher/dashboard' : '/student/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setNeedsVerification(false);

    if (!identifier.trim() || !password) {
      setError('Please fill in both fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedInUser = await login(identifier.trim(), password);

      if (loggedInUser.role !== role) {
        setError(
          `That account is registered as a ${loggedInUser.role}. Use the ${loggedInUser.role} login instead.`
        );
        return;
      }

      const redirectTo = location.state?.from?.pathname || dashboardPath;
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        setNeedsVerification(true);
      }
      setError(err.friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResendState('sending');
    try {
      await authService.resendVerification(identifier.trim());
      setResendState('sent');
    } catch {
      setResendState('idle');
    }
  };

  return (
    <AuthCard
      eyebrow={isTeacher ? 'For teachers' : 'For students'}
      title={`${isTeacher ? 'Teacher' : 'Student'} login`}
      subtitle="Welcome back — pick up right where you left off."
      footer={
        <>
          New to EduMap? <Link to={registerPath}>Create an account</Link>
          <br />
          <span style={{ color: 'var(--slate-light)' }}>
            Wrong role? <Link to={otherLoginPath}>{isTeacher ? 'Student' : 'Teacher'} login</Link>
          </span>
        </>
      }
    >
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
          {needsVerification && (
            <div style={{ marginTop: 'var(--space-3)' }}>
              {resendState === 'sent' ? (
                <span>A new verification link has been sent, if that account exists.</span>
              ) : (
                <Button size="sm" variant="outline" onClick={handleResend} isLoading={resendState === 'sending'}>
                  Resend verification email
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label={isTeacher ? 'Email' : 'Email or username'}
          id="identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="username"
        />
        <FormField
          label="Password"
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <Button type="submit" block isLoading={isSubmitting}>
          Log in
        </Button>
      </form>
    </AuthCard>
  );
}
