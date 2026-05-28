const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authenticate = require('./middleware/auth');
const requireRole = require('./middleware/requireRole');

const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');
const quoteRoutes = require('./routes/quotes');
const jobRoutes = require('./routes/jobs');
const scheduleRoutes = require('./routes/schedule');
const invoiceRoutes = require('./routes/invoices');
const paymentRoutes = require('./routes/payments');
const financeRoutes = require('./routes/finances');
const timesheetRoutes = require('./routes/timesheet');
const inventoryRoutes = require('./routes/inventory');

const app = express();

app.use(cors());
app.use(bodyParser.json());

const leadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many submissions, please try again later.' },
});

app.use('/api', authRoutes);

// Public lead creation stays open (leads router handles its own auth for GET/PUT/DELETE)
app.use('/api/leads', leadRoutes(leadLimiter));

// CRM endpoints — admin only (managers and payroll users should NOT see customer data)
const adminOnly = [authenticate, requireRole('admin')];
app.use('/api/quotes', adminOnly, quoteRoutes);
app.use('/api/jobs', adminOnly, jobRoutes);
app.use('/api/schedule', adminOnly, scheduleRoutes);
app.use('/api/invoices', adminOnly, invoiceRoutes);
app.use('/api/payments', adminOnly, paymentRoutes);
app.use('/api/finances', adminOnly, financeRoutes);

// Timesheet routes handle their own per-endpoint role checks internally.
app.use('/api/timesheet', authenticate, timesheetRoutes);
app.use('/api/inventory', authenticate, inventoryRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4242;
// Bind to loopback only — Nginx is the public face. Defense-in-depth:
// even if the AWS security group ever opens this port, Express won't answer it.
app.listen(PORT, '127.0.0.1', () => console.log(`CRM API running on 127.0.0.1:${PORT}`));
