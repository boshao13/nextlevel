/**
 * Resend transactional email wrapper.
 *
 * Two outbound emails per lead:
 *   1. sendLeadNotification(lead) — internal alert to LEAD_TO_EMAIL
 *   2. sendCustomerConfirmation(lead) — branded auto-reply to the customer
 *
 * Both fail soft: the lead always lands in the DB even if either send errors.
 *
 * Required env vars:
 *   RESEND_API_KEY    — from https://resend.com/api-keys
 *   LEAD_FROM_EMAIL   — must be on a domain verified in Resend
 *   LEAD_TO_EMAIL     — where internal lead notifications go
 */

const { Resend } = require('resend');

let resend = null;
function client() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const BRAND = {
  primary: '#0f4c81',
  primaryDark: '#0a3962',
  text: '#1a1a2e',
  muted: '#6b7280',
  bg: '#f5f8fc',
  card: '#ffffff',
  border: '#eef2f6',
  logo: 'https://www.nextlevelepoxynm.com/nextlevellogo.png',
  phone: '505-352-4674',
  phoneHref: 'tel:5053524674',
  site: 'https://www.nextlevelepoxynm.com',
  instagram: 'https://www.instagram.com/nextlevelepoxynm',
};

// Per-source presentation (internal-email badge + customer-email copy)
const SOURCES = {
  contact_form: {
    label: 'Residential Lead',
    badge: 'RESIDENTIAL',
    accent: '#0f4c81',        // brand blue
    customerSubject: 'Got your message — Bo at Next Level Epoxy',
    customerHeadline: 'Thanks — I\'ll be in touch shortly.',
    customerBody:
      'I usually call back <strong>within the hour</strong> during business hours, and never more than a few ' +
      'hours either way. I\'ll grab a few quick details from you and lock in a time for your free in-home ' +
      'estimate that works around your schedule.',
    customerNext:
      'Keep an eye on your phone — <strong>I\'ll be giving you a call shortly</strong>. Thanks so much for reaching out.',
  },
  commercial_form: {
    label: 'Commercial Lead',
    badge: 'COMMERCIAL',
    accent: '#0a3962',        // deeper navy
    customerSubject: 'Got your commercial inquiry — Bo at Next Level Epoxy',
    customerHeadline: 'Thanks — I got your commercial inquiry.',
    customerBody:
      'I\'ll reach out within <strong>24 hours</strong> to talk through your project. We install heavy-duty ' +
      'polyaspartic and epoxy systems for warehouses, restaurants, auto shops, and industrial facilities ' +
      'across New Mexico.',
    customerNext:
      'For larger jobs I usually do a site visit and prep evaluation before quoting. I\'ll bring photos of ' +
      'similar installs to our meeting so you can see real outcomes.',
  },
  garage_makeover_form: {
    label: 'Garage Makeover Lead',
    badge: 'GARAGE MAKEOVER',
    accent: '#b45309',        // amber — distinct from residential blue
    customerSubject: 'Got your garage makeover request — Bo at Next Level Epoxy',
    customerHeadline: 'Thanks — I\'ll be in touch shortly.',
    customerBody:
      'I usually call back <strong>within the hour</strong> during business hours, and never more than a few ' +
      'hours either way. I\'ll grab a few quick details from you and lock in a time for your free in-home ' +
      'estimate so we can walk through your garage and pick the right makeover package.',
    customerNext:
      'Keep an eye on your phone — <strong>I\'ll be giving you a call shortly</strong>. Thanks so much for reaching out about your garage.',
  },
  career_form: {
    label: 'Career Inquiry',
    badge: 'CAREERS',
    accent: '#3a7d44',        // green — distinct from lead colors
    customerSubject: 'Got your application — Bo at Next Level Epoxy',
    customerHeadline: 'Thanks for reaching out.',
    customerBody:
      'I got your inquiry and I\'ll review it this week. We hire installers, helpers, and crew across ' +
      'Albuquerque, Santa Fe, and the surrounding service area — and I keep every inquiry on file ' +
      'whether or not we\'re actively hiring.',
    customerNext:
      'If there\'s a fit with our crew needs, I\'ll get back to you within <strong>a few business days</strong> ' +
      'to set up a quick call. Otherwise I\'ll hang on to your info for the next opening.',
  },
};

