import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('auth_token') || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Bootstrap session from server on load
  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem('auth_token');
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return null;
    }

    try {
      const data = await authService.getMe();
      if (data && data.user) {
        setUser(data.user);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        return data.user;
      }
    } catch (err) {
      console.warn('Failed to restore authentication session:', err.message);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    if (data && data.token && data.user) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      return data;
    }
    throw new Error('Invalid login response from server.');
  };

  const register = async (formData) => {
    const data = await authService.register(formData);
    if (data && data.token && data.user) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      return data;
    }
    throw new Error('Invalid registration response from server.');
  };

  const logout = () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    } catch {
      // ignore
    }
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (updates) => {
    const data = await authService.updateProfile(updates);
    if (data && data.user) {
      setUser(data.user);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      return data.user;
    }
    return null;
  };

  const changePassword = async ({ currentPassword, newPassword }) => {
    const data = await authService.changePassword({ currentPassword, newPassword });
    if (data && data.token) {
      setToken(data.token);
      localStorage.setItem('auth_token', data.token);
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
      }
    }
    return data;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student',
    login,
    register,
    logout,
    refreshUser,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
