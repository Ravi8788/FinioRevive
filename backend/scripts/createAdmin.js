const bcrypt = require('bcryptjs');
const { initDb, get, run } = require('../db');

function getArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index === process.argv.length - 1) return '';
  return process.argv[index + 1];
}

async function main() {
  await initDb();

  const name = getArg('--name');
  const email = getArg('--email');
  const password = getArg('--password');

  if (!name || !email || !password) {
    console.error('Usage: npm run create-admin -- --name "Admin Name" --email admin@example.com --password "StrongPassword"');
    process.exit(1);
  }

  if (password.length < 6) {
    console.error('Password must be at least 6 characters.');
    process.exit(1);
  }

  const existing = await get('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    console.error('A user with this email already exists.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  const result = await run(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, hash, 'super_admin']
  );

  console.log(`Super admin created with id ${result.id}.`);
}

main().catch((error) => {
  console.error('Failed to create admin:', error.message);
  process.exit(1);
});
