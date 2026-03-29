const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const request = require('supertest');

const testDbPath = path.join(__dirname, `finio.test.${process.pid}.db`);
process.env.DB_PATH = testDbPath;

const { app } = require('../server');
const { initDb, run } = require('../db');

async function login(email, password = 'testpass123') {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  assert.equal(res.status, 200);
  return res.body.token;
}

test.before(async () => {
  await initDb();

  await run('DELETE FROM audit_logs');
  await run('DELETE FROM payments');
  await run('DELETE FROM notices');
  await run('DELETE FROM calls');
  await run('DELETE FROM members');
  await run('DELETE FROM societies');
  await run('DELETE FROM users');

  const hash = await bcrypt.hash('testpass123', 10);

  const superAdmin = await run(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    ['Super Admin', 'super.admin.test@finio.com', hash, 'super_admin']
  );
  const bdm = await run(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    ['BDM User', 'bdm.test@finio.com', hash, 'bdm']
  );
  const agent = await run(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    ['Agent User', 'agent.test@finio.com', hash, 'agent']
  );
  const telecaller = await run(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    ['Telecaller User', 'telecaller.test@finio.com', hash, 'telecaller']
  );
  const legal = await run(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    ['Legal User', 'legal.test@finio.com', hash, 'legal']
  );
  const accounts = await run(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    ['Accounts User', 'accounts.test@finio.com', hash, 'accounts']
  );

  const society = await run(
    'INSERT INTO societies (name, address, bdm_id) VALUES (?, ?, ?)',
    ['Test Society', 'Test Address', bdm.id]
  );

  await run(
    `INSERT INTO members
      (name, phone, email, society_id, due_amount, due_since, status, assigned_agent_id, assigned_telecaller_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'Test Member',
      '9999999999',
      'member.test@finio.com',
      society.id,
      5000,
      '2026-01-01',
      'pending',
      agent.id,
      telecaller.id,
    ]
  );

  await run(
    'INSERT INTO audit_logs (user_id, action, target_table, target_id) VALUES (?, ?, ?, ?)',
    [superAdmin.id, 'TEST_SETUP', 'users', accounts.id]
  );
  await run(
    'INSERT INTO audit_logs (user_id, action, target_table, target_id) VALUES (?, ?, ?, ?)',
    [legal.id, 'TEST_SETUP', 'members', 1]
  );
});

test('telecaller can only access own calls endpoint', async () => {
  const token = await login('telecaller.test@finio.com');
  const res = await request(app).get('/api/calls').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
});

test('agent cannot access calls endpoint', async () => {
  const token = await login('agent.test@finio.com');
  const res = await request(app).get('/api/calls').set('Authorization', `Bearer ${token}`);
  assert.equal(res.status, 403);
});

test('accounts can reconcile payments', async () => {
  const token = await login('accounts.test@finio.com');

  const membersRes = await request(app)
    .get('/api/members')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(membersRes.status, 200);
  assert.ok(membersRes.body.length > 0);

  const create = await request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${token}`)
    .send({ member_id: membersRes.body[0].id, amount: 999, paid_on: '2026-03-30' });
  assert.equal(create.status, 201);

  const list = await request(app).get('/api/payments').set('Authorization', `Bearer ${token}`);
  assert.equal(list.status, 200);
  assert.ok(Array.isArray(list.body));

  const pending = list.body.find((p) => !p.reconciled && Number(p.amount) === 999);
  assert.ok(pending);

  const reconcile = await request(app)
    .put(`/api/payments/${pending.id}/reconcile`)
    .set('Authorization', `Bearer ${token}`);
  assert.equal(reconcile.status, 200);
});

test('agent can record payment for assigned member', async () => {
  const token = await login('agent.test@finio.com');

  const membersRes = await request(app)
    .get('/api/members')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(membersRes.status, 200);
  assert.ok(membersRes.body.length > 0);

  const member = membersRes.body[0];

  const record = await request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${token}`)
    .send({ member_id: member.id, amount: 1234, paid_on: '2026-03-30' });

  assert.equal(record.status, 201);
});
