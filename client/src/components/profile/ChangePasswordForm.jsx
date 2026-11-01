import React, { useState } from 'react';
import userService from '../../services/userService';
import FormField from '../common/FormField';
import Button from '../common/Button';

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!currentPassword) return setError('Please enter your current password.');
    if (newPassword.length < 8) return setError('New password must be at least 8 characters.');
    if (newPassword !== confirmPassword) return setError('New passwords do not match.');

    setIsSubmitting(true);
    try {
      await userService.changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 440 }}>
      <h4>Change password</h4>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {success && <div className="alert alert-success" role="status">Password changed successfully.</div>}
      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Current password"
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
        />
        <FormField
          label="New password"
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          hint="At least 8 characters, including a number."
          autoComplete="new-password"
        />
        <FormField
          label="Confirm new password"
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />
        <Button type="submit" isLoading={isSubmitting}>
          Update password
        </Button>
      </form>
    </div>
  );
}
