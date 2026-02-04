import { useState, useEffect } from 'react';
import { Card, Form, Button, Table, Row, Col, Spinner, Modal } from 'react-bootstrap';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Expenses = () => {
  const { user } = useAuth();
  const categories = user?.categoryBudgets?.map((cb) => cb.category) || [
    'Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Others',
  ];
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    amount: '',
    category: categories[0] || 'Food',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(null);

  const fetchExpenses = async () => {
    try {
      const res = await api.get('/expenses');
      setExpenses(res.data);
    } catch (err) {
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/expenses', {
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
      });
      setFormData({ amount: '', category: categories[0] || 'Food', description: '' });
      fetchExpenses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      fetchExpenses();
      setShowDelete(null);
    } catch (err) {
      setError('Failed to delete expense');
    }
  };

  return (
    <>
      <h2 className="mb-4">Expenses</h2>

      <Row>
        <Col lg={5} className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Add Expense</Card.Title>
              {error && <div className="text-danger small mb-2">{error}</div>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Amount</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="Others">Others</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional"
                  />
                </Form.Group>
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Expense'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={7}>
          <Card>
            <Card.Body>
              <Card.Title>Recent Transactions</Card.Title>
              {loading ? (
                <div className="text-center py-4">
                  <Spinner animation="border" />
                </div>
              ) : expenses.length === 0 ? (
                <p className="text-muted mb-0">No expenses yet. Add your first expense above.</p>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((ex) => (
                      <tr key={ex._id} className="expense-item">
                        <td>{new Date(ex.date).toLocaleString()}</td>
                        <td>{ex.category}</td>
                        <td>{ex.description || '-'}</td>
                        <td>₹{Number(ex.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td>
                          <Button
                            variant="link"
                            size="sm"
                            className="text-danger p-0"
                            onClick={() => setShowDelete(ex._id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={!!showDelete} onHide={() => setShowDelete(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete Expense</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this expense?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => handleDelete(showDelete)}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Expenses;
