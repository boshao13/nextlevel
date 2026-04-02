# NextLevel CRM — Design Spec

## Overview

A custom, enterprise-level CRM for NextLevel Epoxy Flooring. Single-admin, contractor-focused system that manages the full lifecycle: **Lead → Quote → Job → Schedule → Invoice → Payment**. Data stored in MySQL on the existing EC2 instance. Integrated into the existing React + Express app.

## Architecture

### Infrastructure
- **Single EC2 instance** (13.59.87.37) runs everything
- **Nginx** reverse proxy: serves React static build on 80/443, proxies `/api/*` to Express on port 4242
- **Express API** on port 4242: all CRM endpoints, JWT-protected
- **MySQL** on the same instance: all CRM data

### Application Structure
- **Public site**: unchanged, all existing routes and pages remain as-is
- **Admin CRM**: behind `/admin/*` routes, requires JWT authentication. Uses a separate `AdminLayout` component (sidebar + header) instead of the public site's `Header`/`Footer`
- **Footer**: small "Admin" link added, navigates to `/admin/login`

### Server Structure
The Express server is created from scratch in a `server/` directory at the project root (separate from `src/` which is CRA frontend code):
```
server/
  index.js          — Express app setup, middleware (cors, body-parser, express-rate-limit)
  middleware/
    auth.js         — JWT verification middleware
  routes/
    auth.js         — login, me
    leads.js        — CRUD
    quotes.js       — CRUD
    jobs.js         — CRUD
    schedule.js     — CRUD
    invoices.js     — CRUD + PDF
    payments.js     — CRUD
    finances.js     — summary, monthly
  db/
    pool.js         — MySQL connection pool
    migrations/     — SQL migration files (001_create_tables.sql, etc.)
```
Migrations are raw SQL files run manually via a helper script (`node server/db/migrate.js`). CRA proxy config in `package.json` points to `localhost:4242` for local development.

### Authentication
- Single hardcoded admin account
- Password hashed with bcrypt, stored in `.env` (`ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`)
- JWT token returned on login, stored in localStorage, 24-hour expiry
- All `/api/*` routes (except `POST /api/login` and `POST /api/leads`) require valid JWT in Authorization header

## Data Model

### leads
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT PK | |
| name | VARCHAR(255) | |
| email | VARCHAR(255) | |
| phone | VARCHAR(50) | |
| area_desired | TEXT | |
| source | ENUM('contact_form', 'commercial_form', 'career_form') | Which form submitted |
| status | ENUM('new', 'contacted', 'quoted', 'scheduled', 'completed', 'closed') | Default: 'new' |
| notes | TEXT | Admin notes. Commercial form extras (company_name, facility_type, square_footage) and career form extras (age, relevant_experience) are appended here. |
| deleted_at | TIMESTAMP | Nullable. Soft-delete marker. All list queries filter WHERE deleted_at IS NULL. |
| created_at | TIMESTAMP | Default: NOW() |
| updated_at | TIMESTAMP | On update: NOW() |

### quotes
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT PK | |
| lead_id | INT FK → leads.id | |
| description | TEXT | Summary of work |
| line_items | JSON | Array of {item, qty, unit_price} |
| subtotal | DECIMAL(10,2) | |
| tax_rate | DECIMAL(5,4) | e.g., 0.0731 for 7.31% |
| tax_amount | DECIMAL(10,2) | |
| total | DECIMAL(10,2) | |
| status | ENUM('draft', 'sent', 'accepted', 'declined') | Default: 'draft' |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### jobs
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT PK | |
| lead_id | INT FK → leads.id | |
| quote_id | INT FK → quotes.id | |
| title | VARCHAR(255) | |
| description | TEXT | |
| address | TEXT | Job site address |
| status | ENUM('scheduled', 'in_progress', 'completed', 'cancelled') | Default: 'scheduled' |
| deleted_at | TIMESTAMP | Nullable. Soft-delete marker. |
| start_date | DATE | |
| end_date | DATE | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### schedule
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT PK | |
| job_id | INT FK → jobs.id | |
| date | DATE | |
| start_time | TIME | |
| end_time | TIME | |
| notes | TEXT | |
| created_at | TIMESTAMP | Default: NOW() |
| updated_at | TIMESTAMP | On update: NOW() |

### invoices
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT PK | |
| job_id | INT FK → jobs.id | |
| quote_id | INT FK → quotes.id | |
| lead_id | INT FK → leads.id | |
| invoice_number | VARCHAR(20) | Application-level: format `INV-` + zero-padded id (e.g., INV-0001). Generated on insert from the auto-increment id. |
| line_items | JSON | Array of {item, qty, unit_price} |
| subtotal | DECIMAL(10,2) | |
| tax_rate | DECIMAL(5,4) | |
| tax_amount | DECIMAL(10,2) | |
| total | DECIMAL(10,2) | |
| status | ENUM('draft', 'sent', 'paid', 'overdue') | Default: 'draft' |
| due_date | DATE | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### payments
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT PK | |
| invoice_id | INT FK → invoices.id | |
| amount | DECIMAL(10,2) | |
| method | ENUM('cash', 'check') | |
| check_number | VARCHAR(50) | Nullable, only for checks |
| notes | TEXT | |
| payment_date | DATE | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | On update: NOW() |

## CRM Pages

