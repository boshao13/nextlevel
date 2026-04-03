# NextLevel CRM Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full lead-to-payment CRM integrated into the existing NextLevel Epoxy Flooring React + Express app, deployed on EC2.

**Architecture:** Express API in `server/` directory with MySQL, JWT auth, and route modules. React admin UI under `src/admin/` with its own layout (sidebar + header). Public forms dual-send to EmailJS + API. PDF generation with pdfkit.

**Tech Stack:** React 18, React Router 6, Styled Components, Express 4, MySQL2, JWT, bcrypt, pdfkit, express-rate-limit

**Spec:** `docs/superpowers/specs/2026-04-02-crm-design.md`

---

## File Structure

```
server/
  index.js                    — Express app, middleware, route mounting
  middleware/
    auth.js                   — JWT verification middleware
  routes/
    auth.js                   — POST /api/login, GET /api/me
    leads.js                  — CRUD for leads
    quotes.js                 — CRUD for quotes
    jobs.js                   — CRUD for jobs
    schedule.js               — CRUD for schedule entries
    invoices.js               — CRUD for invoices + PDF
    payments.js               — CRUD for payments
    finances.js               — summary + monthly endpoints
  services/
    pdf.js                    — pdfkit-based PDF generation for quotes & invoices
  db/
    pool.js                   — MySQL connection pool
    migrations/
      001_create_tables.sql   — All 6 tables
    migrate.js                — Migration runner script

src/admin/
  AdminLayout.jsx             — Sidebar + header + Outlet wrapper
  AdminRoute.jsx              — JWT auth guard (redirect to login if no token)
  Login.jsx                   — Admin login page
  Dashboard.jsx               — Summary cards + recent activity
  Leads.jsx                   — Lead list + detail + notes
  LeadDetail.jsx              — Single lead view with related data
  Quotes.jsx                  — Quote list
  QuoteDetail.jsx             — Quote builder with line items
  Jobs.jsx                    — Job list
  JobDetail.jsx               — Job detail with schedule
  Schedule.jsx                — Monthly calendar view
  Invoices.jsx                — Invoice list
  InvoiceDetail.jsx           — Invoice detail + record payment
  Finances.jsx                — Revenue summary + chart
  api.js                      — Axios instance with JWT interceptor
  styles.js                   — Shared admin styled components

src/App.js                    — Modified: add /admin/* routes with AdminLayout
src/Footer.jsx                — Modified: add Admin link
src/ContactForm.jsx           — Modified: dual-send to API after EmailJS
src/Commercial.jsx            — Modified: dual-send to API after EmailJS
src/Careers.jsx               — Modified: dual-send to API after Formspree
package.json                  — Modified: add pdfkit, express-rate-limit, update server script
.env.example                  — New: template for required env vars
```

---

## Chunk 1: Backend Foundation (Server, DB, Auth)

### Task 1: Install dependencies and update package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install new dependencies**

```bash
cd /Users/boshao/projects/nextlevel
npm install pdfkit express-rate-limit
```

- [ ] **Step 2: Update server script path in package.json**

Change `"server": "node src/server.js"` to `"server": "node server/index.js"` in package.json scripts.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add pdfkit and express-rate-limit, update server script path"
```

### Task 2: Create .env.example

**Files:**
- Create: `.env.example`

- [ ] **Step 1: Create the env template**

```
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=nextlevel_crm

# Auth
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$... (generate with: node -e "require('bcryptjs').hash('yourpassword',10).then(h=>console.log(h))")
JWT_SECRET=change-this-to-a-random-string
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "feat: add .env.example with required CRM env vars"
```

### Task 3: Create database migration

**Files:**
- Create: `server/db/migrations/001_create_tables.sql`
- Create: `server/db/migrate.js`
- Create: `server/db/pool.js`

- [ ] **Step 1: Create pool.js**

```javascript
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
```

- [ ] **Step 2: Create 001_create_tables.sql**

```sql
CREATE TABLE IF NOT EXISTS leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  area_desired TEXT,
  source ENUM('contact_form', 'commercial_form', 'career_form') NOT NULL DEFAULT 'contact_form',
  status ENUM('new', 'contacted', 'quoted', 'scheduled', 'completed', 'closed') NOT NULL DEFAULT 'new',
  notes TEXT,
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  description TEXT,
  line_items JSON,
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,4) DEFAULT 0.0731,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  status ENUM('draft', 'sent', 'accepted', 'declined') NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

CREATE TABLE IF NOT EXISTS jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  quote_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  address TEXT,
  status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
  deleted_at TIMESTAMP NULL DEFAULT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id),
  FOREIGN KEY (quote_id) REFERENCES quotes(id)
);

CREATE TABLE IF NOT EXISTS schedule (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  quote_id INT NOT NULL,
  lead_id INT NOT NULL,
  invoice_number VARCHAR(20),
  line_items JSON,
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,4) DEFAULT 0.0731,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  status ENUM('draft', 'sent', 'paid', 'overdue') NOT NULL DEFAULT 'draft',
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (quote_id) REFERENCES quotes(id),
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method ENUM('cash', 'check') NOT NULL,
  check_number VARCHAR(50),
  notes TEXT,
  payment_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);
