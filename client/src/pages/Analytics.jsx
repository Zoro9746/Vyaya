import { useState, useEffect } from 'react';
import { Card, Row, Col, Spinner, ProgressBar } from 'react-bootstrap';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import api from '../utils/api';

const COLORS = ['#2c5f2d', '#97bc62', '#5c8a3e', '#1a3c1a', '#6b9b4a', '#3d6b2e', '#4a7c35'];

const Analytics = () => {
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState({ labels: [], values: [] });
  const [budgetUsage, setBudgetUsage] = useState([]);
  const [savingsGoal, setSavingsGoal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [cat, month, budget, savings] = await Promise.all([
          api.get('/analytics/category-distribution'),
          api.get('/analytics/monthly-comparison'),
          api.get('/analytics/budget-usage'),
          api.get('/analytics/savings-goal'),
        ]);
        setCategoryData(cat.data);
        setMonthlyData(month.data);
        setBudgetUsage(budget.data);
        setSavingsGoal(savings.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" />
      </div>
    );
  }

  const barChartData = monthlyData.labels?.map((l, i) => ({
    name: l,
    amount: monthlyData.values?.[i] || 0,
  })) || [];

  return (
    <>
      <h2 className="mb-4">Analytics</h2>

      <Row className="g-4">
        <Col lg={6}>
          <Card>
            <Card.Body>
              <Card.Title>Category-wise Expense Distribution</Card.Title>
              {categoryData.length === 0 ? (
                <p className="text-muted">No expenses this month</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, value }) => `${name}: ₹${value}`}
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`₹${v}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card>
            <Card.Body>
              <Card.Title>Month-over-Month Expenses</Card.Title>
              {barChartData.length === 0 ? (
                <p className="text-muted">No data</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barChartData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(v) => [`₹${v}`, 'Expenses']} />
                    <Bar dataKey="amount" fill="#2c5f2d" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card>
            <Card.Body>
              <Card.Title>Category Budget Usage</Card.Title>
              {budgetUsage.length === 0 ? (
                <p className="text-muted">No category budgets set</p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {budgetUsage.map((bu) => (
                    <div key={bu.category}>
                      <div className="d-flex justify-content-between small mb-1">
                        <span>{bu.category}</span>
                        <span>
                          ₹{bu.spent} / ₹{bu.budget}
                          {bu.exceeded && (
                            <span className="text-danger ms-1">(Exceeded)</span>
                          )}
                        </span>
                      </div>
                      <ProgressBar
                        variant={bu.exceeded ? 'danger' : 'success'}
                        now={Math.min(bu.percentage, 100)}
                        label={`${bu.percentage}%`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card>
            <Card.Body>
              <Card.Title>Savings Goal</Card.Title>
              {savingsGoal ? (
                <>
                  <p className="mb-2">
                    Remaining: ₹{savingsGoal.actualRemaining?.toFixed(2)} / Goal: ₹
                    {savingsGoal.savingsGoal?.toFixed(2)}
                  </p>
                  <div
                    className={`p-2 rounded ${
                      savingsGoal.onTrack ? 'bg-success bg-opacity-25' : 'bg-warning bg-opacity-25'
                    }`}
                  >
                    {savingsGoal.feedback}
                  </div>
                </>
              ) : (
                <p className="text-muted">No savings goal set</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default Analytics;