function sourceFor(s) {
  return SOURCES[s] || SOURCES.contact_form;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// Shared chrome — header bar (logo + colored stripe) and footer (address, social)
function headerHtml(src) {
  return `
    <div style="background:#ffffff;padding:24px 28px 18px;border-bottom:4px solid ${src.accent};text-align:center;">
      <img src="${BRAND.logo}" alt="Next Level Epoxy Flooring" width="220" style="max-width:220px;height:auto;display:inline-block;" />
    </div>`;
}

function footerHtml() {
  return `
    <div style="padding:22px 28px;background:#fafbfd;border-top:1px solid ${BRAND.border};color:${BRAND.muted};font-size:.8rem;line-height:1.6;text-align:center;">
      <div style="margin-bottom:8px;">
        <a href="${BRAND.phoneHref}" style="color:${BRAND.primary};text-decoration:none;font-weight:600;">${BRAND.phone}</a>
        &nbsp;·&nbsp;
        <a href="${BRAND.site}" style="color:${BRAND.primary};text-decoration:none;">nextlevelepoxynm.com</a>
        &nbsp;·&nbsp;
        <a href="${BRAND.instagram}" style="color:${BRAND.primary};text-decoration:none;">@nextlevelepoxynm</a>
      </div>
      <div style="font-size:.72rem;color:#9aa3b2;">Lifetime warranty · 560+ floors installed · Albuquerque · Santa Fe · Rio Rancho</div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Internal lead notification (to LEAD_TO_EMAIL)
// ---------------------------------------------------------------------------
function buildLeadEmail(lead) {
  const src = sourceFor(lead.source);
  const safe = (v) => escapeHtml(v || '—');
  const subject = `New ${src.label}: ${lead.name}`;

  const html = `
<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:${BRAND.bg};margin:0;padding:32px 16px;color:${BRAND.text};">
  <div style="max-width:600px;margin:0 auto;background:${BRAND.card};border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06);">
    ${headerHtml(src)}
    <div style="background:${src.accent};color:#fff;padding:18px 28px;">
      <div style="font-size:.72rem;font-weight:700;letter-spacing:.16em;opacity:.85;">${src.badge} LEAD</div>
      <div style="font-size:1.5rem;font-weight:800;margin-top:4px;">${safe(lead.name)}</div>
    </div>
    <div style="padding:24px 28px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;color:${BRAND.muted};font-size:.85rem;width:130px;">Email</td>
            <td style="padding:8px 0;font-weight:600;">${lead.email ? `<a href="mailto:${safe(lead.email)}" style="color:${BRAND.primary};text-decoration:none;">${safe(lead.email)}</a>` : '—'}</td></tr>
        <tr><td style="padding:8px 0;color:${BRAND.muted};font-size:.85rem;">Phone</td>
            <td style="padding:8px 0;font-weight:600;">${lead.phone ? `<a href="tel:${safe(lead.phone)}" style="color:${BRAND.primary};text-decoration:none;">${safe(lead.phone)}</a>` : '—'}</td></tr>
        ${lead.area_desired ? `<tr><td style="padding:8px 0;color:${BRAND.muted};font-size:.85rem;vertical-align:top;">Area / Project</td>
            <td style="padding:8px 0;white-space:pre-wrap;">${safe(lead.area_desired)}</td></tr>` : ''}
        ${lead.notes ? `<tr><td style="padding:8px 0;color:${BRAND.muted};font-size:.85rem;vertical-align:top;">Notes</td>
            <td style="padding:8px 0;white-space:pre-wrap;">${safe(lead.notes)}</td></tr>` : ''}
      </table>
      ${lead.email ? `<div style="margin-top:22px;">
        <a href="mailto:${safe(lead.email)}" style="display:inline-block;background:${src.accent};color:#fff;padding:11px 22px;border-radius:999px;text-decoration:none;font-weight:700;font-size:.9rem;">Reply to ${escapeHtml(lead.name.split(' ')[0] || 'customer')}</a>
      </div>` : ''}
      <div style="margin-top:24px;padding-top:18px;border-top:1px solid ${BRAND.border};font-size:.78rem;color:${BRAND.muted};">
        Lead #${safe(lead.id)} · <a href="${BRAND.site}/admin/leads/${safe(lead.id)}" style="color:${BRAND.primary};">open in CRM</a>
      </div>
    </div>
    ${footerHtml()}
  </div>
</body></html>`.trim();

  const text = [
    `New ${src.label}`,
    `Name:  ${lead.name || ''}`,
    `Email: ${lead.email || ''}`,
    `Phone: ${lead.phone || ''}`,
    lead.area_desired ? `Area:  ${lead.area_desired}` : null,
    lead.notes ? `Notes: ${lead.notes}` : null,
    '',
    `CRM: ${BRAND.site}/admin/leads/${lead.id}`,
  ].filter(Boolean).join('\n');

  return { subject, html, text };
}

// ---------------------------------------------------------------------------
// Customer confirmation (to lead.email)
// ---------------------------------------------------------------------------
function buildCustomerEmail(lead) {
  const src = sourceFor(lead.source);
  const safe = (v) => escapeHtml(v || '—');
  const firstName = (lead.name || '').split(' ')[0] || 'there';

  const html = `
<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:${BRAND.bg};margin:0;padding:32px 16px;color:${BRAND.text};">
  <div style="max-width:600px;margin:0 auto;background:${BRAND.card};border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06);">
    ${headerHtml(src)}
    <div style="padding:32px 28px 12px;text-align:center;">
      <div style="font-size:.7rem;font-weight:700;letter-spacing:.18em;color:${src.accent};">${src.badge}</div>
      <h1 style="font-size:1.7rem;font-weight:800;margin:10px 0 0;line-height:1.25;">${escapeHtml(src.customerHeadline)}</h1>
    </div>
    <div style="padding:8px 28px 4px;font-size:1rem;line-height:1.65;color:${BRAND.text};">
      <p style="margin:14px 0;">Hi ${escapeHtml(firstName)},</p>
      <p style="margin:14px 0;">${src.customerBody}</p>
    </div>
    <div style="padding:14px 28px;">
      <div style="background:${BRAND.bg};border-radius:10px;padding:18px 22px;">
        <div style="font-size:.72rem;font-weight:700;letter-spacing:.14em;color:${BRAND.muted};margin-bottom:8px;">YOUR SUBMISSION</div>
        <table style="width:100%;border-collapse:collapse;font-size:.92rem;">
          <tr><td style="padding:5px 0;color:${BRAND.muted};width:90px;">Name</td><td style="padding:5px 0;font-weight:600;">${safe(lead.name)}</td></tr>
          ${lead.email ? `<tr><td style="padding:5px 0;color:${BRAND.muted};">Email</td><td style="padding:5px 0;">${safe(lead.email)}</td></tr>` : ''}
          ${lead.phone ? `<tr><td style="padding:5px 0;color:${BRAND.muted};">Phone</td><td style="padding:5px 0;">${safe(lead.phone)}</td></tr>` : ''}
          ${lead.area_desired ? `<tr><td style="padding:5px 0;color:${BRAND.muted};vertical-align:top;">${lead.source === 'career_form' ? 'About you' : 'Project'}</td><td style="padding:5px 0;white-space:pre-wrap;">${safe(lead.area_desired)}</td></tr>` : ''}
          ${lead.notes ? `<tr><td style="padding:5px 0;color:${BRAND.muted};vertical-align:top;">Notes</td><td style="padding:5px 0;white-space:pre-wrap;">${safe(lead.notes)}</td></tr>` : ''}
        </table>
      </div>
    </div>
    <div style="padding:6px 28px 8px;font-size:1rem;line-height:1.65;">
      <p style="margin:14px 0;"><strong>What's next?</strong> ${src.customerNext}</p>
      <p style="margin:14px 0;">Need to reach me sooner? Call or text <a href="${BRAND.phoneHref}" style="color:${BRAND.primary};font-weight:700;text-decoration:none;">${BRAND.phone}</a>.</p>
    </div>
    <div style="padding:6px 28px 8px;text-align:center;">
      <a href="${BRAND.phoneHref}" style="display:inline-block;background:${src.accent};color:#fff;padding:13px 30px;border-radius:999px;text-decoration:none;font-weight:700;font-size:.95rem;">Call ${BRAND.phone}</a>
    </div>
    <div style="padding:8px 28px 28px;text-align:center;font-size:.95rem;color:${BRAND.text};">
      <div style="font-style:italic;color:${BRAND.muted};margin-bottom:2px;">Talk soon,</div>
      <div style="font-weight:700;">Bo</div>
      <div style="font-size:.78rem;color:${BRAND.muted};margin-top:2px;">Owner, Next Level Epoxy Flooring</div>
    </div>
    ${footerHtml()}
  </div>
</body></html>`.trim();

  const text = [
    src.customerHeadline,
    '',
    `Hi ${firstName},`,
    '',
    src.customerBody.replace(/<[^>]+>/g, ''),
    '',
    'Your submission:',
    `  Name: ${lead.name || ''}`,
    lead.email ? `  Email: ${lead.email}` : null,
    lead.phone ? `  Phone: ${lead.phone}` : null,
    lead.area_desired ? `  ${lead.source === 'career_form' ? 'About you' : 'Project'}: ${lead.area_desired}` : null,
    lead.notes ? `  Notes: ${lead.notes}` : null,
    '',
    `What's next? ${src.customerNext.replace(/<[^>]+>/g, '')}`,
    '',
    `Reach me anytime: ${BRAND.phone}`,
    BRAND.site,
    '',
    'Talk soon,',
    'Bo',
    'Owner, Next Level Epoxy Flooring',
  ].filter(Boolean).join('\n');

  return { subject: src.customerSubject, html, text };
}

