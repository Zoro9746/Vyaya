import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Form, Button, Card, Alert, Container } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || '';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (!user.setupCompleted) {
        navigate('/setup');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  return (
    <Container className="py-5" style={{ maxWidth: '420px' }}>
      <Card className="shadow">
        <Card.Body className="p-4">
          <h2 className="text-center mb-4" style={{ color: 'var(--vyaya-primary)' }}>
            Vyaya
          </h2>
          <p className="text-center text-muted mb-4">Sign in to your account</p>

          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>
            <Button
              type="submit"
              variant="primary"
              className="w-100 mb-3"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Form>

          <div className="text-center mb-3">
            <span className="text-muted">— or —</span>
          </div>
          <Button
            variant="outline-secondary"
            className="w-100 mb-3"
            onClick={handleGoogleLogin}
          >
            Sign in with Google
          </Button>

          <p className="text-center mb-0">
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;
