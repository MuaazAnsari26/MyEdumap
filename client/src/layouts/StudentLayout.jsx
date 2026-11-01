import React from 'react';
import { Outlet } from 'react-router-dom';
import DashboardShell from './DashboardShell';

const STUDENT_NAV = [
  { to: '/student/dashboard', label: 'Dashboard', end: true },
  { to: '/student/curriculum', label: 'Curriculum' },
  { to: '/student/resources', label: 'Resources' },
  { to: '/student/quizzes', label: 'Quizzes' },
  { to: '/student/progress', label: 'Progress' },
  { to: '/student/ai-doubt-solver', label: 'AI Doubt Solver' },
  { to: '/student/teacher-chat', label: 'Teacher Chat' },
  { to: '/student/connections', label: 'Connections' },
  { to: '/student/profile', label: 'Profile' },
];

export default function StudentLayout() {
  return (
    <DashboardShell navItems={STUDENT_NAV} roleLabel="Student">
      <Outlet />
    </DashboardShell>
  );
}
