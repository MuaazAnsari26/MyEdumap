import React from 'react';
import { Outlet } from 'react-router-dom';
import DashboardShell from './DashboardShell';

const TEACHER_NAV = [
  { to: '/teacher/dashboard', label: 'Dashboard', end: true },
  { to: '/teacher/classes', label: 'Classes' },
  { to: '/teacher/resources', label: 'Resources' },
  { to: '/teacher/students', label: 'Students' },
  { to: '/teacher/create-quiz', label: 'Create Quiz' },
  { to: '/teacher/analytics', label: 'Analytics' },
  { to: '/teacher/student-chat', label: 'Student Chat' },
  { to: '/teacher/connections', label: 'Connections' },
  { to: '/teacher/profile', label: 'Profile' },
];

export default function TeacherLayout() {
  return (
    <DashboardShell navItems={TEACHER_NAV} roleLabel="Teacher">
      <Outlet />
    </DashboardShell>
  );
}
