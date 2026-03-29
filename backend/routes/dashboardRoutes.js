const express = require('express');
const { get, all } = require('../db');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.get('/', roleCheck(['super_admin']), async (req, res) => {
  try {
    const totals = await get(
      `SELECT
        COALESCE(SUM(m.due_amount), 0) AS total_outstanding_amount,
        COALESCE(SUM(CASE WHEN m.status = 'recovered' THEN m.due_amount ELSE 0 END), 0) AS total_recovered_amount,
        COALESCE(SUM(CASE WHEN m.status = 'pending' THEN 1 ELSE 0 END), 0) AS pending_cases_count,
        COALESCE(SUM(CASE WHEN m.status = 'escalated' THEN 1 ELSE 0 END), 0) AS escalated_cases_count
       FROM members m`
    );

    const societyWise = await all(
      `SELECT
        s.id,
        s.name,
        COALESCE(SUM(m.due_amount), 0) AS due_amount,
        COALESCE(SUM(CASE WHEN m.status = 'recovered' THEN m.due_amount ELSE 0 END), 0) AS recovered_amount
       FROM societies s
       LEFT JOIN members m ON m.society_id = s.id
       GROUP BY s.id, s.name
       ORDER BY s.name ASC`
    );

    const recentActivity = await all(
      `SELECT
        a.id,
        a.action,
        a.target_table,
        a.target_id,
        a.created_at,
        u.name AS user_name,
        u.role AS user_role
       FROM audit_logs a
       JOIN users u ON u.id = a.user_id
       ORDER BY a.id DESC
       LIMIT 10`
    );

    return res.json({
      total_outstanding_amount: Number(totals?.total_outstanding_amount || 0),
      total_recovered_amount: Number(totals?.total_recovered_amount || 0),
      pending_cases_count: Number(totals?.pending_cases_count || 0),
      escalated_cases_count: Number(totals?.escalated_cases_count || 0),
      society_wise: societyWise,
      recent_activity: recentActivity,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch dashboard', error: error.message });
  }
});

router.get('/stats', roleCheck(['super_admin', 'bdm', 'agent', 'telecaller', 'legal', 'accounts']), async (req, res) => {
  try {
    let scopeClause = '';
    const params = [];

    if (req.user.role === 'bdm') {
      scopeClause = 'WHERE s.bdm_id = ?';
      params.push(req.user.id);
    }

    if (req.user.role === 'agent') {
      scopeClause = 'WHERE m.assigned_agent_id = ?';
      params.push(req.user.id);
    }

    if (req.user.role === 'telecaller') {
      scopeClause = 'WHERE m.assigned_telecaller_id = ?';
      params.push(req.user.id);
    }

    const totals = await get(
      `SELECT
        COALESCE(SUM(m.due_amount), 0) AS total_due,
        COALESCE(SUM(CASE WHEN m.status = 'recovered' THEN m.due_amount ELSE 0 END), 0) AS recovered_due,
        SUM(CASE WHEN m.status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN m.status = 'escalated' THEN 1 ELSE 0 END) AS escalated_count,
        SUM(CASE WHEN m.status = 'legal' THEN 1 ELSE 0 END) AS legal_count,
        SUM(CASE WHEN m.status = 'recovered' THEN 1 ELSE 0 END) AS recovered_count
      FROM members m
      JOIN societies s ON m.society_id = s.id
      ${scopeClause}`,
      params
    );

    return res.json(totals || {});
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch dashboard stats', error: error.message });
  }
});

module.exports = router;
