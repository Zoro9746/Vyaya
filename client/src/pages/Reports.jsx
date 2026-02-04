import { useState, useEffect } from 'react';
import { Card, Button, Spinner, Form, Row, Col } from 'react-bootstrap';
import api from '../utils/api';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/data', { params: { month, year } });
      setReportData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [month, year]);

  const downloadExcel = async () => {
    try {
      const res = await api.get('/reports/excel', { params: { month, year } });
      const data = res.data.summary;
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      XLSX.writeFile(wb, `Vyaya_Report_${month}_${year}.xlsx`);
    } catch (err) {
      console.error(err);
    }
  };

  const downloadPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();
    const period = `${monthNames[month - 1]} ${year}`;

    doc.setFontSize(18);
    doc.text('Vyaya Expense Report', 14, 20);
    doc.setFontSize(12);
    doc.text(`Period: ${period}`, 14, 28);
    doc.text(`User: ${reportData.user?.name}`, 14, 35);

    doc.setFontSize(14);
    doc.text('Summary', 14, 48);
    doc.setFontSize(10);
    const summary = [
      ['Monthly Income', `Rs ${reportData.summary?.monthlyIncome || 0}`],
      ['Planned Spending', `Rs ${reportData.summary?.plannedSpending || 0}`],
      ['Total Expenses', `Rs ${reportData.summary?.totalExpenses || 0}`],
      ['Savings', `Rs ${reportData.summary?.savings || 0}`],
      ['Remaining', `Rs ${reportData.summary?.remaining || 0}`],
    ];
    doc.autoTable({
      startY: 52,
      head: [['Item', 'Amount']],
      body: summary,
    });

    let finalY = doc.lastAutoTable.finalY || 52;
    doc.setFontSize(14);
    doc.text('Category Breakdown', 14, finalY + 12);
    doc.setFontSize(10);
    const catBody = (reportData.categoryBreakdown || []).map((c) => [
      c._id,
      `Rs ${c.total}`,
    ]);
    doc.autoTable({
      startY: finalY + 16,
      head: [['Category', 'Amount']],
      body: catBody.length ? catBody : [['No data', '-']],
    });

    finalY = doc.lastAutoTable.finalY || finalY;
    doc.setFontSize(14);
    doc.text('Recent Transactions', 14, finalY + 12);
    doc.setFontSize(10);
    const txBody = (reportData.transactions || []).slice(0, 20).map((t) => [
      new Date(t.date).toLocaleDateString(),
      t.category,
      `Rs ${t.amount}`,
      (t.description || '').substring(0, 30),
    ]);
    doc.autoTable({
      startY: finalY + 16,
      head: [['Date', 'Category', 'Amount', 'Description']],
      body: txBody.length ? txBody : [['No transactions', '-', '-', '-']],
    });

    doc.save(`Vyaya_Report_${period.replace(' ', '_')}.pdf`);
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <>
      <h2 className="mb-4">Reports</h2>

      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-end g-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Month</Form.Label>
                <Form.Select value={month} onChange={(e) => setMonth(parseInt(e.target.value, 10))}>
                  {monthNames.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Year</Form.Label>
                <Form.Select value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))}>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6} className="d-flex gap-2">
              <Button variant="primary" onClick={downloadPDF} disabled={loading}>
                Download PDF
              </Button>
              <Button variant="success" onClick={downloadExcel} disabled={loading}>
                Download Excel
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" />
        </div>
      ) : reportData ? (
        <Card>
          <Card.Body>
            <h5>
              {monthNames[month - 1]} {year} - Summary
            </h5>
            <ul className="mb-0">
              <li>Monthly Income: Rs {reportData.summary?.monthlyIncome?.toFixed(2)}</li>
              <li>Planned Spending: Rs {reportData.summary?.plannedSpending?.toFixed(2)}</li>
              <li>Total Expenses: Rs {reportData.summary?.totalExpenses?.toFixed(2)}</li>
              <li>Savings: Rs {reportData.summary?.savings?.toFixed(2)}</li>
              <li>Remaining: Rs {reportData.summary?.remaining?.toFixed(2)}</li>
            </ul>
          </Card.Body>
        </Card>
      ) : null}
    </>
  );
};

export default Reports;