```

- [ ] **Step 3: Create migrate.js**

```javascript
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function migrate() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const statements = sql.split(';').filter(s => s.trim());
    for (const statement of statements) {
      await pool.query(statement);
    }
    console.log(`Completed: ${file}`);
  }

  console.log('All migrations complete.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

- [ ] **Step 4: Commit**

```bash
git add server/db/
git commit -m "feat: add MySQL pool, migration script, and schema for all 6 CRM tables"
```

### Task 4: Create auth middleware and auth routes

**Files:**
- Create: `server/middleware/auth.js`
- Create: `server/routes/auth.js`

- [ ] **Step 1: Create JWT auth middleware**

`server/middleware/auth.js`:
```javascript
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authenticate;
```

- [ ] **Step 2: Create auth routes**

`server/routes/auth.js`:
```javascript
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  if (username !== process.env.ADMIN_USERNAME) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
  if (!match) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

router.get('/me', authenticate, (req, res) => {
  res.json({ username: req.user.username });
});

module.exports = router;
```

- [ ] **Step 3: Commit**

```bash
git add server/middleware/ server/routes/auth.js
git commit -m "feat: add JWT auth middleware and login/me routes"
```

### Task 5: Create Express server entry point

**Files:**
- Create: `server/index.js`
- Modify: `server.js` (keep as-is for reference, or delete)

- [ ] **Step 1: Create server/index.js**

```javascript
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authenticate = require('./middleware/auth');

// Route imports
const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');
const quoteRoutes = require('./routes/quotes');
const jobRoutes = require('./routes/jobs');
const scheduleRoutes = require('./routes/schedule');
const invoiceRoutes = require('./routes/invoices');
const paymentRoutes = require('./routes/payments');
const financeRoutes = require('./routes/finances');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Rate limiter for public lead creation
const leadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'Too many submissions, please try again later.' },
});

// Routes
app.use('/api', authRoutes);
app.use('/api/leads', leadRoutes(leadLimiter));
app.use('/api/quotes', authenticate, quoteRoutes);
app.use('/api/jobs', authenticate, jobRoutes);
app.use('/api/schedule', authenticate, scheduleRoutes);
app.use('/api/invoices', authenticate, invoiceRoutes);
app.use('/api/payments', authenticate, paymentRoutes);
app.use('/api/finances', authenticate, financeRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`CRM API running on port ${PORT}`));
```

Note: Route files are created in subsequent tasks. Create placeholder files that export an Express router for each so the server can start. Each route file will be fully implemented in its own task.

- [ ] **Step 2: Create placeholder route files**

For each of `leads.js`, `quotes.js`, `jobs.js`, `schedule.js`, `invoices.js`, `payments.js`, `finances.js` in `server/routes/`, create a minimal placeholder:

```javascript
// server/routes/leads.js (example — leads is special, takes limiter)
const express = require('express');
const authenticate = require('../middleware/auth');

module.exports = function (leadLimiter) {
  const router = express.Router();
  // Routes will be added in Task 6
  return router;
};
```

```javascript
// server/routes/quotes.js (and all others except leads)
const express = require('express');
const router = express.Router();
// Routes will be added in later tasks
module.exports = router;
```

Also create a placeholder `server/services/pdf.js`:
```javascript
// Placeholder — implemented in Task 12
function generateQuotePDF(quote, stream) { stream.end(); }
function generateInvoicePDF(invoice, stream) { stream.end(); }
module.exports = { generateQuotePDF, generateInvoicePDF };
```

- [ ] **Step 3: Verify server starts**

```bash
cd /Users/boshao/projects/nextlevel
# Server won't fully start without DB, but verify no syntax errors:
node -e "require('./server/index.js')" 2>&1 || echo "Expected: may fail on DB connection, but no syntax errors"
```

- [ ] **Step 4: Commit**

```bash
git add server/index.js server/routes/
git commit -m "feat: add Express server entry point with route mounting and rate limiting"
```

### Task 6: Implement leads routes

**Files:**
- Modify: `server/routes/leads.js`

- [ ] **Step 1: Implement full leads CRUD**

`server/routes/leads.js`:
```javascript
const express = require('express');
const pool = require('../db/pool');
const authenticate = require('../middleware/auth');

module.exports = function (leadLimiter) {
  const router = express.Router();

  // POST /api/leads — public, rate-limited
  router.post('/', leadLimiter, async (req, res) => {
    try {
      const { name, email, phone, area_desired, source, notes } = req.body;
      if (!name) return res.status(400).json({ error: 'Name is required' });

      const [result] = await pool.query(
        'INSERT INTO leads (name, email, phone, area_desired, source, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email || null, phone || null, area_desired || null, source || 'contact_form', notes || null]
      );
      res.status(201).json({ id: result.insertId });
    } catch (err) {
      console.error('Error creating lead:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // All routes below require auth
  router.use(authenticate);

  // GET /api/leads
  router.get('/', async (req, res) => {
    try {
      const { status, search, page = 1, limit = 25 } = req.query;
      let sql = 'SELECT * FROM leads WHERE deleted_at IS NULL';
      const params = [];

      if (status) {
        sql += ' AND status = ?';
        params.push(status);
      }
      if (search) {
        sql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s);
      }

      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(Number(limit), (Number(page) - 1) * Number(limit));

      const [rows] = await pool.query(sql, params);

      // Get total count
      let countSql = 'SELECT COUNT(*) as total FROM leads WHERE deleted_at IS NULL';
      const countParams = [];
      if (status) { countSql += ' AND status = ?'; countParams.push(status); }
      if (search) {
        countSql += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
        const s = `%${search}%`;
        countParams.push(s, s, s);
      }
      const [[{ total }]] = await pool.query(countSql, countParams);

      res.json({ leads: rows, total, page: Number(page), limit: Number(limit) });
    } catch (err) {
      console.error('Error fetching leads:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/leads/:id
  router.get('/:id', async (req, res) => {
    try {
      const [[lead]] = await pool.query('SELECT * FROM leads WHERE id = ? AND deleted_at IS NULL', [req.params.id]);
      if (!lead) return res.status(404).json({ error: 'Lead not found' });

      const [quotes] = await pool.query('SELECT * FROM quotes WHERE lead_id = ? ORDER BY created_at DESC', [req.params.id]);
      const [jobs] = await pool.query('SELECT * FROM jobs WHERE lead_id = ? AND deleted_at IS NULL ORDER BY created_at DESC', [req.params.id]);
      const [invoices] = await pool.query('SELECT * FROM invoices WHERE lead_id = ? ORDER BY created_at DESC', [req.params.id]);

      res.json({ ...lead, quotes, jobs, invoices });
    } catch (err) {
      console.error('Error fetching lead:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT /api/leads/:id
  router.put('/:id', async (req, res) => {
    try {
      const { status, notes } = req.body;
      const fields = [];
      const params = [];

      if (status) { fields.push('status = ?'); params.push(status); }
      if (notes !== undefined) { fields.push('notes = ?'); params.push(notes); }

      if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

      params.push(req.params.id);
      await pool.query(`UPDATE leads SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`, params);
      res.json({ success: true });
    } catch (err) {
      console.error('Error updating lead:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE /api/leads/:id — soft delete
  router.delete('/:id', async (req, res) => {
    try {
      await pool.query('UPDATE leads SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting lead:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/leads.js
git commit -m "feat: implement leads CRUD routes with pagination, search, and soft delete"
```

### Task 7: Implement quotes routes

**Files:**
- Modify: `server/routes/quotes.js`

- [ ] **Step 1: Implement full quotes CRUD**

```javascript
const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

// POST /api/quotes
router.post('/', async (req, res) => {
  try {
    const { lead_id, description, line_items, tax_rate = 0.0731 } = req.body;
    if (!lead_id) return res.status(400).json({ error: 'lead_id is required' });

    const items = line_items || [];
    const subtotal = items.reduce((sum, i) => sum + (i.qty * i.unit_price), 0);
    const tax_amount = +(subtotal * tax_rate).toFixed(2);
    const total = +(subtotal + tax_amount).toFixed(2);

    const [result] = await pool.query(
      'INSERT INTO quotes (lead_id, description, line_items, subtotal, tax_rate, tax_amount, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [lead_id, description || null, JSON.stringify(items), subtotal, tax_rate, tax_amount, total]
    );

    // Update lead status to 'quoted'
    await pool.query("UPDATE leads SET status = 'quoted' WHERE id = ? AND status IN ('new', 'contacted')", [lead_id]);

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('Error creating quote:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/quotes
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT q.*, l.name as lead_name FROM quotes q JOIN leads l ON q.lead_id = l.id';
    const params = [];
    if (status) { sql += ' WHERE q.status = ?'; params.push(status); }
    sql += ' ORDER BY q.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching quotes:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/quotes/:id
router.get('/:id', async (req, res) => {
  try {
    const [[quote]] = await pool.query(
      'SELECT q.*, l.name as lead_name, l.email as lead_email, l.phone as lead_phone FROM quotes q JOIN leads l ON q.lead_id = l.id WHERE q.id = ?',
      [req.params.id]
    );
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    res.json(quote);
  } catch (err) {
    console.error('Error fetching quote:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/quotes/:id
router.put('/:id', async (req, res) => {
  try {
    const { description, line_items, tax_rate, status } = req.body;
    const [[existing]] = await pool.query('SELECT * FROM quotes WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Quote not found' });

    const fields = [];
    const params = [];

    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (line_items) {
      const rate = tax_rate || existing.tax_rate;
      const subtotal = line_items.reduce((sum, i) => sum + (i.qty * i.unit_price), 0);
      const tax_amount = +(subtotal * rate).toFixed(2);
      const total = +(subtotal + tax_amount).toFixed(2);
      fields.push('line_items = ?', 'subtotal = ?', 'tax_rate = ?', 'tax_amount = ?', 'total = ?');
      params.push(JSON.stringify(line_items), subtotal, rate, tax_amount, total);
    }
    if (status) { fields.push('status = ?'); params.push(status); }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);
    await pool.query(`UPDATE quotes SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating quote:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/quotes/:id — hard delete, only if draft and no linked jobs
router.delete('/:id', async (req, res) => {
  try {
    const [[quote]] = await pool.query('SELECT * FROM quotes WHERE id = ?', [req.params.id]);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    if (quote.status !== 'draft') return res.status(400).json({ error: 'Only draft quotes can be deleted' });

    const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM jobs WHERE quote_id = ?', [req.params.id]);
    if (count > 0) return res.status(400).json({ error: 'Cannot delete quote with linked jobs' });

    await pool.query('DELETE FROM quotes WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting quote:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/quotes.js
git commit -m "feat: implement quotes CRUD with auto-calc totals and lead status update"
```

### Task 8: Implement jobs routes

**Files:**
- Modify: `server/routes/jobs.js`

- [ ] **Step 1: Implement jobs CRUD**

```javascript
const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

// POST /api/jobs — create from accepted quote
router.post('/', async (req, res) => {
  try {
    const { quote_id, title, description, address, start_date, end_date } = req.body;
    if (!quote_id) return res.status(400).json({ error: 'quote_id is required' });

    const [[quote]] = await pool.query('SELECT * FROM quotes WHERE id = ?', [quote_id]);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });

    const [result] = await pool.query(
      'INSERT INTO jobs (lead_id, quote_id, title, description, address, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [quote.lead_id, quote_id, title || `Job for Quote #${quote_id}`, description || quote.description, address || null, start_date || null, end_date || null]
    );

    // Update lead status
    await pool.query("UPDATE leads SET status = 'scheduled' WHERE id = ?", [quote.lead_id]);

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('Error creating job:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/jobs
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT j.*, l.name as lead_name FROM jobs j JOIN leads l ON j.lead_id = l.id WHERE j.deleted_at IS NULL';
    const params = [];
    if (status) { sql += ' AND j.status = ?'; params.push(status); }
    sql += ' ORDER BY j.start_date ASC, j.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/jobs/:id
router.get('/:id', async (req, res) => {
  try {
    const [[job]] = await pool.query(
      'SELECT j.*, l.name as lead_name, l.email as lead_email, l.phone as lead_phone FROM jobs j JOIN leads l ON j.lead_id = l.id WHERE j.id = ? AND j.deleted_at IS NULL',
      [req.params.id]
    );
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const [scheduleEntries] = await pool.query('SELECT * FROM schedule WHERE job_id = ? ORDER BY date ASC', [req.params.id]);
    const [[quote]] = await pool.query('SELECT * FROM quotes WHERE id = ?', [job.quote_id]);

    res.json({ ...job, schedule: scheduleEntries, quote });
  } catch (err) {
    console.error('Error fetching job:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/jobs/:id
router.put('/:id', async (req, res) => {
  try {
    const { status, title, description, address, start_date, end_date } = req.body;
    const fields = [];
    const params = [];

    if (status) { fields.push('status = ?'); params.push(status); }
    if (title) { fields.push('title = ?'); params.push(title); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (address !== undefined) { fields.push('address = ?'); params.push(address); }
    if (start_date !== undefined) { fields.push('start_date = ?'); params.push(start_date); }
    if (end_date !== undefined) { fields.push('end_date = ?'); params.push(end_date); }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);
    await pool.query(`UPDATE jobs SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`, params);

    // If completed, update lead status
    if (status === 'completed') {
      const [[job]] = await pool.query('SELECT lead_id FROM jobs WHERE id = ?', [req.params.id]);
      if (job) await pool.query("UPDATE leads SET status = 'completed' WHERE id = ?", [job.lead_id]);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating job:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/jobs/:id — soft delete
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE jobs SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting job:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/jobs.js
git commit -m "feat: implement jobs CRUD with schedule entries and lead status sync"
```

### Task 9: Implement schedule routes

**Files:**
- Modify: `server/routes/schedule.js`

- [ ] **Step 1: Implement schedule CRUD**

```javascript
const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

// GET /api/schedule?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const { start, end } = req.query;
    let sql = 'SELECT s.*, j.title as job_title, j.status as job_status, l.name as lead_name FROM schedule s JOIN jobs j ON s.job_id = j.id JOIN leads l ON j.lead_id = l.id';
    const params = [];
    if (start && end) {
      sql += ' WHERE s.date BETWEEN ? AND ?';
      params.push(start, end);
    }
    sql += ' ORDER BY s.date ASC, s.start_time ASC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching schedule:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/schedule
router.post('/', async (req, res) => {
  try {
    const { job_id, date, start_time, end_time, notes } = req.body;
    if (!job_id || !date) return res.status(400).json({ error: 'job_id and date are required' });

    const [result] = await pool.query(
      'INSERT INTO schedule (job_id, date, start_time, end_time, notes) VALUES (?, ?, ?, ?, ?)',
      [job_id, date, start_time || null, end_time || null, notes || null]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('Error creating schedule entry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/schedule/:id
router.put('/:id', async (req, res) => {
  try {
    const { date, start_time, end_time, notes } = req.body;
    const fields = [];
    const params = [];

    if (date) { fields.push('date = ?'); params.push(date); }
    if (start_time !== undefined) { fields.push('start_time = ?'); params.push(start_time); }
    if (end_time !== undefined) { fields.push('end_time = ?'); params.push(end_time); }
    if (notes !== undefined) { fields.push('notes = ?'); params.push(notes); }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);
    await pool.query(`UPDATE schedule SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating schedule entry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/schedule/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM schedule WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting schedule entry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/schedule.js
git commit -m "feat: implement schedule CRUD with date range filtering"
```

### Task 10: Implement invoices routes

**Files:**
- Modify: `server/routes/invoices.js`

- [ ] **Step 1: Implement invoices CRUD**

```javascript
const express = require('express');
const pool = require('../db/pool');
const { generateInvoicePDF } = require('../services/pdf');
const router = express.Router();

// POST /api/invoices
router.post('/', async (req, res) => {
  try {
    const { job_id } = req.body;
    if (!job_id) return res.status(400).json({ error: 'job_id is required' });

    const [[job]] = await pool.query('SELECT * FROM jobs WHERE id = ?', [job_id]);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const [[quote]] = await pool.query('SELECT * FROM quotes WHERE id = ?', [job.quote_id]);

    const due_date = new Date();
    due_date.setDate(due_date.getDate() + 30);

    const [result] = await pool.query(
      'INSERT INTO invoices (job_id, quote_id, lead_id, line_items, subtotal, tax_rate, tax_amount, total, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [job_id, job.quote_id, job.lead_id, quote.line_items, quote.subtotal, quote.tax_rate, quote.tax_amount, quote.total, due_date]
    );

    // Generate invoice number from ID
    const invoiceNumber = `INV-${String(result.insertId).padStart(4, '0')}`;
    await pool.query('UPDATE invoices SET invoice_number = ? WHERE id = ?', [invoiceNumber, result.insertId]);

    res.status(201).json({ id: result.insertId, invoice_number: invoiceNumber });
  } catch (err) {
    console.error('Error creating invoice:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/invoices
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT i.*, l.name as lead_name FROM invoices i JOIN leads l ON i.lead_id = l.id';
    const params = [];
    if (status) { sql += ' WHERE i.status = ?'; params.push(status); }
    sql += ' ORDER BY i.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/invoices/:id
router.get('/:id', async (req, res) => {
  try {
    const [[invoice]] = await pool.query(
      'SELECT i.*, l.name as lead_name, l.email as lead_email, l.phone as lead_phone FROM invoices i JOIN leads l ON i.lead_id = l.id WHERE i.id = ?',
      [req.params.id]
    );
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const [payments] = await pool.query('SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC', [req.params.id]);
    res.json({ ...invoice, payments });
  } catch (err) {
    console.error('Error fetching invoice:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/invoices/:id
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });

    await pool.query('UPDATE invoices SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating invoice:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/invoices/:id/pdf
router.get('/:id/pdf', async (req, res) => {
  try {
    const [[invoice]] = await pool.query(
      'SELECT i.*, l.name as lead_name, l.email as lead_email, l.phone as lead_phone FROM invoices i JOIN leads l ON i.lead_id = l.id WHERE i.id = ?',
      [req.params.id]
    );
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${invoice.invoice_number}.pdf"`);

    generateInvoicePDF(invoice, res);
  } catch (err) {
    console.error('Error generating invoice PDF:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

- [ ] **Step 2: Commit**

```bash
git add server/routes/invoices.js
git commit -m "feat: implement invoices CRUD with auto invoice number and PDF endpoint"
```

### Task 11: Implement payments and finances routes

**Files:**
- Modify: `server/routes/payments.js`
- Modify: `server/routes/finances.js`

- [ ] **Step 1: Implement payments CRUD**

`server/routes/payments.js`:
```javascript
const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

// POST /api/payments
router.post('/', async (req, res) => {
  try {
    const { invoice_id, amount, method, check_number, notes, payment_date } = req.body;
    if (!invoice_id || !amount || !method || !payment_date) {
      return res.status(400).json({ error: 'invoice_id, amount, method, and payment_date are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO payments (invoice_id, amount, method, check_number, notes, payment_date) VALUES (?, ?, ?, ?, ?, ?)',
      [invoice_id, amount, method, check_number || null, notes || null, payment_date]
    );

    // Check if invoice is fully paid
    const [[invoice]] = await pool.query('SELECT total FROM invoices WHERE id = ?', [invoice_id]);
    const [[{ paid }]] = await pool.query('SELECT COALESCE(SUM(amount), 0) as paid FROM payments WHERE invoice_id = ?', [invoice_id]);

    if (paid >= invoice.total) {
      await pool.query("UPDATE invoices SET status = 'paid' WHERE id = ?", [invoice_id]);
    }

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('Error recording payment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/payments
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT p.*, i.invoice_number, l.name as lead_name FROM payments p JOIN invoices i ON p.invoice_id = i.id JOIN leads l ON i.lead_id = l.id ORDER BY p.payment_date DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

- [ ] **Step 2: Implement finances routes**

`server/routes/finances.js`:
```javascript
const express = require('express');
const pool = require('../db/pool');
const router = express.Router();

// GET /api/finances/summary
router.get('/summary', async (req, res) => {
  try {
    const [[{ total_revenue }]] = await pool.query('SELECT COALESCE(SUM(amount), 0) as total_revenue FROM payments');
    const [[{ outstanding }]] = await pool.query("SELECT COALESCE(SUM(total), 0) as outstanding FROM invoices WHERE status IN ('draft', 'sent', 'overdue')");
    const [[{ this_month }]] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as this_month FROM payments WHERE YEAR(payment_date) = YEAR(CURDATE()) AND MONTH(payment_date) = MONTH(CURDATE())'
    );
    const [[{ this_quarter }]] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as this_quarter FROM payments WHERE YEAR(payment_date) = YEAR(CURDATE()) AND QUARTER(payment_date) = QUARTER(CURDATE())'
    );
    const [[{ this_year }]] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as this_year FROM payments WHERE YEAR(payment_date) = YEAR(CURDATE())'
    );

    res.json({ total_revenue, outstanding, this_month, this_quarter, this_year });
  } catch (err) {
    console.error('Error fetching finance summary:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/finances/monthly
router.get('/monthly', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(payment_date, '%Y-%m') as month, SUM(amount) as revenue
       FROM payments
       WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY month
       ORDER BY month ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching monthly finances:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/payments.js server/routes/finances.js
git commit -m "feat: implement payments CRUD with auto-mark-paid, and finances summary/monthly endpoints"
```

### Task 12: Implement PDF service

**Files:**
- Create: `server/services/pdf.js`

- [ ] **Step 1: Create PDF generator**

```javascript
const PDFDocument = require('pdfkit');
const path = require('path');

const COMPANY = {
  name: 'Next Level Epoxy Flooring',
  phone: '505-352-4674',
  location: 'Albuquerque & Santa Fe, NM',
  website: 'www.nextlevelepoxynm.com',
};

function drawHeader(doc) {
  const logoPath = path.join(__dirname, '../../public/nextlevellogo.png');
  try { doc.image(logoPath, 50, 30, { width: 150 }); } catch { /* logo optional */ }
  doc.fontSize(10).fillColor('#666')
    .text(COMPANY.phone, 400, 40, { align: 'right' })
    .text(COMPANY.location, 400, 55, { align: 'right' })
    .text(COMPANY.website, 400, 70, { align: 'right' });
  doc.moveDown(4);
}

function drawLineItems(doc, items) {
  const tableTop = doc.y + 10;
  const col = { item: 50, qty: 320, price: 390, total: 470 };

  doc.fontSize(9).fillColor('#999');
  doc.text('ITEM', col.item, tableTop);
  doc.text('QTY', col.qty, tableTop);
  doc.text('PRICE', col.price, tableTop);
  doc.text('TOTAL', col.total, tableTop);

  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke('#ddd');

  let y = tableTop + 25;
  doc.fillColor('#333').fontSize(10);
  const parsed = typeof items === 'string' ? JSON.parse(items) : items;

  (parsed || []).forEach(item => {
    const lineTotal = (item.qty * item.unit_price).toFixed(2);
    doc.text(item.item || item.description || '', col.item, y, { width: 260 });
    doc.text(String(item.qty), col.qty, y);
    doc.text(`$${Number(item.unit_price).toFixed(2)}`, col.price, y);
    doc.text(`$${lineTotal}`, col.total, y);
    y += 20;
  });

  doc.moveTo(50, y).lineTo(550, y).stroke('#ddd');
  return y + 10;
}

function drawTotals(doc, y, subtotal, tax_rate, tax_amount, total) {
  doc.fontSize(10).fillColor('#333');
  doc.text('Subtotal:', 390, y).text(`$${Number(subtotal).toFixed(2)}`, 470, y);
  y += 18;
  doc.text(`Tax (${(tax_rate * 100).toFixed(2)}%):`, 390, y).text(`$${Number(tax_amount).toFixed(2)}`, 470, y);
  y += 18;
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f4c81');
  doc.text('Total:', 390, y).text(`$${Number(total).toFixed(2)}`, 470, y);
  doc.font('Helvetica');
  return y + 30;
}

function generateQuotePDF(quote, stream) {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(stream);

  drawHeader(doc);

  doc.fontSize(20).fillColor('#0f4c81').text('QUOTE', 50);
  doc.moveDown(0.5);

  doc.fontSize(10).fillColor('#333');
  doc.text(`Client: ${quote.lead_name || ''}`);
  if (quote.lead_email) doc.text(`Email: ${quote.lead_email}`);
  if (quote.lead_phone) doc.text(`Phone: ${quote.lead_phone}`);
  doc.moveDown(0.5);
  if (quote.description) doc.text(quote.description);
  doc.moveDown(0.5);

  const y = drawLineItems(doc, quote.line_items);
  drawTotals(doc, y, quote.subtotal, quote.tax_rate, quote.tax_amount, quote.total);

  doc.end();
}

function generateInvoicePDF(invoice, stream) {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(stream);

  drawHeader(doc);

  // Paid watermark
  if (invoice.status === 'paid') {
    doc.save().rotate(45, { origin: [300, 400] })
      .fontSize(80).fillColor('#4ade8040').text('PAID', 150, 300)
      .restore();
  }

  doc.fontSize(20).fillColor('#0f4c81').text('INVOICE', 50);
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor('#333');
  doc.text(`Invoice #: ${invoice.invoice_number}`);
  doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`);
  doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`);
  doc.moveDown(0.5);

  doc.text(`Bill To: ${invoice.lead_name || ''}`);
  if (invoice.lead_email) doc.text(`Email: ${invoice.lead_email}`);
  if (invoice.lead_phone) doc.text(`Phone: ${invoice.lead_phone}`);
  doc.moveDown(0.5);

  const y = drawLineItems(doc, invoice.line_items);
  const totalsEnd = drawTotals(doc, y, invoice.subtotal, invoice.tax_rate, invoice.tax_amount, invoice.total);

  doc.fontSize(10).fillColor('#666');
  doc.text('Payment Instructions:', 50, totalsEnd + 10);
  doc.text('Make checks payable to: Next Level Epoxy Flooring');
  doc.text(`Questions? Call ${COMPANY.phone}`);

  doc.end();
}

module.exports = { generateQuotePDF, generateInvoicePDF };
```

- [ ] **Step 2: Add quote PDF endpoint to quotes routes**

Add to `server/routes/quotes.js` before `module.exports`:
```javascript
const { generateQuotePDF } = require('../services/pdf');

// GET /api/quotes/:id/pdf
router.get('/:id/pdf', async (req, res) => {
  try {
    const [[quote]] = await pool.query(
      'SELECT q.*, l.name as lead_name, l.email as lead_email, l.phone as lead_phone FROM quotes q JOIN leads l ON q.lead_id = l.id WHERE q.id = ?',
      [req.params.id]
    );
    if (!quote) return res.status(404).json({ error: 'Quote not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="quote-${quote.id}.pdf"`);
    generateQuotePDF(quote, res);
  } catch (err) {
    console.error('Error generating quote PDF:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

Note: The PDF route must be placed BEFORE the `/:id` route to avoid the `:id` param catching "pdf" as an ID. Reorder the routes: `GET /`, `POST /`, `GET /:id/pdf`, `GET /:id`, `PUT /:id`, `DELETE /:id`.

- [ ] **Step 3: Commit**

```bash
git add server/services/pdf.js server/routes/quotes.js
git commit -m "feat: add PDF generation service for quotes and invoices with NextLevel branding"
```

---

## Chunk 2: Frontend — Admin Auth, Layout & Routing

### Task 13: Create admin API helper

**Files:**
- Create: `src/admin/api.js`

- [ ] **Step 1: Create Axios instance with JWT interceptor**

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

- [ ] **Step 2: Commit**

```bash
git add src/admin/api.js
git commit -m "feat: add admin API axios instance with JWT interceptor"
```

### Task 14: Create admin shared styles

**Files:**
- Create: `src/admin/styles.js`

- [ ] **Step 1: Create shared admin styled components**

Create `src/admin/styles.js` with reusable styled components for the admin area:
- `PageContainer` — full-width content wrapper with padding
- `PageTitle` — h1 styled for admin pages
- `Card` — white card with shadow
- `Table`, `Th`, `Td` — styled table components
- `Button`, `ButtonSecondary` — primary (#0f4c81) and secondary action buttons
- `StatusBadge` — colored pill badge for status values
- `Input`, `Select`, `TextArea` — form input styles matching admin theme
- `FilterBar` — horizontal flex bar for search/filter controls
- `Modal` — overlay modal for confirmations and small forms
- `SummaryCard` — dashboard-style metric card

All using the site's existing color variables (--primary, --accent, etc.) and Poppins font.

- [ ] **Step 2: Commit**

```bash
git add src/admin/styles.js
git commit -m "feat: add shared admin styled components"
```

### Task 15: Create Login page

**Files:**
- Create: `src/admin/Login.jsx`

- [ ] **Step 1: Create login component**

Simple login form: username + password fields, submit button. On success, stores JWT in localStorage and navigates to `/admin/dashboard`. On error, shows "Invalid credentials" message. Styled to match the NextLevel brand (centered card, dark blue accents). No public header/footer wrapping this page.

- [ ] **Step 2: Commit**

```bash
git add src/admin/Login.jsx
git commit -m "feat: add admin login page"
```

### Task 16: Create AdminRoute guard and AdminLayout

**Files:**
- Create: `src/admin/AdminRoute.jsx`
- Create: `src/admin/AdminLayout.jsx`

- [ ] **Step 1: Create AdminRoute**

Checks for `admin_token` in localStorage. If missing, redirects to `/admin/login`. If present, verifies with `GET /api/me`. On failure, clears token and redirects. On success, renders children.

- [ ] **Step 2: Create AdminLayout**

Layout component with:
- **Sidebar** (left, 240px wide, dark blue #0a1628):
  - NextLevel logo at top
  - Nav links: Dashboard, Leads, Quotes, Jobs, Schedule, Invoices, Finances
  - Each link uses react-router-dom `NavLink` with active styling (gold accent)
  - Icons from react-icons (FiHome, FiUsers, FiFileText, FiBriefcase, FiCalendar, FiDollarSign)
- **Top bar** (above content area):
  - "Back to Site" link (navigates to `/`)
  - Logout button (clears token, redirects to `/admin/login`)
- **Content area**: renders `<Outlet />` from react-router

Responsive: on mobile (<768px), sidebar collapses to hamburger menu.

- [ ] **Step 3: Commit**

```bash
git add src/admin/AdminRoute.jsx src/admin/AdminLayout.jsx
git commit -m "feat: add admin route guard and sidebar layout"
```

### Task 17: Wire up admin routes in App.js

**Files:**
- Modify: `src/App.js`

- [ ] **Step 1: Add admin routes**

Import `Login`, `AdminRoute`, `AdminLayout`, and all admin page placeholders. Add routes:

```jsx
{/* Admin routes — outside of Header/Footer */}
<Route path="/admin/login" element={<Login />} />
<Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
  <Route index element={<Navigate to="/admin/dashboard" />} />
  <Route path="dashboard" element={<Dashboard />} />
  <Route path="leads" element={<Leads />} />
  <Route path="leads/:id" element={<LeadDetail />} />
  <Route path="quotes" element={<Quotes />} />
  <Route path="quotes/:id" element={<QuoteDetail />} />
  <Route path="jobs" element={<Jobs />} />
  <Route path="jobs/:id" element={<JobDetail />} />
  <Route path="schedule" element={<Schedule />} />
  <Route path="invoices" element={<Invoices />} />
  <Route path="invoices/:id" element={<InvoiceDetail />} />
  <Route path="finances" element={<Finances />} />
</Route>
```

Key structural change: the existing `<Header />` and `<Footer />` must only render for public routes, NOT admin routes. Wrap the existing routes plus Header/Footer in a layout route or use conditional rendering based on path.

Approach: Create a `PublicLayout` component that wraps `<Header />`, `<MainContent><Outlet /></MainContent>`, `<Footer />`. Move existing routes inside it:

```jsx
<Routes>
  <Route element={<PublicLayout />}>
    <Route path="/" element={<>...</>} />
    <Route path="/commercial" element={<Commercial />} />
    {/* all other public routes */}
  </Route>
  <Route path="/admin/login" element={<Login />} />
  <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
    {/* admin routes */}
  </Route>
</Routes>
```

Create `PublicLayout` inline in App.js (small component, not worth a separate file).

- [ ] **Step 2: Create placeholder components for all admin pages**

Create simple placeholder components for: `Dashboard.jsx`, `Leads.jsx`, `LeadDetail.jsx`, `Quotes.jsx`, `QuoteDetail.jsx`, `Jobs.jsx`, `JobDetail.jsx`, `Schedule.jsx`, `Invoices.jsx`, `InvoiceDetail.jsx`, `Finances.jsx` — each just renders `<PageContainer><PageTitle>Page Name</PageTitle></PageContainer>`.

- [ ] **Step 3: Verify app builds**

```bash
cd /Users/boshao/projects/nextlevel && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/App.js src/admin/
git commit -m "feat: wire up admin routes with layout separation from public site"
```

### Task 18: Add Admin link to Footer

**Files:**
- Modify: `src/Footer.jsx`

- [ ] **Step 1: Add Admin link**

Add a subtle link in the `BottomBar` next to the Easter Egg link. Use `Link` from react-router-dom to `/admin/login`. Style it identically to the `EasterEgg` component — very subtle, low opacity, barely visible unless you know it's there.

```jsx
<EasterEgg to="/admin/login" aria-label="Admin">
  Admin
</EasterEgg>
```

Place it between the Copyright and the MadeBy link.

- [ ] **Step 2: Commit**

```bash
git add src/Footer.jsx
git commit -m "feat: add subtle admin login link to footer"
```

---

## Chunk 3: Frontend — CRM Pages (Leads, Quotes, Jobs)

### Task 19: Implement Dashboard page

**Files:**
- Modify: `src/admin/Dashboard.jsx`

- [ ] **Step 1: Build dashboard**

On mount, fetch from multiple endpoints:
- `GET /api/leads?status=new&limit=5` for new leads count + list
- `GET /api/jobs?status=scheduled` for active jobs
- `GET /api/invoices?status=sent` and `status=overdue` for outstanding invoices
- `GET /api/finances/summary` for revenue cards

Display:
- 4 summary cards (new leads, active jobs, outstanding invoices, this month revenue)
- Recent leads table (last 5)
- Upcoming jobs list
- Overdue invoices alert

- [ ] **Step 2: Commit**

```bash
git add src/admin/Dashboard.jsx
git commit -m "feat: implement admin dashboard with summary cards and recent activity"
```

### Task 20: Implement Leads list and LeadDetail pages

**Files:**
- Modify: `src/admin/Leads.jsx`
- Modify: `src/admin/LeadDetail.jsx`

- [ ] **Step 1: Build Leads list page**

- Table with columns: Name, Email, Phone, Source, Status, Date
- Search input (filters by name/email/phone)
- Status filter dropdown
- Click row navigates to `/admin/leads/:id`
- Pagination controls

- [ ] **Step 2: Build LeadDetail page**

- Shows all lead info
- Editable notes textarea (saves on blur or button click via `PUT /api/leads/:id`)
- Status dropdown to change status
- Related quotes table (linked via lead_id)
- Related jobs table
- Related invoices table
- "Create Quote" button → navigates to `/admin/quotes/new?lead_id=X`
- "Delete Lead" button with confirmation → soft deletes

- [ ] **Step 3: Commit**

```bash
git add src/admin/Leads.jsx src/admin/LeadDetail.jsx
git commit -m "feat: implement leads list with search/filter and lead detail with notes and related data"
```

### Task 21: Implement Quotes list and QuoteDetail pages

**Files:**
- Modify: `src/admin/Quotes.jsx`
- Modify: `src/admin/QuoteDetail.jsx`

- [ ] **Step 1: Build Quotes list page**

- Table: Lead Name, Description, Total, Status, Date
- Status filter dropdown
- Click row navigates to `/admin/quotes/:id`

- [ ] **Step 2: Build QuoteDetail page (quote builder)**

- If URL is `/admin/quotes/new?lead_id=X`, show empty form for new quote
- If URL is `/admin/quotes/:id`, load existing quote
- Lead info display at top
- Description textarea
- **Line items editor:**
  - Table with columns: Item Description, Qty, Unit Price, Line Total
  - "Add Line Item" button adds a row
  - Remove button (X) on each row
  - Auto-calculates subtotal, tax (editable rate, default 7.31%), total
- Save button → `POST /api/quotes` or `PUT /api/quotes/:id`
- Status actions: "Mark Sent", "Mark Accepted" (triggers job creation prompt), "Mark Declined"
- "Download PDF" button → opens `GET /api/quotes/:id/pdf` in new tab
- "Delete" button (only visible if draft)

When "Mark Accepted" is clicked:
1. Update quote status to 'accepted'
2. Show modal to enter job details (title, address, start/end date)
3. POST /api/jobs to create the job
4. Navigate to the new job detail page

- [ ] **Step 3: Commit**

```bash
git add src/admin/Quotes.jsx src/admin/QuoteDetail.jsx
git commit -m "feat: implement quotes list and quote builder with line items, PDF, and accept-to-job flow"
```

### Task 22: Implement Jobs list and JobDetail pages

**Files:**
- Modify: `src/admin/Jobs.jsx`
- Modify: `src/admin/JobDetail.jsx`

- [ ] **Step 1: Build Jobs list page**

- Table: Title, Lead Name, Address, Status, Start Date
- Status filter dropdown
- Click row navigates to `/admin/jobs/:id`

- [ ] **Step 2: Build JobDetail page**

- Job info display (title, description, address, dates)
- Linked lead info
- Linked quote with "View Quote" link
- Status buttons: "Start Job" (→ in_progress), "Complete Job" (→ completed)
- **Schedule section:**
  - List of schedule entries for this job
  - "Add Schedule Entry" form: date picker, start/end time, notes
  - Edit/delete existing entries
- When "Complete Job" is clicked:
  - Updates job status
  - Shows prompt: "Create invoice for this job?"
  - If yes → `POST /api/invoices` with job_id, then navigate to invoice detail

- [ ] **Step 3: Commit**

```bash
git add src/admin/Jobs.jsx src/admin/JobDetail.jsx
git commit -m "feat: implement jobs list and detail with schedule management and complete-to-invoice flow"
```

---

## Chunk 4: Frontend — Schedule, Invoices, Finances & Form Integration

### Task 23: Implement Schedule calendar page

**Files:**
- Modify: `src/admin/Schedule.jsx`

- [ ] **Step 1: Build monthly calendar view**

Build a custom calendar component (no external library needed):
- Month/year header with prev/next navigation buttons
- 7-column grid (Sun-Sat)
- Each day cell shows schedule entries for that date
- Entries color-coded by job status:
  - scheduled → blue (#0f4c81)
  - in_progress → gold (#f0a500)
  - completed → green (#4ade80)
  - cancelled → gray
- Clicking an entry navigates to `/admin/jobs/:job_id`
- Clicking an empty date opens "Add Schedule Entry" modal (select job, time, notes)

On mount and month navigation: `GET /api/schedule?start=YYYY-MM-01&end=YYYY-MM-31`

- [ ] **Step 2: Commit**

```bash
git add src/admin/Schedule.jsx
git commit -m "feat: implement monthly schedule calendar with color-coded job entries"
```

### Task 24: Implement Invoices list and InvoiceDetail pages

**Files:**
- Modify: `src/admin/Invoices.jsx`
- Modify: `src/admin/InvoiceDetail.jsx`

- [ ] **Step 1: Build Invoices list page**

- Table: Invoice #, Lead Name, Total, Status, Due Date
- Status filter dropdown (draft, sent, paid, overdue)
- Click row navigates to `/admin/invoices/:id`

- [ ] **Step 2: Build InvoiceDetail page**

- Invoice info: number, date, due date, status
- Client info (from lead)
- Line items table (read-only, from quote)
- Totals display
- Payments section:
  - List of payments made against this invoice
  - Total paid vs. total due
  - "Record Payment" button opens modal:
    - Amount (default: remaining balance)
    - Method: cash/check radio
    - Check number (shown if method = check)
    - Payment date
    - Notes
    - Submit → `POST /api/payments`
- Status actions: "Mark Sent", "Mark Overdue"
- "Download PDF" button → opens `GET /api/invoices/:id/pdf` in new tab

- [ ] **Step 3: Commit**

```bash
git add src/admin/Invoices.jsx src/admin/InvoiceDetail.jsx
git commit -m "feat: implement invoices list and detail with payment recording and PDF download"
```

### Task 25: Implement Finances page

**Files:**
- Modify: `src/admin/Finances.jsx`

- [ ] **Step 1: Build finances page**

- Summary cards: Total Revenue, This Year, This Month, Outstanding Balance
- Monthly revenue bar chart (last 12 months):
  - Simple CSS-based bar chart (no charting library needed)
  - Horizontal bars, month labels, dollar amounts
  - Uses data from `GET /api/finances/monthly`
- Payment history table:
  - Uses data from `GET /api/payments`
  - Columns: Date, Invoice #, Client, Amount, Method

- [ ] **Step 2: Commit**

```bash
git add src/admin/Finances.jsx
git commit -m "feat: implement finances page with revenue summary, bar chart, and payment history"
```

### Task 26: Integrate forms with API (dual-send)

**Files:**
- Modify: `src/ContactForm.jsx`
- Modify: `src/Commercial.jsx`
- Modify: `src/Careers.jsx`

- [ ] **Step 1: Add API call to ContactForm.jsx**

In the `handleSubmit` function, after `emailjs.send()` succeeds (inside `.then()`), add:

```javascript
// Also send to CRM API
fetch('/api/leads', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: form.user_name,
    email: form.user_email,
    phone: form.user_number,
    area_desired: form.area_desired,
    source: 'contact_form',
  }),
}).catch(() => {}); // Silent fail — email already sent
```

- [ ] **Step 2: Add API call to Commercial.jsx**

Same pattern. After EmailJS succeeds:

```javascript
fetch('/api/leads', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: form.contact_name,
    email: form.user_email,
    phone: form.user_number,
    area_desired: form.area_desired,
    source: 'commercial_form',
    notes: `Company: ${form.company_name}\nFacility: ${form.facility_type}\nSq Footage: ${form.square_footage}`,
  }),
}).catch(() => {});
```

- [ ] **Step 3: Add API call to Careers.jsx**

After Formspree POST succeeds:

```javascript
fetch('/api/leads', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: formData.applicant_name,
    email: formData.applicant_email,
    phone: formData.phone_number,
    source: 'career_form',
    notes: `Age: ${formData.age}\nExperience: ${formData.relevant_experience}`,
  }),
}).catch(() => {});
```

- [ ] **Step 4: Verify build succeeds**

```bash
cd /Users/boshao/projects/nextlevel && npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/ContactForm.jsx src/Commercial.jsx src/Careers.jsx
git commit -m "feat: add CRM API dual-send to all public forms (contact, commercial, careers)"
```

---

## Chunk 5: Deployment

### Task 27: Update deployment scripts and server config

**Files:**
- Modify: `package.json` (server script path already updated in Task 1)

- [ ] **Step 1: Verify final build**

```bash
cd /Users/boshao/projects/nextlevel && npm run build
```

- [ ] **Step 2: Document deployment steps**

The deployment process is:
1. On EC2, install MySQL: `sudo apt install mysql-server` and create the database
2. Copy `.env` to EC2 with production values (DB credentials, admin password hash, JWT secret)
3. Run migrations: `node server/db/migrate.js`
4. Install PM2: `npm install -g pm2`
5. Build: `npm run build`
6. SCP `build/` and `server/` directories to EC2
7. On EC2: `pm2 start server/index.js --name nextlevel-api`
8. Configure Nginx to serve `build/` statically and proxy `/api/*` to `localhost:4242`

Nginx config snippet:
```nginx
server {
    listen 80;
    server_name nextlevelepoxynm.com www.nextlevelepoxynm.com;

    root /home/ubuntu/build;
    index index.html;

    location /api/ {
        proxy_pass http://localhost:4242;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri /index.html;
    }
}
```

- [ ] **Step 3: Commit all remaining changes**

```bash
git add package.json server/ src/admin/ src/App.js src/Footer.jsx src/ContactForm.jsx src/Commercial.jsx src/Careers.jsx .env.example
git commit -m "feat: finalize CRM build and add deployment documentation"
```
