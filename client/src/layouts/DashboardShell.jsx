import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Shared chrome for both the student and teacher areas. Role-specific
// layouts pass in their own nav items and role label so this file stays
// the single source of truth for responsive dashboard behavior.
export default function DashboardShell({ navItems, roleLabel, children }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Desktop sidebar */}
      <aside
        className="dashboard-sidebar"
        style={{
          width: 240,
          flexShrink: 0,
          borderRight: '1px solid var(--line)',
          padding: 'var(--space-6) var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-6)',
        }}
      >
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, padding: '0 var(--space-2)' }}>
          EduMap
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                padding: '0.6rem 0.75rem',
                borderRadius: 8,
                fontSize: '0.9rem',
                fontWeight: 500,
                color: isActive ? 'var(--route-dark)' : 'var(--ink-soft)',
                background: isActive ? 'var(--route-light)' : 'transparent',
                textDecoration: 'none',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--line)', paddingTop: 'var(--space-4)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.name}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--slate-light)', marginBottom: 'var(--space-3)' }}>{roleLabel}</div>
          <button
            className="btn btn-outline btn-sm btn-block"
            onClick={handleLogout}
            type="button"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div
        className="dashboard-topbar"
        style={{
          display: 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          background: 'var(--paper)',
          borderBottom: '1px solid var(--line)',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--space-4)',
          zIndex: 40,
        }}
      >
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>EduMap</span>
        <button
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          style={{ background: 'none', border: '1px solid var(--line-strong)', borderRadius: 8, width: 38, height: 38 }}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="dashboard-mobile-menu"
          style={{
            display: 'none',
            position: 'fixed',
            top: 60,
            left: 0,
            right: 0,
            background: 'var(--paper)',
            borderBottom: '1px solid var(--line)',
            padding: 'var(--space-4)',
            zIndex: 39,
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              style={({ isActive }) => ({
                padding: '0.6rem 0.75rem',
                borderRadius: 8,
                fontSize: '0.9rem',
                fontWeight: 500,
                color: isActive ? 'var(--route-dark)' : 'var(--ink-soft)',
                background: isActive ? 'var(--route-light)' : 'transparent',
                textDecoration: 'none',
              })}
            >
              {item.label}
            </NavLink>
          ))}
          <button className="btn btn-outline btn-sm" onClick={handleLogout} type="button" style={{ marginTop: 'var(--space-2)' }}>
            Log out
          </button>
        </div>
      )}

      <main className="dashboard-main" style={{ flex: 1, padding: 'var(--space-7) var(--space-6)', maxWidth: '100%', overflowX: 'hidden' }}>
        {children}
      </main>

      <style>{`
        @media (max-width: 900px) {
          .dashboard-sidebar { display: none !important; }
          .dashboard-topbar { display: flex !important; }
          .dashboard-mobile-menu { display: flex !important; }
          .dashboard-main { padding-top: calc(60px + var(--space-6)) !important; }
        }
      `}</style>
    </div>
  );
}
