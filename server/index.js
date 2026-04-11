const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authenticate = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');
const quoteRoutes = require('./routes/quotes');
const jobRoutes = require('./routes/jobs');
const scheduleRoutes = require('./routes/schedule');
const invoiceRoutes = require('./routes/invoices');
const paymentRoutes = require('./routes/payments');
const financeRoutes = require('./routes/finances');
const timesheetRoutes = require('./routes/timesheet');

const app = express();

app.use(cors());
app.use(bodyParser.json());

const leadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many submissions, please try again later.' },
});

app.use('/api', authRoutes);
app.use('/api/leads', leadRoutes(leadLimiter));
app.use('/api/quotes', authenticate, quoteRoutes);
app.use('/api/jobs', authenticate, jobRoutes);
app.use('/api/schedule', authenticate, scheduleRoutes);
app.use('/api/invoices', authenticate, invoiceRoutes);
app.use('/api/payments', authenticate, paymentRoutes);
app.use('/api/finances', authenticate, financeRoutes);
app.use('/api/timesheet', authenticate, timesheetRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`CRM API running on port ${PORT}`));
