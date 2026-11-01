import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import authService from '../services/authService';
import { registerLogoutHandler } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true); // initial "am I still logged in?" check
  const [authError, setAuthError] = useState(null);

  const handleForcedLogout = useCallback(() => {
    setUser(null);
  }, []);

  useEffect(() => {
    registerLogoutHandler(handleForcedLogout);
  }, [handleForcedLogout]);

  // On first load, silently try to refresh the session from the httpOnly
  // cookie so a page reload doesn't kick the user back to login.
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const refreshedUser = await authService.tryRefreshSession();
        if (isMounted) setUser(refreshedUser);
      } catch (err) {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsBootstrapping(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (identifier, password) => {
    setAuthError(null);
    try {
      const loggedInUser = await authService.login({ identifier, password });
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      setAuthError(err.friendlyMessage || 'Login failed.');
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  // Lets the Profile page reflect a name change immediately in the
  // navbar/sidebar, without needing a full re-login or page refresh —
  // the backend is the source of truth and has already been updated by
  // the time this is called.
  const updateUserName = useCallback((newName) => {
    setUser((prev) => (prev ? { ...prev, name: newName } : prev));
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isBootstrapping,
      authError,
      setAuthError,
      login,
      logout,
      updateUserName,
    }),
    [user, isBootstrapping, authError, login, logout, updateUserName]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
