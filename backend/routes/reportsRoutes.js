const express = require('express');
const PDFDocument = require('pdfkit');
const { all } = require('../db');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const text = String(val).replace(/"/g, '""');
    return /[",\n]/.test(text) ? `"${text}"` : text;
  };
  const lines = [headers.join(',')];
  rows.forEach((row) => {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  });
  return lines.join('\n');
}

router.get('/payments.csv', roleCheck(['accounts']), async (req, res) => {
  try {
    const rows = await all(
      `SELECT p.id, m.name AS member_name, p.amount, p.paid_on, p.reconciled, u.name AS recorded_by
       FROM payments p
       JOIN members m ON p.member_id = m.id
       JOIN users u ON p.recorded_by = u.id
       ORDER BY p.id DESC`
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="payments_report.csv"');
    return res.send(toCsv(rows));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate payments CSV', error: error.message });
  }
});

router.get('/recoveries.csv', roleCheck(['accounts']), async (req, res) => {
  try {
    const rows = await all(
      `SELECT m.id, m.name, s.name AS society_name, m.due_amount, m.status, m.due_since
       FROM members m
       JOIN societies s ON m.society_id = s.id
       WHERE m.status = 'recovered'
       ORDER BY m.id DESC`
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="recovery_report.csv"');
    return res.send(toCsv(rows));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate recovery CSV', error: error.message });
  }
});

router.get('/recoveries.pdf', roleCheck(['accounts']), async (req, res) => {
  try {
    const rows = await all(
      `SELECT m.name, s.name AS society_name, m.due_amount, m.due_since
       FROM members m
       JOIN societies s ON m.society_id = s.id
       WHERE m.status = 'recovered'
       ORDER BY m.id DESC`
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="recovery_report.pdf"');

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(18).text('FinioRevive Recovery Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(11).text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();

    rows.forEach((row, idx) => {
      doc.text(`${idx + 1}. ${row.name} | ${row.society_name} | Due: ${row.due_amount} | Since: ${row.due_since || '-'}`);
    });

    if (!rows.length) {
      doc.text('No recovered members found.');
    }

    doc.end();
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate recovery PDF', error: error.message });
  }
});

module.exports = router;
