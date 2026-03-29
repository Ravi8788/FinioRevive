const express = require('express');
const { all, get, run, logAudit } = require('../db');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

router.get('/', roleCheck(['super_admin', 'bdm', 'agent', 'telecaller', 'legal', 'accounts']), async (req, res) => {
  try {
    let query = `
      SELECT s.*, u.name AS bdm_name
      FROM societies s
      LEFT JOIN users u ON s.bdm_id = u.id
    `;
    const params = [];

    if (req.user.role === 'bdm') {
      query += ' WHERE s.bdm_id = ?';
      params.push(req.user.id);
    }

    query += ' ORDER BY s.id DESC';
    const societies = await all(query, params);
    return res.json(societies);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch societies', error: error.message });
  }
});

router.post('/', roleCheck(['super_admin', 'bdm']), async (req, res) => {
  try {
    const { name, address, bdm_id } = req.body;
    if (!String(name || '').trim()) {
      return res.status(400).json({ message: 'Society name is required' });
    }

    let assignedBdm = req.user.role === 'bdm' ? req.user.id : (bdm_id || null);
    if (assignedBdm !== null) {
      assignedBdm = Number(assignedBdm);
      if (Number.isNaN(assignedBdm)) {
        return res.status(400).json({ message: 'bdm_id must be a valid number or empty' });
      }
      const bdm = await get('SELECT id FROM users WHERE id = ? AND role = ?', [assignedBdm, 'bdm']);
      if (!bdm) {
        return res.status(400).json({ message: 'Assigned BDM not found' });
      }
    }

    const result = await run('INSERT INTO societies (name, address, bdm_id) VALUES (?, ?, ?)', [
      String(name).trim(),
      address || null,
      assignedBdm,
    ]);

    await logAudit(req.user.id, 'CREATE_SOCIETY', 'societies', result.id);
    return res.status(201).json({ id: result.id, name, address, bdm_id: assignedBdm });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create society', error: error.message });
  }
});

router.put('/:id', roleCheck(['super_admin', 'bdm']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, bdm_id } = req.body;
    if (!String(name || '').trim()) {
      return res.status(400).json({ message: 'Society name is required' });
    }

    if (req.user.role === 'bdm') {
      const result = await run(
        'UPDATE societies SET name = ?, address = ?, bdm_id = ? WHERE id = ? AND bdm_id = ?',
        [String(name).trim(), address || null, req.user.id, id, req.user.id]
      );
      if (!result.changes) {
        return res.status(404).json({ message: 'Society not found or not assigned to this BDM' });
      }
    } else {
      let nextBdmId = bdm_id || null;
      if (nextBdmId !== null) {
        nextBdmId = Number(nextBdmId);
        if (Number.isNaN(nextBdmId)) {
          return res.status(400).json({ message: 'bdm_id must be a valid number or empty' });
        }
        const bdm = await get('SELECT id FROM users WHERE id = ? AND role = ?', [nextBdmId, 'bdm']);
        if (!bdm) {
          return res.status(400).json({ message: 'Assigned BDM not found' });
        }
      }

      const result = await run('UPDATE societies SET name = ?, address = ?, bdm_id = ? WHERE id = ?', [
        String(name).trim(),
        address || null,
        nextBdmId,
        id,
      ]);
      if (!result.changes) {
        return res.status(404).json({ message: 'Society not found' });
      }
    }

    await logAudit(req.user.id, 'UPDATE_SOCIETY', 'societies', id);
    return res.json({ message: 'Society updated' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update society', error: error.message });
  }
});

router.delete('/:id', roleCheck(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await run('DELETE FROM societies WHERE id = ?', [id]);
    if (!result.changes) {
      return res.status(404).json({ message: 'Society not found' });
    }

    await logAudit(req.user.id, 'DELETE_SOCIETY', 'societies', id);
    return res.json({ message: 'Society deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete society', error: error.message });
  }
});

module.exports = router;
