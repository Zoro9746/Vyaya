/**
 * Axios API Instance
 * ------------------
 * Uses cookie-based authentication (no localStorage tokens)
 * Works reliably on mobile and desktop browsers
 */

import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // REQUIRED to send cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Global response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If user is unauthorized, redirect to login
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
