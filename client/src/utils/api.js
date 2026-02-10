/**
 * Axios API Instance
 * ------------------
 * Uses cookie-based authentication (no localStorage tokens)
 * Works reliably on mobile and desktop browsers
 */

import axios from 'axios';

// STEP 7 — Base URL: set VITE_API_URL on Vercel to your Render backend (no trailing slash)
// Dev: empty uses Vite proxy; or set VITE_API_URL=http://localhost:5000 for direct + cookies
const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_URL = base ? `${base}/api` : '/api';

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
