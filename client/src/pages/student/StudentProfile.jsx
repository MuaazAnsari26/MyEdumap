import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import userService from '../../services/userService';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import KeyBadge from '../../components/common/KeyBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ChangePasswordForm from '../../components/profile/ChangePasswordForm';

const USERNAME_PATTERN = /^[a-zA-Z0-9_.]+$/;

const GRADE_OPTIONS = [
  { value: '10th CBSE', label: '10th CBSE' },
  { value: '12th CBSE', label: '12th CBSE' },
];

export default function StudentProfile() {
  const { updateUserName } = useAuth();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [grade, setGrade] = useState('');
  const [detailsError, setDetailsError] = useState(null);
  const [detailsSuccess, setDetailsSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    authService
      .fetchCurrentUser()
      .then((data) => {
        setUser(data.user);
        setProfile(data.profile);
        setName(data.user.name);
        setUsername(data.user.username || '');
        setGrade(data.profile?.grade || '10th CBSE');
      })
      .catch((err) => setError(err.friendlyMessage))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setDetailsError(null);
    setDetailsSuccess(false);

    if (!name.trim()) return setDetailsError('Name is required.');
    if (!username.trim()) return setDetailsError('Username is required.');
    if (username.trim().length < 3 || username.trim().length > 30) {
      return setDetailsError('Username must be between 3 and 30 characters.');
    }
    if (!USERNAME_PATTERN.test(username.trim())) {
      return setDetailsError('Username can only contain letters, numbers, underscores, and dots.');
    }

    setIsSaving(true);
    try {
      const result = await userService.updateProfile({ name: name.trim(), username: username.trim(), grade });
      setUser((prev) => ({ ...prev, name: result.user.name, username: result.user.username }));
      setProfile(result.profile);
      setUsername(result.user.username);
      setGrade(result.profile?.grade || grade);
      updateUserName(result.user.name);
      setDetailsSuccess(true);
    } catch (err) {
      setDetailsError(err.friendlyMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingSpinner label="Loading your profile…" />;
  if (error) return <div className="alert alert-error" role="alert">{error}</div>;
  if (!user) return null;

  return (
    <div>
      <span className="eyebrow">Profile</span>
      <h2>Your account</h2>

      <div style={{ display: 'grid', gap: 'var(--space-6)', maxWidth: 440, margin: '0 auto' }}>
        <div className="card">
          <h4>Account details</h4>
          {detailsError && <div className="alert alert-error" role="alert">{detailsError}</div>}
          {detailsSuccess && <div className="alert alert-success" role="status">Profile updated.</div>}
          <form onSubmit={handleSaveDetails} noValidate>
            <FormField label="Full name" id="name" value={name} onChange={(e) => setName(e.target.value)} />
            <FormField
              label="Username"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              hint="Letters, numbers, underscores, and dots only. Used to log in alongside your email."
              autoComplete="username"
            />
            <FormField
              label="Grade"
              id="grade"
              as="select"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              options={GRADE_OPTIONS}
              hint="Changes which curriculum and resources you see. New quiz assignments will be checked against this grade."
            />
            <Button type="submit" isLoading={isSaving} size="sm">
              Save changes
            </Button>
          </form>

          <div style={{ marginTop: 'var(--space-5)', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--line)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--slate)' }}>Email</div>
            <div style={{ fontSize: '0.92rem' }}>
              {user.email}{' '}
              {user.isEmailVerified ? (
                <span style={{ fontSize: '0.72rem', color: 'var(--route-dark)', fontWeight: 600 }}>Verified</span>
              ) : (
                <span style={{ fontSize: '0.72rem', color: 'var(--brick)', fontWeight: 600 }}>Not verified</span>
              )}
            </div>
          </div>
        </div>

        {profile?.connectionKey && <KeyBadge label="Your student connection key" value={profile.connectionKey} />}

        <ChangePasswordForm />
      </div>
    </div>
  );
}
