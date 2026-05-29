# Design — Document E-Signature, v1

**Status:** Approved across all sections (architecture, data model, API, UI, security) — pending spec review
**Author:** Bo Shao (with Claude)
**Date:** 2026-05-14

## Goal

Add a DocuSign-like flow to the admin panel: Bo uploads a PDF, drag-and-drops signature / initials / date / text fields onto pages, enters one recipient's email, and sends. The customer opens a tokenized link in their browser (no login), explicitly consents, fills the fields, draws or types a signature, and submits. The server stamps the signed PDF and stores it alongside a complete audit trail. The signed PDF is downloadable by both parties.

## Phased decomposition (this spec covers Phase 1 only)

| Phase | What | Status |
|---|---|---|
| **1 (this spec)** | Single signer, one-off upload, drag-and-drop fields, consent + signed PDF + audit | In design |
| 2 | Reusable templates with pre-positioned fields | Future |
| 3 | Drag-and-drop polish (alignment guides, copy/paste, undo) | Future |
| 4 | Multi-signer routing, initials-per-page, reminders, expiry, webhooks | Future |

Each phase is its own spec → plan → ship cycle. Nothing in Phase 1 forecloses any later phase.

## Architecture

**Two-stage UI:**
1. **Author view (Bo, admin):** PDF rendered with `pdfjs-dist` in browser. Click a field-type chip in the toolbar, click a position on the PDF to drop a field box. Boxes are draggable + resizable. Recipient name/email on a side panel. "Send for Signature" wires it all together.
2. **Signer view (customer, public, token-gated):** Same `pdfjs-dist` rendering. Consent gate first. Tappable fields open an inline input or a signature modal (typed in script font OR drawn on canvas via `signature_pad`). Sticky bottom bar tracks completion. Final submit hits the server.

**Server signing:** `pdf-lib` (pure-JS Node lib) reads the original PDF, stamps each filled field's content at its normalized `(page, x, y)` coordinates × the actual page dimensions, and writes a flat signed PDF to disk. Appends an auto-generated "Certificate of Completion" page summarizing the audit trail.

**Storage:** PDFs in `/var/lib/nextlevel/documents/` on EC2 (outside nginx static root). Two files per doc: `<id>-original.pdf` and `<id>-signed.pdf`. Streamed via API with auth (admin routes) or token check (signer routes).

**Email:** Reuses the existing Resend setup (`server/services/email.js`). New builder `buildSigningEmail(doc, token)`.

**Tech additions:**
- `pdfjs-dist` (client) — PDF page rendering for both author and signer views
- `pdf-lib` (server) — PDF stamping + certificate-page generation
- `multer` (server) — multipart upload middleware
- `signature_pad` (client) — drawn-signature canvas

**Lifecycle:** Draft → Sent → Viewed → Signed (terminal). Voided (terminal) at any non-terminal state.

**Rejected alternatives:**
- Client-side PDF stamping → weaker tamper evidence; harder to keep file in single canonical place.
- S3 storage → premature for current volume (EBS 20 GB, 36 % used; 25 MB cap × realistic volume well under any limit).
- Coordinate-input field placement → trash UX.

## Data model

Four new tables. All migrations follow the `information_schema`-guarded idempotent pattern used in `005_add_trailer_trips.sql` / `006_payroll_inventory.sql`. SQL below is the **logical schema**; the actual migration file wraps each `CREATE TABLE` / `ALTER` in an `IF (SELECT COUNT(*) FROM information_schema.…) = 0` guard.

### `documents`
```sql
CREATE TABLE documents (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  title             VARCHAR(200) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path         VARCHAR(500) NOT NULL,         -- absolute path on EC2 disk
  signed_file_path  VARCHAR(500) NULL,
  file_hash         CHAR(64) NOT NULL,             -- sha256 hex of original PDF
  recipient_name    VARCHAR(120) NULL,
  recipient_email   VARCHAR(255) NOT NULL,
  sign_token        CHAR(64) NOT NULL UNIQUE,      -- crypto.randomBytes(32).toString('hex')
  status            ENUM('draft','sent','viewed','signed','voided') NOT NULL DEFAULT 'draft',
  created_by        VARCHAR(64) NOT NULL,
  notes             TEXT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at           TIMESTAMP NULL,
  viewed_at         TIMESTAMP NULL,
  signed_at         TIMESTAMP NULL,
  voided_at         TIMESTAMP NULL,
  INDEX (status, created_at),
  INDEX (recipient_email)
);
```