// ---------------------------------------------------------------------------
// Sends
// ---------------------------------------------------------------------------
async function sendLeadNotification(lead) {
  const r = client();
  if (!r) {
    console.warn('[email] RESEND_API_KEY not set — skipping notification');
    return { sent: false, reason: 'no_api_key' };
  }
  if (!process.env.LEAD_FROM_EMAIL || !process.env.LEAD_TO_EMAIL) {
    console.warn('[email] LEAD_FROM_EMAIL / LEAD_TO_EMAIL not set — skipping');
    return { sent: false, reason: 'no_addresses' };
  }

  const { subject, html, text } = buildLeadEmail(lead);

  try {
    const { data, error } = await r.emails.send({
      from: `Next Level Epoxy <${process.env.LEAD_FROM_EMAIL}>`,
      to: process.env.LEAD_TO_EMAIL,
      reply_to: lead.email || undefined,
      subject,
      html,
      text,
    });
    if (error) {
      console.error('[email] Resend (notification) error:', error);
      return { sent: false, reason: 'resend_error', error };
    }
    console.log('[email] notification sent id=' + (data?.id || '?') + ' to=' + process.env.LEAD_TO_EMAIL);
    return { sent: true, id: data?.id };
  } catch (err) {
    console.error('[email] Notification send failed:', err);
    return { sent: false, reason: 'exception', error: String(err) };
  }
}

