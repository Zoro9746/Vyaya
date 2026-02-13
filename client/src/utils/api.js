/**
 * Axios API Instance
 * ------------------
 * Cookie-based authentication (no localStorage tokens)
 * Prevents redirect loops on 401
 */

import axios from 'axios';

// Base URL: set VITE_API_URL on Vercel to your Render backend (no trailing slash)
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

// Prevent multiple redirects firing at once
let isRedirectingToLogin = false;

// Routes where we should NOT redirect again (avoid loops)
const AUTH_PAGES = new Set(['/login', '/register', '/setup']);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If there's no response at all, it's usually network/CORS/server-down.
    // Don't redirect (it would create confusing reload loops).
    if (!error.response) {
      return Promise.reject(error);
    }

    const status = error.response.status;
    const path = window.location.pathname;

    if (status === 401) {
      // Avoid redirect loop and avoid redirecting while already on auth pages
      if (!isRedirectingToLogin && !AUTH_PAGES.has(path)) {
        isRedirectingToLogin = true;

        // replace prevents "back" button bounce and reduces reload-loop feeling
        window.location.replace('/login');
      }
    }

    return Promise.reject(error);
  }
);

export default api;