### Dashboard (`/admin/dashboard`)
- Summary cards: new leads count, active jobs, outstanding invoices, revenue this month
- Recent activity: latest leads, upcoming jobs, overdue invoices

### Leads (`/admin/leads`)
- Table view with search and status filter
- Click to open lead detail: all info, notes editor, status changer
- "Create Quote" button on lead detail

### Quotes (`/admin/quotes`)
- List view with status filter
- Quote builder: add/remove line items (description, qty, unit price), auto-calc subtotal/tax/total
- Generate downloadable/printable PDF
- Status actions: mark sent, accepted (auto-creates job), declined

### Jobs (`/admin/jobs`)
- List view with status filter
- Job detail: linked lead, quote, address, schedule entries
- Status progression: scheduled → in_progress → completed
- Completing a job prompts invoice creation

### Schedule (`/admin/schedule`)
- Monthly calendar view
- Jobs displayed on their scheduled dates, color-coded by status
- Click date to add/edit schedule entries

### Invoices (`/admin/invoices`)
- List view with status filter (draft, sent, paid, overdue)
- Invoice detail: auto-populated from quote line items
- Generate branded PDF (NextLevel logo, colors, company info)
- "Record Payment" button

### Finances (`/admin/finances`)
- Revenue summary: monthly, quarterly, yearly totals
- Payment history log
- Outstanding balance total
- Monthly revenue bar chart

### Admin Layout
- Sidebar navigation with links to all CRM sections
- Header with "Back to Site" link and logout button
- Styled to match existing site: dark blues (#0f4c81), gold accent (#f0a500), Poppins font
- Clean admin aesthetic — white content area, colored sidebar

## API Endpoints

All under `/api`. JWT required unless noted.

### Auth
- `POST /api/login` — public. Body: {username, password}. Returns: {token}
- `GET /api/me` — verify token, return admin info

### Leads
- `POST /api/leads` — **public**, rate-limited (10 req/min per IP). Called by frontend forms. Creates lead with source. Field mapping: contact form `user_name`→`name`, `user_email`→`email`, `user_number`→`phone`; commercial form extras go into `notes`; career form extras go into `notes`.
- `GET /api/leads` — list with query params: status, search, page, limit
- `GET /api/leads/:id` — single lead with related quotes/jobs/invoices
- `PUT /api/leads/:id` — update status, notes
- `DELETE /api/leads/:id` — soft delete (add deleted_at column)

### Quotes
- `POST /api/quotes` — create from lead_id
- `GET /api/quotes` — list with filters
- `GET /api/quotes/:id` — detail
- `PUT /api/quotes/:id` — update line items, status
- `DELETE /api/quotes/:id` — hard delete (only allowed if status is 'draft', no linked jobs)

### Jobs
- `POST /api/jobs` — create from accepted quote
- `GET /api/jobs` — list with filters
- `GET /api/jobs/:id` — detail with schedule entries
- `PUT /api/jobs/:id` — update status, details
- `DELETE /api/jobs/:id` — soft delete

### Schedule
- `GET /api/schedule` — entries by date range
- `POST /api/schedule` — add entry to job
- `PUT /api/schedule/:id` — edit entry
- `DELETE /api/schedule/:id`

### Invoices
- `POST /api/invoices` — create from job
- `GET /api/invoices` — list with filters
- `GET /api/invoices/:id` — detail
- `PUT /api/invoices/:id` — update status
- `GET /api/invoices/:id/pdf` — generate and return PDF

### Quote PDFs
- `GET /api/quotes/:id/pdf` — generate and return quote PDF

### Payments
- `POST /api/payments` — record payment against invoice
- `GET /api/payments` — list with filters

### Finances
- `GET /api/finances/summary` — revenue totals by period
- `GET /api/finances/monthly` — monthly breakdown for chart

## Form Integration

Existing forms (ContactForm.jsx, Commercial.jsx) continue sending via EmailJS as they do today. After the EmailJS send succeeds, an additional `POST /api/leads` call is made with the same form data plus the `source` field.

- EmailJS remains the primary notification mechanism
- API call is secondary — if it fails, the email still goes through
- Career form (Formspree) also gets an API call added
- Source field tracks origin: `contact_form`, `commercial_form`, `career_form`

## PDF Generation

Server-side PDF generation using `pdfkit` (Node.js library).

### Quote PDF
- NextLevel logo and company info header
- Client name, email, phone, address
- Line items table: description, qty, unit price, line total
- Subtotal, tax, total
- Terms and conditions footer

### Invoice PDF
- Same layout as quote
- Invoice number (INV-XXXX) and due date
- Payment instructions (check payable to, mailing address)
- Status watermark for paid invoices

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Styled Components |
| Backend | Express.js, Node.js |
| Database | MySQL |
| Auth | JWT + bcrypt |
| PDF | pdfkit (new dependency) |
| Rate Limiting | express-rate-limit (new dependency) |
| Proxy | Nginx |
| Hosting | EC2 (13.59.87.37) |
| Forms | EmailJS + API dual-send |

## Deployment

Single deploy process:
1. `npm run build` — builds React app (public site + CRM)
2. SCP build folder + server files to EC2
3. Express server runs via PM2 (process manager) on port 4242
4. Nginx serves static files and proxies API requests
5. MySQL runs locally on the EC2 instance