### `document_fields` (placement set by Bo before sending)
```sql
CREATE TABLE document_fields (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  document_id INT NOT NULL,
  page        INT NOT NULL,                        -- 1-indexed
  field_type  ENUM('signature','initials','date','text') NOT NULL,
  x           DECIMAL(8,4) NOT NULL,               -- normalized 0..1 of page width
  y           DECIMAL(8,4) NOT NULL,               -- normalized 0..1 of page height
  w           DECIMAL(8,4) NOT NULL,
  h           DECIMAL(8,4) NOT NULL,
  required    TINYINT(1) NOT NULL DEFAULT 1,
  label       VARCHAR(80) NULL,                    -- hint text for text fields ("Color choice")
  sort_order  INT NOT NULL DEFAULT 0,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  INDEX (document_id, page, sort_order)
);
```

Normalized 0..1 coords keep us PDF-page-size-independent — at stamp time we multiply by the actual page dimensions reported by `pdf-lib`.

### `document_field_values` (filled in by the signer)
```sql
CREATE TABLE document_field_values (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  field_id    INT NOT NULL,
  value_text  TEXT NULL,                           -- typed text, date string, typed signature name
  value_image LONGTEXT NULL,                       -- data:image/png;base64,... for drawn signature
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_field (field_id),
  FOREIGN KEY (field_id) REFERENCES document_fields(id) ON DELETE CASCADE
);
```

Drawn signature PNG data URLs typically 5–20 KB; LONGTEXT is plenty. Move to disk-backed storage if a future phase needs it.

### `document_events` (audit log)
```sql
CREATE TABLE document_events (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  document_id INT NOT NULL,
  event_type  ENUM('sent','viewed','consent_given','signed','voided','resent') NOT NULL,
  ip          VARCHAR(45) NULL,                    -- IPv4/v6 (express trust-proxy already set)
  user_agent  VARCHAR(500) NULL,
  detail      JSON NULL,                           -- consent text, signed hash, etc.
  occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  INDEX (document_id, occurred_at)
);
```

### YAGNI'd

- No `document_signers` table (one signer embedded; multi-signer is Phase 4).
- No `document_templates` table (Phase 2).
- No expiry timestamp / reminders schedule (Phase 4).
- No second `signed_file_hash` column on `documents` — lives in the `signed` event's JSON for simplicity.

## API surface

Two routers because the signer flow needs different middleware than admin.

### Admin — `server/routes/documents.js` (behind `authenticate + requireRole(['admin'])`)

| Method | Path | Behavior |
|---|---|---|
| POST | `/api/documents` | Multipart upload (`multer`). Stream to disk under `/var/lib/nextlevel/documents/<id>-original.pdf` (rename after id assigned), compute sha256, insert row with `status='draft'` and a freshly generated `sign_token`. Returns `{ id, title, status, file_hash }`. |
| GET | `/api/documents` | List with filters: `status`, `q` (recipient_email LIKE), `page`, `limit`. Default `ORDER BY created_at DESC`. |
| GET | `/api/documents/:id` | Full row + `fields[]` + `events[]` + (when present) `values[]`. |
| GET | `/api/documents/:id/file` | Streams original PDF. |
| GET | `/api/documents/:id/signed-file` | Streams signed PDF; 404 if not signed yet. |
| PUT | `/api/documents/:id` | Update `title`, `recipient_name`, `recipient_email`, `notes`. Returns 409 unless `status='draft'`. |
| PUT | `/api/documents/:id/fields` | Body: `{ fields: [{page, field_type, x, y, w, h, required, label, sort_order}] }`. Full-replace. Returns 409 unless `status='draft'`. Transaction: DELETE existing, INSERT new. |
| POST | `/api/documents/:id/send` | Validates: at least one `signature` field present; `recipient_email` set and well-formed; `status='draft'`. Sets `status='sent'`, `sent_at=NOW()`; logs `sent` event. Sends Resend email with `https://nextlevelepoxynm.com/sign/<sign_token>`. Failure to send email → row still in `sent` status, surface a banner in admin asking Bo to `resend`. |
| POST | `/api/documents/:id/resend` | Allowed when `status IN ('sent','viewed')`. Re-fires email; logs `resent` event. |
| POST | `/api/documents/:id/void` | Allowed when `status IN ('draft','sent','viewed')`. Sets `status='voided'`, `voided_at=NOW()`; logs event. Terminal in v1 — to re-issue, Bo creates a new doc. |
| DELETE | `/api/documents/:id` | Allowed only when `status='draft'`. Cascading delete (FKs handle children) + `unlink` of file. |

