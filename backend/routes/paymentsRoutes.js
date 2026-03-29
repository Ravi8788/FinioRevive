const express = require('express');
const { all, get, run, logAudit } = require('../db');
const roleCheck = require('../middleware/roleCheck');
const { validateBody } = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', roleCheck(['super_admin', 'accounts']), async (req, res) => {
  try {
    const rows = await all(
      `SELECT p.*, m.name AS member_name, u.name AS recorded_by_name
       FROM payments p
       JOIN members m ON p.member_id = m.id
       JOIN users u ON p.recorded_by = u.id
       ORDER BY p.id DESC`,
      []
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch payments', error: error.message });
  }
});

router.post('/', roleCheck(['super_admin', 'accounts', 'agent']), validateBody([
  { field: 'member_id', required: true, type: 'number' },
  { field: 'amount', required: true, type: 'number' },
  { field: 'paid_on', required: true, type: 'string' },
]), async (req, res) => {
  try {
    const { member_id, amount, paid_on } = req.body;
    if (!member_id || !amount || !paid_on) {
      return res.status(400).json({ message: 'member_id, amount, and paid_on are required' });
    }

    const member = await get('SELECT * FROM members WHERE id = ?', [member_id]);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    if (req.user.role === 'agent' && Number(member.assigned_agent_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden: member is not assigned to this agent' });
    }

    const result = await run(
      'INSERT INTO payments (member_id, amount, paid_on, recorded_by, reconciled) VALUES (?, ?, ?, ?, ?)',
      [member_id, Number(amount), paid_on, req.user.id, 0]
    );

    await run('UPDATE members SET status = ? WHERE id = ?', ['recovered', member_id]);

    await logAudit(req.user.id, 'RECORD_PAYMENT', 'payments', result.id);
    return res.status(201).json({ message: 'Payment recorded successfully', id: result.id });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to record payment', error: error.message });
  }
});

router.put('/:id/reconcile', roleCheck(['super_admin', 'accounts']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await run('UPDATE payments SET reconciled = 1 WHERE id = ?', [id]);
    if (!result.changes) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    await logAudit(req.user.id, 'RECONCILE_PAYMENT', 'payments', id);
    return res.json({ message: 'Payment reconciled successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to reconcile payment', error: error.message });
  }
});

module.exports = router;
