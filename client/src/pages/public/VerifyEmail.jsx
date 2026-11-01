import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthCard from '../../components/auth/AuthCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import authService from '../../services/authService';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token.');
      return;
    }
    (async () => {
      try {
        const res = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(res.message);
      } catch (err) {
        setStatus('error');
        setMessage(err.friendlyMessage);
      }
    })();
  }, [token]);

  return (
    <AuthCard eyebrow="Email verification" title="Verifying your email">
      {status === 'verifying' && <LoadingSpinner label="Verifying your link…" />}
      {status === 'success' && (
        <>
          <div className="alert alert-success" role="status">{message}</div>
          <Link to="/login/student" className="btn btn-primary btn-block">
            Continue to login
          </Link>
        </>
      )}
      {status === 'error' && <div className="alert alert-error" role="alert">{message}</div>}
    </AuthCard>
  );
}