### Signer — `server/routes/sign.js` (no auth; rate-limited via a new `signLimiter` mirroring `leadLimiter`)

| Method | Path | Behavior |
|---|---|---|
| GET | `/api/sign/:token` | Resolves token → doc. Returns `title`, `recipient_name`, `status`, `fields[]` (no admin fields). On first call per token, if `status='sent'`, set `status='viewed'`, `viewed_at=NOW()`, log `viewed` event. Returns 410 if `voided`. |
| GET | `/api/sign/:token/file` | Streams original PDF. |
| POST | `/api/sign/:token/consent` | Body: `{ agreement_text }`. Server stores a `consent_given` event with `detail = { agreement_text, ip, user_agent }`. Required before submit. |
| POST | `/api/sign/:token/values` | Body: `{ values: [{ field_id, value_text?, value_image? }] }`. Upserts (unique constraint enforces 1 row per field). Validates each `field_id` belongs to this doc. Can be called many times (partial / progressive save). |
| POST | `/api/sign/:token/submit` | Transaction: verify all `required=1` fields have non-empty values + a `consent_given` event exists. Stamp signed PDF via `pdf-lib` → write to `<id>-signed.pdf`, hash it. Set `signed_file_path`, `status='signed'`, `signed_at=NOW()`. Log `signed` event with `detail = { signed_sha256 }`. Returns `{ signed_file_url: '/api/sign/<token>/signed-file' }`. Idempotent: 409 if already `signed`. |
| GET | `/api/sign/:token/signed-file` | Streams signed PDF; 404 if not signed. |

### Cross-cutting

- All public routes return generic `{ error: '...' }` (no info leak).
- `req.ip` already trustworthy (memory: trust-proxy fixed in `server/index.js`).
- Email reuses `server/services/email.js`. New builder: `buildSigningEmail({ doc, signUrl })`.
- New `signLimiter`: 30 req/min/IP, same pattern as `leadLimiter`.
- Multer config: `limits.fileSize = 25 * 1024 * 1024`; `fileFilter` accepts only `mimetype === 'application/pdf'` AND first 4 bytes `%PDF`.

## UI

### Admin sidebar
One new item, admin-only: **Documents** (icon: `FiFileText`).

### `src/admin/Documents.jsx` — list page (`/admin/documents`)
- Top bar: status filter pills (All / Draft / Sent / Viewed / Signed / Voided), search by recipient email, "+ New Document" button.
- Table: Title | Recipient | Status badge | Created | Last activity | Actions.
- Row click → `/admin/documents/:id`.
- "+ New" → opens a modal with a drag-and-drop file picker; on file dropped, POST `/api/documents` then navigate to the new doc's editor.

### `src/admin/DocumentEditor.jsx` — single-doc page (`/admin/documents/:id`)

State-aware layout. The right rail content swaps based on `status`.

**`status === 'draft'`:**
- **Left (PDF + field overlay):** `pdfjs-dist` renders all pages in a vertical scroll. A floating toolbar above the canvas shows chips: `Signature` / `Initials` / `Date` / `Text`. Clicking a chip puts the cursor into "place" mode; clicking a position on any page drops a default-sized field box there (200×60 px ≈ normalized via current page render scale). Boxes are draggable + resizable + deletable. Each shows its field type label.
- **Right rail:** Title input, Recipient name + email, Notes textarea (internal), validation summary ("✓ 1 signature field placed", "✗ Recipient email required"), primary "Send for Signature" button. Disabled until at least one `signature` field exists + recipient_email present.
- **Auto-save:** title/recipient/notes auto-save on blur (PUT `/api/documents/:id`). Field placement auto-saves debounced 500 ms after any change (PUT `/api/documents/:id/fields`, full-replace). Loading indicator in the rail.

**`status === 'sent' | 'viewed'`:**
- **Left:** PDF preview with ghosted field boxes (no editing).
- **Right rail:** Status timeline (each event with IP + UA + timestamp), recipient details read-only, "Resend email" + "Void" buttons. No editor.

**`status === 'signed'`:**
- **Left:** Signed PDF preview.
- **Right rail:** Full timeline, "Download signed PDF" button, audit-trail panel ("Original SHA256: …", "Signed SHA256: …"). No void.

