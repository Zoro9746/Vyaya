import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Card, Alert, Container, Row, Col } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Others'];

const Setup = () => {
  const [formData, setFormData] = useState({
    monthlyIncome: '',
    plannedSpending: '',
    monthlySavingsGoal: '',
    categoryBudgets: DEFAULT_CATEGORIES.map((c) => ({ category: c, amount: 0 })),
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { completeSetup } = useAuth();
  const navigate = useNavigate();

  const totalCategoryBudget = formData.categoryBudgets.reduce(
    (sum, cb) => sum + (parseFloat(cb.amount) || 0),
    0
  );
  const plannedSpending = parseFloat(formData.plannedSpending) || 0;
  const budgetExceedsPlanned = totalCategoryBudget > plannedSpending && plannedSpending > 0;

  const handleCategoryChange = (index, value) => {
    const updated = [...formData.categoryBudgets];
    updated[index].amount = parseFloat(value) || 0;
    setFormData({ ...formData, categoryBudgets: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (budgetExceedsPlanned) {
      setError('Total category budget cannot exceed the amount you decided to spend.');
      return;
    }
    const planned = parseFloat(formData.plannedSpending);
    const income = parseFloat(formData.monthlyIncome);
    if (planned > income) {
      setError('Planned spending cannot exceed monthly income.');
      return;
    }
    setLoading(true);
    try {
      await completeSetup({
        monthlyIncome: income,
        plannedSpending: planned,
        categoryBudgets: formData.categoryBudgets.filter((cb) => (cb.amount || 0) > 0),
        monthlySavingsGoal: parseFloat(formData.monthlySavingsGoal) || 0,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5" style={{ maxWidth: '640px' }}>
      <Card className="shadow">
        <Card.Body className="p-4">
          <h3 className="mb-3" style={{ color: 'var(--vyaya-primary)' }}>
            Complete Your Setup
          </h3>
          <p className="text-muted mb-4">
            Configure your monthly income, planned spending, and category budgets.
          </p>

          {error && <Alert variant="danger">{error}</Alert>}
          {budgetExceedsPlanned && (
            <Alert variant="warning">
              Total category budget cannot exceed the amount you decided to spend.
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Monthly Income</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                value={formData.monthlyIncome}
                onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Planned Spending (amount you decide to spend)</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                value={formData.plannedSpending}
                onChange={(e) => setFormData({ ...formData, plannedSpending: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Monthly Savings Goal</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                min="0"
                value={formData.monthlySavingsGoal}
                onChange={(e) => setFormData({ ...formData, monthlySavingsGoal: e.target.value })}
              />
            </Form.Group>

            <h6 className="mt-4 mb-3">Category-wise Budget Allocation</h6>
            <p className="text-muted small mb-3">
              Sum of category budgets must be ≤ planned spending
            </p>
            <Row>
              {formData.categoryBudgets.map((cb, idx) => (
                <Col md={6} key={cb.category} className="mb-2">
                  <Form.Group>
                    <Form.Label className="small">{cb.category}</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      value={cb.amount || ''}
                      onChange={(e) => handleCategoryChange(idx, e.target.value)}
                    />
                  </Form.Group>
                </Col>
              ))}
            </Row>
            <p className="small mt-2">
              Total: ₹{totalCategoryBudget.toFixed(2)} / Planned: ₹{plannedSpending.toFixed(2)}
            </p>

            <Button type="submit" variant="primary" className="mt-3 w-100" disabled={loading}>
              {loading ? 'Saving...' : 'Complete Setup'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Setup;
