/**
 * Auth Context - Global authentication state
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

  useEffect(() => {
    const token = localStorage.getItem('vyaya_token');
    const savedUser = localStorage.getItem('vyaya_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // Verify token and refresh user data
      api
        .get('/auth/me')
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('vyaya_user', JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem('vyaya_token');
          localStorage.removeItem('vyaya_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, ...userData } = res.data;
    localStorage.setItem('vyaya_token', token);
    localStorage.setItem('vyaya_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { token, ...user } = res.data;
    localStorage.setItem('vyaya_token', token);
    localStorage.setItem('vyaya_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const completeSetup = async (setupData) => {
    const res = await api.post('/auth/setup', setupData);
    const updated = { ...user, ...res.data };
    setUser(updated);
    localStorage.setItem('vyaya_user', JSON.stringify(updated));
    return updated;
  };

  const logout = () => {
    localStorage.removeItem('vyaya_token');
    localStorage.removeItem('vyaya_user');
    setUser(null);
  };

  const updateUser = (userData) => {
    const updated = { ...user, ...userData };
    setUser(updated);
    localStorage.setItem('vyaya_user', JSON.stringify(updated));
  };

  const value = {
    user,
    loading,
    login,
    register,
    completeSetup,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
