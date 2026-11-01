import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthCard from '../../components/auth/AuthCard';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import authService from '../../services/authService';

const initialForm = { name: '', email: '', password: '', confirmPassword: '' };

export default function TeacherRegister() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email address.';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await authService.registerTeacher(form);
      setSuccessInfo(res.data);
    } catch (err) {
      setServerError(err.friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successInfo) {
    return (
      <AuthCard eyebrow="Waypoint 1 of 1" title="Check your inbox" subtitle="Your EduMap teacher account has been created.">
        <div className="alert alert-success" role="status">
          We sent a verification link to <strong>{successInfo.user.email}</strong>. Verify your email, then log in.
        </div>
        <div className="card" style={{ background: 'var(--paper-alt)', border: '1px dashed var(--line-strong)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate)', marginBottom: 4 }}>Your teacher connection key</div>
          <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--route-dark)' }}>
            {successInfo.profile.connectionKey}
          </div>
          <p style={{ fontSize: '0.8rem', margin: '8px 0 0' }}>
            Share this with your students so they can connect with you. You'll also find it in your profile later.
          </p>
        </div>
        <Button block onClick={() => navigate('/login/teacher')} style={{ marginTop: 'var(--space-5)' }}>
          Go to login
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow="For teachers"
      title="Create your teacher account"
      subtitle="Build classes, assign quizzes, and see exactly where your students need support."
      footer={
        <>
          Already have an account? <Link to="/login/teacher">Log in</Link>
        </>
      }
    >
      {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Full name" id="name" value={form.name} onChange={update('name')} error={errors.name} autoComplete="name" />
        <FormField label="Email" id="email" type="email" value={form.email} onChange={update('email')} error={errors.email} autoComplete="email" />
        <FormField
          label="Password"
          id="password"
          type="password"
          value={form.password}
          onChange={update('password')}
          error={errors.password}
          hint="At least 8 characters, including a number."
          autoComplete="new-password"
        />
        <FormField
          label="Confirm password"
          id="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />
        <Button type="submit" block isLoading={isSubmitting}>
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
