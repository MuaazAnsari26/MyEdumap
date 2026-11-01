import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import userService from '../../services/userService';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import KeyBadge from '../../components/common/KeyBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ChangePasswordForm from '../../components/profile/ChangePasswordForm';

export default function TeacherProfile() {
  const { updateUserName } = useAuth();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState(null);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    authService
      .fetchCurrentUser()
      .then((data) => {
        setUser(data.user);
        setProfile(data.profile);
        setName(data.user.name);
      })
      .catch((err) => setError(err.friendlyMessage))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSaveName = async (e) => {
    e.preventDefault();
    setNameError(null);
    setNameSuccess(false);
    if (!name.trim()) return setNameError('Name is required.');

    setIsSaving(true);
    try {
      const result = await userService.updateProfile({ name: name.trim() });
      setUser((prev) => ({ ...prev, name: result.user.name }));
      updateUserName(result.user.name);
      setNameSuccess(true);
    } catch (err) {
      setNameError(err.friendlyMessage);
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
          {nameError && <div className="alert alert-error" role="alert">{nameError}</div>}
          {nameSuccess && <div className="alert alert-success" role="status">Name updated.</div>}
          <form onSubmit={handleSaveName} noValidate>
            <FormField label="Full name" id="name" value={name} onChange={(e) => setName(e.target.value)} />
            <Button type="submit" isLoading={isSaving} size="sm">
              Save name
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

        {profile?.connectionKey && <KeyBadge label="Your teacher connection key" value={profile.connectionKey} />}

        <ChangePasswordForm />
      </div>
    </div>
  );
}