**`status === 'voided'`:**
- Banner "This document was voided on May 14". All inputs disabled.

### Public signer flow — `src/public/SignDocument.jsx` (route `/sign/:token`, no admin layout)

Three-step wizard, single-page:

1. **Consent panel** — modal-style intro card centered on a clean background: doc title, "From Next Level Epoxy Flooring", short explanation, large checkbox with the legal agreement text, big primary "I agree — start signing" button. POST `/api/sign/:token/consent` on click; then proceed.
2. **Fill + sign** — PDF renders full-width. Field boxes are clickable. Tapping a Text/Date field opens an inline input; the Date field defaults to today and is editable. Tapping a Signature/Initials field opens a tabbed modal: **Type** (renders the typed name in a script font like "Dancing Script") vs **Draw** (canvas via `signature_pad`, height 200, full width of modal). On "Adopt", the modal captures the rendered image as a data URL, closes, and the field box shows the signature preview. Each value POSTs individually (progressive save).
3. **Finish** — sticky bottom bar: "X of Y fields complete · Finish & Sign". Disabled until all required fields valued. On click → POST `/api/sign/:token/submit` → on success, navigate to `/signed/:token`.

### `src/public/Signed.jsx` — confirmation (`/signed/:token`, no admin layout)
✓ icon, "You signed [Doc Title]", brief copy ("A copy was emailed to you"), big "Download signed PDF" button → GET `/api/sign/:token/signed-file`. No expiry message in v1.

### Signer's email
After Bo clicks "Send for Signature":
- Subject: `[Doc Title] — please sign at your convenience`
- Body matches the existing Bo-first-person voice (memory: `feedback_email_voice.md`): brief intro, CTA button to `/sign/<token>`, plain link beneath. Sign-off "— Bo, Next Level Epoxy Flooring".

### Out of scope for v1 UI
- Email notification to Bo when a doc is signed (Bo refreshes `/admin/documents`).
- Bulk send.
- Template library page.

## Security, legal, ops

### Token security
- 256-bit random via `crypto.randomBytes(32).toString('hex')` (64 hex chars). Brute-force is not on the table.
- Token valid for life of doc; allows the signer to redownload signed PDF later.
- `POST /api/sign/:token/submit` is idempotent — returns 409 after `status='signed'`.
- `void` doesn't rotate the token; subsequent `/api/sign/:token*` calls return 410.

### File access
- Storage: `/var/lib/nextlevel/documents/` — **outside** nginx's static root. Nginx never serves these files directly.
- Admin file routes require `authenticate + requireRole(['admin'])`.
- Public file routes require token resolution + non-voided status.
- Directory created idempotently on app start: `mkdir -p` with mode `0750`, owned `ubuntu:ubuntu`. Files mode `0640`. Initializer lives in `server/util/documentStorage.js`.

### Upload validation
- `multer` `limits.fileSize: 25 * 1024 * 1024` (25 MB).
- `fileFilter` rejects unless **both** `req.file.mimetype === 'application/pdf'` AND the first 4 bytes of the buffer (read on disk after multer writes) equal `%PDF`. Content-Type alone is forgeable; the magic-number check is the real gate.
- Original filename used only for `title` default and `original_filename` column — never as a filesystem path.

### Rate limits
- New `signLimiter`: 30 req/min/IP applied to every `/api/sign/*` route (express-rate-limit, same pattern as `leadLimiter`).
- Admin routes covered by existing limiters.

### Tamper evidence
- `documents.file_hash` = sha256 of the original PDF at upload.
- After signing, signed-PDF sha256 stored in the `signed` event's `detail` JSON (`{ signed_sha256: "..." }`).
- Audit panel in the editor shows both hashes side-by-side.
- An auto-appended **Certificate of Completion** is the final page of the signed PDF, generated server-side via `pdf-lib`. Contents: doc title, signer name + email, consent timestamp + IP, signing timestamp + IP, original SHA256, signed SHA256 (computed after the certificate page is composed — so this value is from a "pre-certificate" hash; the value the certificate displays is the *original* hash and the *post-stamp-pre-cert* hash; the cert page itself is then appended and the final-signed-hash recorded in the event row). This evidence travels with the PDF so it's portable without admin access.

### Legal compliance (ESIGN Act / UETA — bare-minimum-but-real)
v1 captures the four required elements:

1. **Consent** — explicit checkbox + agreement text persisted into the `consent_given` event's `detail` JSON. Default agreement text:
   > *"I agree to use an electronic signature for this document. I understand my electronic signature is legally binding and equivalent to a handwritten signature."*
