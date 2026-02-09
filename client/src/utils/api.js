/**
 * Axios API Instance
 * ------------------
 * Uses cookie-based authentication (no localStorage tokens)
 * Works reliably on mobile and desktop browsers
 */

import axios from 'axios';

// Base API URL:
// - In production, VITE_API_URL should be your backend origin (e.g. https://vyaya-api.onrender.com)
// - In local dev with Vite proxy, you can leave it empty and proxy /api to the backend.
const base = import.meta.env.VITE_API_URL || '';
const API_URL = `${base}/api`;

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