async function sendCustomerConfirmation(lead) {
  if (!lead.email) {
    console.warn('[email] customer confirmation skipped — no lead.email for lead id=' + (lead.id || '?'));
    return { sent: false, reason: 'no_customer_email' };
  }
  const r = client();
  if (!r) {
    return { sent: false, reason: 'no_api_key' };
  }
  if (!process.env.LEAD_FROM_EMAIL) {
    return { sent: false, reason: 'no_from_address' };
  }

  const { subject, html, text } = buildCustomerEmail(lead);

  try {
    const { data, error } = await r.emails.send({
      from: `Next Level Epoxy <${process.env.LEAD_FROM_EMAIL}>`,
      to: lead.email,
      reply_to: process.env.LEAD_TO_EMAIL || undefined,
      subject,
      html,
      text,
    });
    if (error) {
      console.error('[email] Resend (customer) error:', error);
      return { sent: false, reason: 'resend_error', error };
    }
    console.log('[email] customer confirmation sent id=' + (data?.id || '?') + ' to=' + lead.email);
    return { sent: true, id: data?.id };
  } catch (err) {
    console.error('[email] Customer confirmation send failed:', err);
    return { sent: false, reason: 'exception', error: String(err) };
  }
}

// ---------------------------------------------------------------------------
// E-signature signing invitation (to recipient)
// ---------------------------------------------------------------------------
function buildSigningEmail({ doc, signUrl }) {
  const safeTitle = escapeHtml(doc.title || 'Document');
  const greeting = doc.recipient_name ? `Hi ${escapeHtml(doc.recipient_name)},` : 'Hi,';

  const html = `<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:${BRAND.bg};margin:0;padding:32px 16px;color:${BRAND.text};">
  <div style="max-width:560px;margin:0 auto;background:${BRAND.card};border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06);">
    <div style="padding:24px 28px;border-bottom:4px solid ${BRAND.primary};text-align:center;">
      <img src="${BRAND.logo}" alt="Next Level Epoxy" width="200" style="max-width:200px;height:auto;"/>
    </div>
    <div style="padding:28px 28px 8px;">
      <p style="margin:0 0 14px;">${greeting}</p>
      <p style="margin:0 0 14px;">I have a document for you to review and sign &mdash; <strong>${safeTitle}</strong>. It'll take a couple minutes and you can do the whole thing from your phone.</p>
      <p style="margin:0 0 22px;">Tap the button below to open it.</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${signUrl}" style="display:inline-block;background:${BRAND.primary};color:#fff;padding:14px 30px;border-radius:999px;text-decoration:none;font-weight:700;">Open document to sign</a>
      </div>
      <p style="margin:0 0 6px;font-size:.85rem;color:${BRAND.muted};">Or paste this link into your browser:</p>
      <p style="margin:0 0 22px;font-size:.85rem;word-break:break-all;color:${BRAND.primary};">${signUrl}</p>
    </div>
    <div style="padding:0 28px 28px;text-align:center;font-size:.95rem;color:${BRAND.text};">
      <div style="font-style:italic;color:${BRAND.muted};margin-bottom:2px;">Talk soon,</div>
      <div style="font-weight:700;">&mdash; Bo</div>
      <div style="font-size:.78rem;color:${BRAND.muted};margin-top:2px;">Next Level Epoxy Flooring</div>
    </div>
    ${footerHtml()}
  </div>
</body></html>`;

  const text = [
    doc.recipient_name ? `Hi ${doc.recipient_name},` : 'Hi,',
    '',
    `I have a document for you to review and sign — ${doc.title || 'Document'}. It'll take a couple minutes and you can do the whole thing from your phone.`,
    '',
    'Open document to sign:',
    signUrl,
    '',
    'Talk soon,',
    '— Bo',
    'Next Level Epoxy Flooring',
    '',
    `Reach me anytime: ${BRAND.phone}`,
  ].join('\n');

  return {
    subject: `${doc.title || 'Document'} — please sign at your convenience`,
    html,
    text,
  };
}

