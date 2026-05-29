// server/util/pdfStamper.js
// Single export: stampSignedPdf({ sourcePath, outputPath, fields, certificate })
//
// Each field has:
//   { page, field_type, x, y, w, h, value: { value_text, value_image } }
// where x/y/w/h are normalized 0..1 with origin at TOP-LEFT (matches the UI).
// pdf-lib coordinate origin is BOTTOM-LEFT — converted during draw.

const fs = require('fs');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

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
      let png;
      try {
        // pdf-lib's embedPng can hang on corrupt PNG buffers (no built-in timeout);
        // race with a 3s deadline and fall back to typed-text rendering on either timeout or throw.
        const embedP = pdfDoc.embedPng(Buffer.from(b64, 'base64'));
        const timeoutP = new Promise((_, rej) => setTimeout(() => rej(new Error('embedPng timeout')), 3000));
        png = await Promise.race([embedP, timeoutP]);
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
