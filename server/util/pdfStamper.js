// server/util/pdfStamper.js
// Single export: stampSignedPdf({ sourcePath, outputPath, fields, certificate })
//
// Each field has:
//   { page, field_type, x, y, w, h, value: { value_text, value_image } }
// where x/y/w/h are normalized 0..1 with origin at TOP-LEFT (matches the UI).
// pdf-lib coordinate origin is BOTTOM-LEFT — converted during draw.

const fs = require('fs');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

// Quick PNG sanity check. pdf-lib's embedPng can lock the event loop on corrupt
// buffers (no async-yield in its parser), so a Promise.race timeout can't save us.
// Validate the signature + IHDR + IEND markers BEFORE handing the buffer over.
function isValidPngBuffer(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 80) return false;
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  if (!buf.subarray(0, 8).equals(sig)) return false;
  // IHDR must start at byte 12 (length is 4 bytes BE = 13, then 'IHDR')
  if (buf.toString('ascii', 12, 16) !== 'IHDR') return false;
  // IEND chunk should be the last 8 bytes: 00 00 00 00 49 45 4E 44
  const tailLabel = buf.toString('ascii', buf.length - 8, buf.length - 4);
  return tailLabel === 'IEND';
}

async function stampSignedPdf({ sourcePath, outputPath, fields, certificate }) {
  const srcBytes = await fs.promises.readFile(sourcePath);
  const pdfDoc = await PDFDocument.load(srcBytes);
  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();

  for (const f of fields) {
    const pageIdx = f.page - 1;
    if (pageIdx < 0 || pageIdx >= pages.length) continue;
    const page = pages[pageIdx];
    const { width: pw, height: ph } = page.getSize();

    const x = Number(f.x) * pw;
    const w = Number(f.w) * pw;
    const h = Number(f.h) * ph;
    const yTop = Number(f.y) * ph;
    const y = ph - yTop - h;

    if ((f.field_type === 'signature' || f.field_type === 'initials') && f.value.value_image) {
      const dataUrl = f.value.value_image;
      const b64 = dataUrl.startsWith('data:') ? dataUrl.split(',', 2)[1] : dataUrl;
      const pngBuf = Buffer.from(b64, 'base64');

      // Pre-validate. pdf-lib's embedPng parser blocks the event loop on bad data,
      // so we MUST reject malformed PNGs before calling embedPng — Promise.race
      // can't save us once the loop is locked.
      if (!isValidPngBuffer(pngBuf)) {
        console.warn('pdfStamper: invalid PNG buffer, falling back to text for field', f.id);
        const txt = (f.value.value_text || '').slice(0, 80);
        const fontSize = Math.min(h * 0.7, 28);
        page.drawText(txt, { x: x + 4, y: y + (h - fontSize) / 2, size: fontSize, font: helv, color: rgb(0, 0, 0) });
        continue;
      }

      let png;
      try {
        png = await pdfDoc.embedPng(pngBuf);
      } catch (e) {
        console.error('embedPng failed; falling back to text:', e.message);
        const txt = (f.value.value_text || '').slice(0, 80);
        const fontSize = Math.min(h * 0.7, 28);
        page.drawText(txt, { x: x + 4, y: y + (h - fontSize) / 2, size: fontSize, font: helv, color: rgb(0, 0, 0) });
        continue;
      }
      const scaled = png.scaleToFit(w, h);
      page.drawImage(png, {
        x: x + (w - scaled.width) / 2,
        y: y + (h - scaled.height) / 2,
        width: scaled.width,
        height: scaled.height,
      });
    } else if (f.field_type === 'signature' || f.field_type === 'initials') {
      const txt = (f.value.value_text || '').slice(0, 80);
      const fontSize = Math.min(h * 0.7, 28);
      page.drawText(txt, { x: x + 4, y: y + (h - fontSize) / 2, size: fontSize, font: helv, color: rgb(0, 0, 0) });
    } else if (f.field_type === 'date') {
      const txt = (f.value.value_text || '').slice(0, 30);
      const fontSize = Math.min(h * 0.7, 14);
      page.drawText(txt, { x: x + 4, y: y + (h - fontSize) / 2, size: fontSize, font: helv, color: rgb(0, 0, 0) });
    } else if (f.field_type === 'text') {
      const txt = (f.value.value_text || '').slice(0, 1000);
      const fontSize = Math.min(h * 0.6, 12);
      page.drawText(txt, {
        x: x + 4,
        y: y + (h - fontSize) / 2,
        size: fontSize,
        font: helv,
        color: rgb(0, 0, 0),
        maxWidth: w - 8,
      });
    }
  }

  // Certificate of Completion page
  const cert = pdfDoc.addPage();
  const { width: cw, height: ch } = cert.getSize();
  let cursorY = ch - 72;
  const lh = 18;

  cert.drawText('Certificate of Completion', {
    x: 56, y: cursorY, size: 22, font: helvBold, color: rgb(0.06, 0.30, 0.51),
  });
  cursorY -= lh * 2;

  const safeIso = (v) => {
    if (!v) return '—';
    try { return new Date(v).toISOString(); } catch (e) { return String(v); }
  };

  const lines = [
    ['Document', certificate.title || '—'],
    ['Signer', `${certificate.recipient_name || ''} <${certificate.recipient_email || ''}>`],
    ['', ''],
    ['Consent recorded', safeIso(certificate.consent_at)],
    ['Consent IP', certificate.consent_ip || '—'],
    ['Agreement version', certificate.agreement_version || '—'],
    ['Agreement text', certificate.agreement_text || ''],
    ['', ''],
    ['Signed at', safeIso(certificate.signed_at)],
    ['Signing IP', certificate.signed_ip || '—'],
    ['', ''],
    ['Original SHA-256', certificate.original_sha256 || '—'],
  ];

  for (const [label, value] of lines) {
    if (!label && !value) { cursorY -= lh; continue; }
    cert.drawText(`${label}:`, {
      x: 56, y: cursorY, size: 10, font: helvBold, color: rgb(0.10, 0.10, 0.10),
    });
    const wrapped = String(value || '').match(/.{1,80}/g) || [''];
    for (let i = 0; i < wrapped.length; i++) {
      cert.drawText(wrapped[i], {
        x: 180, y: cursorY - (i * (lh - 4)),
        size: 10, font: helv, color: rgb(0.20, 0.20, 0.20),
      });
    }
    cursorY -= lh + (wrapped.length - 1) * (lh - 4);
  }

  cert.drawText('This page is appended automatically by Next Level Epoxy after signing.', {
    x: 56, y: 48, size: 8, font: helv, color: rgb(0.5, 0.5, 0.5),
  });

  const outBytes = await pdfDoc.save();
  await fs.promises.writeFile(outputPath, outBytes);
}

module.exports = { stampSignedPdf };
