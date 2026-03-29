const express = require('express');
const { all, get, run, logAudit } = require('../db');
const roleCheck = require('../middleware/roleCheck');
const { validateBody } = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', roleCheck(['super_admin', 'telecaller']), async (req, res) => {
  try {
    let sql = `SELECT c.*, m.name AS member_name, u.name AS telecaller_name
       FROM calls c
       JOIN members m ON c.member_id = m.id
       JOIN users u ON c.telecaller_id = u.id`;
    const params = [];

    if (req.user.role === 'telecaller') {
      sql += ' WHERE c.telecaller_id = ?';
      params.push(req.user.id);
    }

    sql += ' ORDER BY c.id DESC';

    const rows = await all(sql, params);

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch calls', error: error.message });
  }
});

router.post('/', roleCheck(['telecaller']), validateBody([
  { field: 'member_id', required: true, type: 'number' },
  { field: 'outcome', required: true, enum: ['paid', 'callback', 'promise_to_pay', 'not_reachable', 'escalated'] },
]), async (req, res) => {
  try {
    const { member_id, outcome, notes } = req.body;
    if (!member_id || !outcome) {
      return res.status(400).json({ message: 'member_id and outcome are required' });
    }

    const member = await get('SELECT * FROM members WHERE id = ?', [member_id]);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    if (Number(member.assigned_telecaller_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'Forbidden: member is not assigned to this telecaller' });
    }

    const result = await run(
      'INSERT INTO calls (member_id, telecaller_id, outcome, notes) VALUES (?, ?, ?, ?)',
      [member_id, req.user.id, outcome, notes || null]
    );

    if (outcome === 'paid') {
      await run('UPDATE members SET status = ? WHERE id = ?', ['recovered', member_id]);
    }

    if (outcome === 'escalated') {
      await run('UPDATE members SET status = ? WHERE id = ?', ['escalated', member_id]);
    }

    await logAudit(req.user.id, 'LOG_CALL', 'calls', result.id);
    return res.status(201).json({ id: result.id });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to log call', error: error.message });
  }
});

module.exports = router;
