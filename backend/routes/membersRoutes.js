const express = require('express');
const { all, get, run, logAudit } = require('../db');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

function buildRoleScope(req, where = [], params = []) {
  if (req.user.role === 'bdm') {
    where.push('s.bdm_id = ?');
    params.push(req.user.id);
  }
  if (req.user.role === 'agent') {
    where.push('m.assigned_agent_id = ?');
    params.push(req.user.id);
  }
  if (req.user.role === 'telecaller') {
    where.push('m.assigned_telecaller_id = ?');
    params.push(req.user.id);
  }
  return { where, params };
}

router.get('/', roleCheck(['super_admin', 'bdm', 'agent', 'telecaller', 'legal', 'accounts']), async (req, res) => {
  try {
    const { status, society_id, search } = req.query;
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
    const offset = (page - 1) * limit;
    const where = [];
    const params = [];

    buildRoleScope(req, where, params);

    if (status) {
      where.push('m.status = ?');
      params.push(status);
    }

    if (society_id) {
      where.push('m.society_id = ?');
      params.push(society_id);
    }

    if (search) {
      where.push('(m.name LIKE ? OR m.phone LIKE ? OR m.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countRow = await get(
      `SELECT COUNT(*) AS total
       FROM members m
       JOIN societies s ON m.society_id = s.id
       ${whereClause}`,
      params
    );

    const sql = `
      SELECT
        m.*,
        s.name AS society_name,
        agent.name AS agent_name,
        tele.name AS telecaller_name
      FROM members m
      JOIN societies s ON m.society_id = s.id
      LEFT JOIN users agent ON m.assigned_agent_id = agent.id
      LEFT JOIN users tele ON m.assigned_telecaller_id = tele.id
      ${whereClause}
      ORDER BY m.id DESC
      LIMIT ? OFFSET ?
    `;

    const members = await all(sql, [...params, limit, offset]);
    res.setHeader('X-Total-Count', String(countRow?.total || 0));
    res.setHeader('X-Page', String(page));
    res.setHeader('X-Limit', String(limit));
    return res.json(members);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch members', error: error.message });
  }
});

router.get('/:id/details', roleCheck(['super_admin', 'bdm', 'agent', 'telecaller', 'legal', 'accounts']), async (req, res) => {
  try {
    const { id } = req.params;

    const where = ['m.id = ?'];
    const params = [id];
    buildRoleScope(req, where, params);

    const member = await get(
      `SELECT
        m.*,
        s.name AS society_name,
        agent.name AS agent_name,
        tele.name AS telecaller_name
       FROM members m
       JOIN societies s ON m.society_id = s.id
       LEFT JOIN users agent ON m.assigned_agent_id = agent.id
       LEFT JOIN users tele ON m.assigned_telecaller_id = tele.id
       WHERE ${where.join(' AND ')}`,
      params
    );

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const calls = await all(
      `SELECT c.*, u.name AS telecaller_name
       FROM calls c
       JOIN users u ON u.id = c.telecaller_id
       WHERE c.member_id = ?
       ORDER BY c.id DESC`,
      [id]
    );

    const notices = await all(
      `SELECT n.*, u.name AS generated_by_name
       FROM notices n
       JOIN users u ON u.id = n.generated_by
       WHERE n.member_id = ?
       ORDER BY n.id DESC`,
      [id]
    );

    const payments = await all(
      `SELECT p.*, u.name AS recorded_by_name
       FROM payments p
       JOIN users u ON u.id = p.recorded_by
       WHERE p.member_id = ?
       ORDER BY p.id DESC`,
      [id]
    );

    return res.json({ member, calls, notices, payments });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch member details', error: error.message });
  }
});

router.post('/', roleCheck(['super_admin', 'bdm']), async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      society_id,
      due_amount,
      due_since,
      status,
      assigned_agent_id,
      assigned_telecaller_id,
    } = req.body;

    if (!name || !society_id) {
      return res.status(400).json({ message: 'name and society_id are required' });
    }

    if (req.user.role === 'bdm') {
      const allowedSociety = await get('SELECT id FROM societies WHERE id = ? AND bdm_id = ?', [society_id, req.user.id]);
      if (!allowedSociety) {
        return res.status(403).json({ message: 'You can only add members to your assigned societies' });
      }
    }

    const result = await run(
      `INSERT INTO members
      (name, phone, email, society_id, due_amount, due_since, status, assigned_agent_id, assigned_telecaller_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        phone || null,
        email || null,
        society_id,
        Number(due_amount || 0),
        due_since || null,
        status || 'pending',
        assigned_agent_id || null,
        assigned_telecaller_id || null,
      ]
    );

    await logAudit(req.user.id, 'CREATE_MEMBER', 'members', result.id);
    return res.status(201).json({ id: result.id });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create member', error: error.message });
  }
});

router.put('/:id', roleCheck(['super_admin', 'bdm', 'agent']), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await get('SELECT * FROM members WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ message: 'Member not found' });
    }

    if (req.user.role === 'agent') {
      if (existing.assigned_agent_id !== req.user.id) {
        return res.status(403).json({ message: 'You can only update your assigned members' });
      }
      const nextStatus = req.body.status;
      if (nextStatus !== 'recovered') {
        return res.status(400).json({ message: 'Agents can only update status to recovered' });
      }
      await run('UPDATE members SET status = ? WHERE id = ?', ['recovered', id]);
    } else {
      const {
        name,
        phone,
        email,
        society_id,
        due_amount,
        due_since,
        status,
        assigned_agent_id,
        assigned_telecaller_id,
      } = req.body;

      if (req.user.role === 'bdm') {
        const allowedSociety = await get('SELECT id FROM societies WHERE id = ? AND bdm_id = ?', [existing.society_id, req.user.id]);
        if (!allowedSociety) {
          return res.status(403).json({ message: 'You can only update members in your assigned societies' });
        }
      }

      await run(
        `UPDATE members
         SET name = ?, phone = ?, email = ?, society_id = ?, due_amount = ?, due_since = ?, status = ?, assigned_agent_id = ?, assigned_telecaller_id = ?
         WHERE id = ?`,
        [
          name ?? existing.name,
          phone ?? existing.phone,
          email ?? existing.email,
          society_id ?? existing.society_id,
          due_amount ?? existing.due_amount,
          due_since ?? existing.due_since,
          status ?? existing.status,
          assigned_agent_id ?? existing.assigned_agent_id,
          assigned_telecaller_id ?? existing.assigned_telecaller_id,
          id,
        ]
      );
    }

    await logAudit(req.user.id, 'UPDATE_MEMBER', 'members', id);
    return res.json({ message: 'Member updated' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update member', error: error.message });
  }
});

router.delete('/:id', roleCheck(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await run('DELETE FROM members WHERE id = ?', [id]);
    if (!result.changes) {
      return res.status(404).json({ message: 'Member not found' });
    }
    await logAudit(req.user.id, 'DELETE_MEMBER', 'members', id);
    return res.json({ message: 'Member deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete member', error: error.message });
  }
});

module.exports = router;
