const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const { initDb } = require('./db');
const auth = require('./middleware/auth');

const authRoutes = require('./routes/authRoutes');
const usersRoutes = require('./routes/usersRoutes');
const societiesRoutes = require('./routes/societiesRoutes');
const membersRoutes = require('./routes/membersRoutes');
const callsRoutes = require('./routes/callsRoutes');
const noticesRoutes = require('./routes/noticesRoutes');
const paymentsRoutes = require('./routes/paymentsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportsRoutes = require('./routes/reportsRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const frontendOrigin = process.env.FRONTEND_URL || '';

const allowedOrigins = frontendOrigin
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (!allowedOrigins.length || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS origin not allowed'));
  },
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/pdf', express.static(path.join(__dirname, 'pdf')));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'FinioRevive' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', auth, usersRoutes);
app.use('/api/societies', auth, societiesRoutes);
app.use('/api/members', auth, membersRoutes);
app.use('/api/calls', auth, callsRoutes);
app.use('/api/notices', auth, noticesRoutes);
app.use('/api/payments', auth, paymentsRoutes);
app.use('/api/dashboard', auth, dashboardRoutes);
app.use('/api/reports', auth, reportsRoutes);

app.use((err, req, res, next) => {
  return res.status(500).json({ message: 'Unexpected server error', error: err.message });
});

async function startServer() {
  await initDb();
  return app.listen(PORT, () => {
    console.log(`FinioRevive backend running on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
}

module.exports = {
  app,
  startServer,
};
