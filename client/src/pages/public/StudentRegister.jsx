import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthCard from '../../components/auth/AuthCard';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import authService from '../../services/authService';

const GRADE_OPTIONS = [
  { value: '', label: 'Select your grade' },
  { value: '10th CBSE', label: '10th CBSE' },
  { value: '12th CBSE', label: '12th CBSE' },
];

const initialForm = { name: '', username: '', email: '', password: '', confirmPassword: '', grade: '' };

export default function StudentRegister() {
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
    if (!form.username.trim()) errs.username = 'Username is required.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email address.';
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    if (!form.grade) errs.grade = 'Please select your grade.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await authService.registerStudent(form);
      setSuccessInfo(res.data);
    } catch (err) {
      setServerError(err.friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successInfo) {
    return (
      <AuthCard eyebrow="Waypoint 1 of 1" title="Check your inbox" subtitle="Your EduMap account has been created.">
        <div className="alert alert-success" role="status">
          We sent a verification link to <strong>{successInfo.user.email}</strong>. Verify your email, then log in.
        </div>
        <div className="card" style={{ background: 'var(--paper-alt)', border: '1px dashed var(--line-strong)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate)', marginBottom: 4 }}>Your student connection key</div>
          <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--route-dark)' }}>
            {successInfo.profile.connectionKey}
          </div>
          <p style={{ fontSize: '0.8rem', margin: '8px 0 0' }}>
            Share this with a teacher so they can connect with you. You'll also find it in your profile later.
          </p>
        </div>
        <Button block onClick={() => navigate('/login/student')} style={{ marginTop: 'var(--space-5)' }}>
          Go to login
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow="For students"
      title="Create your student account"
      subtitle="Start your route through the CBSE curriculum with quizzes, progress tracking, and a teacher by your side."
      footer={
        <>
          Already have an account? <Link to="/login/student">Log in</Link>
        </>
      }
    >
      {serverError && <div className="alert alert-error" role="alert">{serverError}</div>}
      <form onSubmit={handleSubmit} noValidate>
        <FormField label="Full name" id="name" value={form.name} onChange={update('name')} error={errors.name} autoComplete="name" />
        <FormField label="Username" id="username" value={form.username} onChange={update('username')} error={errors.username} autoComplete="username" />
        <FormField label="Email" id="email" type="email" value={form.email} onChange={update('email')} error={errors.email} autoComplete="email" />
        <FormField
          label="Grade / Standard"
          id="grade"
          as="select"
          options={GRADE_OPTIONS}
          value={form.grade}
          onChange={update('grade')}
          error={errors.grade}
        />
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
