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
const payrollRoutes = require('./routes/payroll');
const documentRoutes = require('./routes/documents');
const signRoutes = require('./routes/sign');
const { ensureStorageDir } = require('./util/documentStorage');

const app = express();

// Nginx is the single trusted hop in front; trust the first X-Forwarded-For
// entry so req.ip is the real client IP and express-rate-limit v8+ doesn't
// throw ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
app.set('trust proxy', 1);

app.disable('x-powered-by');

// The API is same-origin behind nginx (/api on the site domain), so browsers
// never need cross-origin access. Lock CORS to our own origins instead of the
// previous wildcard — cross-site pages can no longer read API responses.
app.use(cors({
  origin: ['https://www.nextlevelepoxynm.com', 'https://nextlevelepoxynm.com'],
}));
app.use(bodyParser.json());

// Lead submissions are public + expensive (DB write + 2 outbound Resend emails).
// Real humans fill at most one form per minute; bots try to fan out across
// the 3 form sources. Cap at 2/IP/min — covers real users with margin, halves
// the bot ceiling. Pairs with per-email cooldown in routes/leads.js.
const leadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 2,
  message: { error: 'Too many submissions, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
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
app.use('/api/payroll', authenticate, payrollRoutes);
app.use('/api/documents', authenticate, documentRoutes);
app.use('/api/sign', signRoutes); // PUBLIC: no auth, rate-limited inside the router

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4242;
// Bind to loopback only — Nginx is the public face. Defense-in-depth:
// even if the AWS security group ever opens this port, Express won't answer it.
ensureStorageDir(); // Fail fast on boot if /var/lib/nextlevel is missing.
app.listen(PORT, '127.0.0.1', () => console.log(`CRM API running on 127.0.0.1:${PORT}`));
