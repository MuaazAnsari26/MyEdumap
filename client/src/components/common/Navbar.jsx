import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header
      style={{
        borderBottom: '1px solid var(--line)',
        background: 'rgba(245,246,242,0.92)',
        backdropFilter: 'blur(6px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="container"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}
      >
        <Link
          to="/"
          style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
          aria-label="EduMap home"
        >
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
            <circle cx="6" cy="20" r="3" fill="var(--marigold)" />
            <circle cx="13" cy="6" r="3" fill="var(--route)" />
            <circle cx="21" cy="16" r="3" fill="var(--sky)" />
            <path
              d="M6 20 L13 6 L21 16"
              stroke="var(--ink)"
              strokeWidth="1.6"
              strokeDasharray="3 3"
              fill="none"
            />
          </svg>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 600, color: 'var(--ink)' }}>
            EduMap
          </span>
        </Link>

        <nav
          className="desktop-nav"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}
        >
          <a href="/#features" style={{ color: 'var(--ink-soft)', fontSize: '0.92rem', fontWeight: 500 }}>
            Features
          </a>
          <a href="/#how-it-works" style={{ color: 'var(--ink-soft)', fontSize: '0.92rem', fontWeight: 500 }}>
            How it works
          </a>

          {isAuthenticated ? (
            <>
              <Link
                to={user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'}
                style={{ color: 'var(--ink-soft)', fontSize: '0.92rem', fontWeight: 500 }}
              >
                Dashboard
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to="/login/student" style={{ color: 'var(--ink-soft)', fontSize: '0.92rem', fontWeight: 500 }}>
                Student Login
              </Link>
              <Link to="/login/teacher" style={{ color: 'var(--ink-soft)', fontSize: '0.92rem', fontWeight: 500 }}>
                Teacher Login
              </Link>
              <Link to="/register/student">
                <Button variant="primary" size="sm">
                  Get started
                </Button>
              </Link>
            </>
          )}
        </nav>

        <button
          className="mobile-nav-toggle"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            display: 'none',
            background: 'none',
            border: '1px solid var(--line-strong)',
            borderRadius: 8,
            width: 40,
            height: 40,
            cursor: 'pointer',
          }}
        >
          <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
        </button>
      </div>

      {menuOpen && (
        <div
          className="mobile-menu"
          style={{
            borderTop: '1px solid var(--line)',
            padding: 'var(--space-4) var(--space-4) var(--space-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <a href="/#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="/#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          {isAuthenticated ? (
            <>
              <Link to={user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
              <Button variant="outline" onClick={handleLogout}>Log out</Button>
            </>
          ) : (
            <>
              <Link to="/login/student" onClick={() => setMenuOpen(false)}>Student Login</Link>
              <Link to="/login/teacher" onClick={() => setMenuOpen(false)}>Teacher Login</Link>
              <Link to="/register/student" onClick={() => setMenuOpen(false)}>
                <Button variant="primary" block>Get started</Button>
              </Link>
            </>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 860px) {
          .desktop-nav { display: none !important; }
          .mobile-nav-toggle { display: flex !important; align-items: center; justify-content: center; }
        }
      `}</style>
    </header>
  );
}
