import { useState, useEffect } from 'react';
import { Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import api from '../utils/api';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, alertsRes] = await Promise.all([
          api.get('/dashboard'),
          api.get('/dashboard/alerts'),
        ]);
        setData(dashboardRes.data);
        setAlerts(alertsRes.data.alerts || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  const cards = [
    {
      title: 'Monthly Income',
      value: data.monthlyIncome,
      variant: 'primary',
      icon: '₹',
    },
    {
      title: 'Planned Spending',
      value: data.plannedSpending,
      variant: 'info',
      icon: '₹',
    },
    {
      title: 'Savings',
      value: data.savings,
      variant: 'success',
      icon: '₹',
    },
    {
      title: 'Expenses Done So Far',
      value: data.expensesSoFar,
      variant: 'warning',
      icon: '₹',
    },
    {
      title: 'Remaining Balance',
      value: data.remainingBalance,
      variant: data.remainingBalance >= 0 ? 'success' : 'danger',
      icon: '₹',
    },
  ];

  return (
    <>
      <h2 className="mb-4">Dashboard</h2>

      {alerts.length > 0 && (
        <Alert variant="danger" className="mb-4">
          <strong>Alerts</strong>
          <ul className="mb-0 mt-2">
            {alerts.map((a, i) => (
              <li key={i}>{a.message}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Row xs={1} md={2} lg={3} className="g-4">
        {cards.map((card) => (
          <Col key={card.title}>
            <Card className="h-100">
              <Card.Body>
                <Card.Title className="text-muted small">{card.title}</Card.Title>
                <Card.Text className="h4 mb-0">
                  {card.icon}
                  {Number(card.value).toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                  })}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
};

export default Dashboard;