2. **Intent** — "Adopt and sign" click in the signature modal AND the final "Finish & Sign" submit click both fire distinct events.
3. **Attribution** — IP + user-agent on each signing event; recipient email tied to doc at creation; signer's typed/drawn name stamped into the signed PDF and certificate.
4. **Retention** — signed PDF and every audit row retained indefinitely; admin can download a complete record.

### Ops
- Storage directory created idempotently on server boot.
- Backup: out of scope (existing EBS snapshot rotation, if any, covers `/var/lib/`).
- Disk monitoring: out of scope for v1; realistic 1-year volume = 50–200 docs × 5 MB avg = ≤ 1 GB.
- Out-of-band: a one-time deploy step needs to `sudo mkdir /var/lib/nextlevel && sudo chown ubuntu:ubuntu /var/lib/nextlevel` since the app user (ubuntu) can't create the path otherwise. This is a manual ops step documented in the deploy README; the app-side initializer only creates `documents/` underneath.

### Out of scope altogether (not deferred — never)
- KBA / phone OTP / ID verification (would require a third-party identity provider; v1 is good-faith e-sign).

## File touch list

**New backend:**
- `server/db/migrations/007_documents.sql` — the four-table migration
- `server/util/documentStorage.js` — directory initializer, path builders, hash helper
- `server/routes/documents.js` — admin CRUD + send/resend/void
- `server/routes/sign.js` — public signer flow
- `server/services/email.js` — add `buildSigningEmail` + `sendSigningInvitation` exports

**New frontend:**
- `src/admin/Documents.jsx` — list page
- `src/admin/DocumentEditor.jsx` — single-doc editor (covers all four `status` views)
- `src/admin/DocumentUploadModal.jsx` — the "+ New" modal
- `src/public/SignDocument.jsx` — signer wizard
- `src/public/Signed.jsx` — confirmation page
- `src/components/PdfPreview.jsx` — shared `pdfjs-dist` wrapper (used by editor + signer)
- `src/components/SignatureModal.jsx` — shared typed/drawn signature capture (used by signer; potentially by editor for visual demo)

**Modified backend:**
- `server/index.js` — mount the two new routers; create document storage on boot
- `package.json` — add `multer`, `pdf-lib`

**Modified frontend:**
- `src/App.js` — register `/admin/documents`, `/admin/documents/:id`, `/sign/:token`, `/signed/:token`
- `src/admin/AdminLayout.jsx` — add "Documents" sidebar item (admin only)
- `package.json` — add `pdfjs-dist`, `signature_pad`

## Implementation strategy

Three PRs behind a single migration:

1. **Backend + admin list/editor scaffold** — migration + storage util + admin routes + upload modal + list page + editor in `draft` state only (no field placement yet, no send). Smoke-test upload + edit.
2. **Field placement + send** — drag-and-drop field overlay on the editor's draft view + `PUT /fields` + `/send` + Resend email integration. Editor handles `sent`/`viewed` read-only views. Smoke-test sending an email to yourself.
3. **Signer flow + signing + audit** — `/api/sign/*` router + `SignDocument.jsx` + `Signed.jsx` + `pdf-lib` stamping + certificate page + the signed/voided editor views. Smoke-test end-to-end (upload → place → send → open in incognito → consent → sign → verify signed PDF).

Each PR is reversible; the migration runs once on PR 1.

## Testing

Repo's automated test infra is minimal (Jest from CRA + the one halfStep test). Add:
- `server/util/documentStorage.test.js` (node:test or jest) — path-building, hash function (pure)
- Manual smoke-test checklist at the bottom of each PR description

Deferred: end-to-end signing automation (Playwright), pdf-lib stamping snapshot tests.

## Open questions for implementation (do NOT block spec approval; flag during planning)

- Which Google Font for typed signatures? Default "Dancing Script" (free, well-known).
- pdfjs-dist worker bundling under CRA — known to be quirky; may need `pdfjs-dist/legacy/build/pdf.worker.entry`.
- Certificate-of-completion page layout — pure pdf-lib text drawing or use the existing PDF template? Recommend pdf-lib programmatic to avoid maintaining a fixture PDF.

## Skills used

- `superpowers:brainstorming` — drove this spec.
- `superpowers:writing-plans` — next step after user approval of spec.
- `superpowers:subagent-driven-development` — execution path after the plan is written.