async function sendSigningInvitation({ doc, signUrl }) {
  const r = client();
  if (!r) {
    console.warn('[email] RESEND_API_KEY not set — skipping signing invite');
    return { sent: false, reason: 'no_api_key' };
  }
  if (!process.env.LEAD_FROM_EMAIL) {
    console.warn('[email] LEAD_FROM_EMAIL not set — skipping signing invite');
    return { sent: false, reason: 'no_from' };
  }
  if (!doc.recipient_email) return { sent: false, reason: 'no_recipient' };

  const { subject, html, text } = buildSigningEmail({ doc, signUrl });
  try {
    const { data, error } = await r.emails.send({
      from: process.env.LEAD_FROM_EMAIL,
      to: doc.recipient_email,
      subject, html, text,
    });
    if (error) {
      console.error('[email] signing invite send error:', error);
      return { sent: false, reason: 'resend_error', error: String(error) };
    }
    console.log('[email] signing invite sent id=' + (data?.id || '?') + ' to=' + doc.recipient_email);
    return { sent: true, id: data?.id };
  } catch (err) {
    console.error('[email] signing invite send failed:', err);
    return { sent: false, reason: 'exception', error: String(err) };
  }
}

module.exports = { sendLeadNotification, sendCustomerConfirmation, buildSigningEmail, sendSigningInvitation };
