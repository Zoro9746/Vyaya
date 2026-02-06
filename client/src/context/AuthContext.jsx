/**
 * Auth Context
 * ------------
 * Manages global authentication state using
 * secure, cookie-based authentication.
 * No tokens are stored in localStorage.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * On app load:
   * Ask backend if user is authenticated (via cookie)
   */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  /**
   * Login (email + password)
   * Backend sets HTTP-only cookie
   */
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setUser(res.data);
    return res.data;
  };

  /**
   * Register new user
   * Backend sets HTTP-only cookie
   */
  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    setUser(res.data);
    return res.data;
  };

  /**
   * Complete initial setup
   */
  const completeSetup = async (setupData) => {
    const res = await api.post('/auth/setup', setupData);
    setUser(res.data);
    return res.data;
  };

  /**
   * Logout user
   * Backend clears auth cookie
   */
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore errors
    } finally {
      setUser(null);
    }
  };

  /**
   * Update user locally (profile edits)
   */
  const updateUser = (userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    completeSetup,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
