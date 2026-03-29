const express = require('express');
const bcrypt = require('bcryptjs');
const { all, get, run, logAudit } = require('../db');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();
const allowedCreateRoles = ['bdm', 'agent', 'telecaller', 'legal', 'accounts'];

router.get('/', roleCheck(['super_admin', 'bdm']), async (req, res) => {
  try {
    if (req.user.role === 'bdm') {
      const users = await all(
        "SELECT id, name, role FROM users WHERE role IN ('agent', 'telecaller') ORDER BY id DESC"
      );
      return res.json(users);
    }

    const users = await all('SELECT id, name, email, role, created_at FROM users ORDER BY id DESC');
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

router.post('/', roleCheck(['super_admin']), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'name, email, password, and role are required' });
    }
    if (!allowedCreateRoles.includes(role)) {
      return res.status(400).json({ message: 'role must be one of bdm, agent, telecaller, legal, accounts' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await get('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing) {
      return res.status(409).json({ message: 'Email is already in use' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await run(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, normalizedEmail, hashed, role]
    );

    await logAudit(req.user.id, 'CREATE_USER', 'users', result.id);
    return res.status(201).json({ id: result.id, name, email: normalizedEmail, role });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
});

router.put('/:id', roleCheck(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ message: 'name, email, and role are required' });
    }
    if (!allowedCreateRoles.includes(role)) {
      return res.status(400).json({ message: 'role must be one of bdm, agent, telecaller, legal, accounts' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const emailOwner = await get('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (emailOwner && Number(emailOwner.id) !== Number(id)) {
      return res.status(409).json({ message: 'Email is already in use' });
    }

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      const result = await run(
        'UPDATE users SET name = ?, email = ?, role = ?, password = ? WHERE id = ?',
        [name, normalizedEmail, role, hashed, id]
      );
      if (!result.changes) {
        return res.status(404).json({ message: 'User not found' });
      }
    } else {
      const result = await run('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?', [name, normalizedEmail, role, id]);
      if (!result.changes) {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    await logAudit(req.user.id, 'UPDATE_USER', 'users', id);
    return res.json({ message: 'User updated' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
});

router.delete('/:id', roleCheck(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    if (Number(id) === Number(req.user.id)) {
      return res.status(400).json({ message: 'You cannot delete yourself' });
    }

    const result = await run('DELETE FROM users WHERE id = ?', [id]);
    if (!result.changes) {
      return res.status(404).json({ message: 'User not found' });
    }

    await logAudit(req.user.id, 'DELETE_USER', 'users', id);
    return res.json({ message: 'User deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});

module.exports = router;
