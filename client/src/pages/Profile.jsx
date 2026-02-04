import { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
  });
  const [financialData, setFinancialData] = useState({
    monthlyIncome: '',
    plannedSpending: '',
    monthlySavingsGoal: '',
    categoryBudgets: [],
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
      });
      setFinancialData({
        monthlyIncome: user.monthlyIncome || '',
        plannedSpending: user.plannedSpending || '',
        monthlySavingsGoal: user.monthlySavingsGoal || '',
        categoryBudgets: user.categoryBudgets || [],
      });
    }
  }, [user]);

  const totalCategoryBudget = (financialData.categoryBudgets || []).reduce(
    (sum, cb) => sum + (parseFloat(cb.amount) || 0),
    0
  );
  const plannedSpending = parseFloat(financialData.plannedSpending) || 0;
  const budgetExceedsPlanned = totalCategoryBudget > plannedSpending && plannedSpending > 0;

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await api.put('/users/profile', profileData);
      updateUser(res.data);
      setSuccess('Profile updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFinancialSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (budgetExceedsPlanned) {
      setError('Total category budget cannot exceed the amount you decided to spend.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.put('/users/financial', {
        monthlyIncome: parseFloat(financialData.monthlyIncome),
        plannedSpending: plannedSpending,
        categoryBudgets: financialData.categoryBudgets,
        monthlySavingsGoal: parseFloat(financialData.monthlySavingsGoal) || 0,
      });
      updateUser(res.data);
      setSuccess('Financial settings updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (index, value) => {
    const updated = [...(financialData.categoryBudgets || [])];
    if (!updated[index]) {
      updated[index] = { category: '', amount: 0 };
    }
    updated[index].amount = parseFloat(value) || 0;
    setFinancialData({ ...financialData, categoryBudgets: updated });
  };

  return (
    <>
      <h2 className="mb-4">Profile</h2>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Row>
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Personal Details</Card.Title>
              <Form onSubmit={handleProfileSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" value={profileData.email} disabled />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Control
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                  />
                </Form.Group>
                <Button type="submit" variant="primary" disabled={loading}>
                  Update Profile
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card>
            <Card.Body>
              <Card.Title>Financial Settings</Card.Title>
              {budgetExceedsPlanned && (
                <Alert variant="warning" className="small">
                  Total category budget cannot exceed planned spending.
                </Alert>
              )}
              <Form onSubmit={handleFinancialSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Monthly Income</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={financialData.monthlyIncome}
                    onChange={(e) =>
                      setFinancialData({ ...financialData, monthlyIncome: e.target.value })
                    }
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Planned Spending</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={financialData.plannedSpending}
                    onChange={(e) =>
                      setFinancialData({ ...financialData, plannedSpending: e.target.value })
                    }
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Monthly Savings Goal</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={financialData.monthlySavingsGoal}
                    onChange={(e) =>
                      setFinancialData({ ...financialData, monthlySavingsGoal: e.target.value })
                    }
                  />
                </Form.Group>
                <h6 className="mt-3">Category Budgets</h6>
                {(financialData.categoryBudgets || []).map((cb, idx) => (
                  <Form.Group key={idx} className="mb-2">
                    <Form.Label className="small">{cb.category}</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      value={cb.amount || ''}
                      onChange={(e) => handleCategoryChange(idx, e.target.value)}
                    />
                  </Form.Group>
                ))}
                <Button type="submit" variant="primary" className="mt-3" disabled={loading}>
                  Update Financial Settings
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Profile;
