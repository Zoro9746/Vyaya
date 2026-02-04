import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Redirects to setup page if user hasn't completed initial configuration
 */
const SetupRedirect = ({ children }) => {
  const { user } = useAuth();

  if (user && !user.setupCompleted) {
    return <Navigate to="/setup" replace />;
  }

  return children;
};

export default SetupRedirect;
