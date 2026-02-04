import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';

/**
 * Handles Google OAuth callback - extracts token from URL and stores in localStorage
 */
const AuthCallback = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('vyaya_token', token);
      api
        .get('/auth/me')
        .then((res) => {
          const user = res.data;
          localStorage.setItem('vyaya_user', JSON.stringify(user));
          window.location.href = user.setupCompleted ? '/' : '/setup';
        })
        .catch(() => {
          localStorage.removeItem('vyaya_token');
          window.location.href = '/login';
        });
    } else {
      window.location.href = '/login';
    }
  }, [searchParams]);

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Completing sign in...</span>
      </div>
    </div>
  );
};

export default AuthCallback;
