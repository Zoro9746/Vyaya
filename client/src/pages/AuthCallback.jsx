/**
 * Deprecated AuthCallback page.
 *
 * Google OAuth now redirects directly from the backend to
 * the frontend route (e.g. /dashboard) **without** passing any token
 * in the URL and without using localStorage/sessionStorage.
 *
 * This component is intentionally left as a no-op placeholder
 * and is no longer used in the router.
 */
const AuthCallback = () => {
  return null;
};

export default AuthCallback;
