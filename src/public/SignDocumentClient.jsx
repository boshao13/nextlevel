'use client';
// src/public/SignDocumentClient.jsx
// Public signer flow: consent → fill fields → submit. No auth, no admin layout.
// Port of SignDocument.jsx for Next: token arrives as a prop from
// app/sign/[token]/page.js; the no-referrer + noindex tags moved to that
// page's metadata export.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import styled from 'styled-components';
import axios from 'axios';
import SignatureModal from '../components/SignatureModal';

// pdfjs-dist wires its web worker via a module-scope side-effect import that
// must never evaluate on the server.
const PdfPreview = dynamic(() => import('../components/PdfPreview'), { ssr: false });

const Page = styled.div`
  min-height: 100vh; background: #f5f8fc;
  display: flex; flex-direction: column;
`;

const Header = styled.div`
  background: white; border-bottom: 1px solid #e2e8f0;
  padding: 14px 22px; display: flex; align-items: center; gap: 12px;
  img { height: 28px; }
  h1 { font-size: 1rem; font-weight: 700; margin: 0; }
  span { color: #6b7280; font-size: .85rem; }
`;

const ConsentCard = styled.div`
  max-width: 540px; margin: 60px auto; background: white; padding: 32px;
  border-radius: 14px; box-shadow: 0 2px 12px rgba(0,0,0,.06);
`;

const Stick = styled.div`
  position: sticky; bottom: 0; background: white; border-top: 1px solid #e2e8f0;
  padding: 12px 22px; display: flex; align-items: center; gap: 14px;
  button {
    margin-left: auto;
    padding: 12px 22px; border-radius: 999px; border: none;
    background: #0f4c81; color: white; font-weight: 700; cursor: pointer;
  }
  button[disabled] { background: #c5d5e8; cursor: not-allowed; }
`;

const FieldBtn = styled.button`
  position: absolute; cursor: pointer; padding: 0;
  background: #fef3c7cc; border: 2px solid #f59e0b;
  font-size: 11px; color: #1f2937; display: flex;
  align-items: center; justify-content: center;
  font-weight: 600; text-transform: uppercase; letter-spacing: .03em;

  &.filled { background: #d1fae5cc; border-color: #10b981; }
`;

const Thumb = styled.img`
  max-width: 90%; max-height: 90%; object-fit: contain;
`;

// SignerPageOverlay — renders absolutely-positioned <FieldBtn>s inside the given page wrap.
const SignerPageOverlay = ({ pageWrap, fields, values, onSignatureClick, onDateClick, onTextClick }) => {
  if (!pageWrap) return null;
  return ReactDOM.createPortal(
    <>
      {fields.map((f) => {
        const v = values[f.id];
        const filled = !!v && (!!(v.value_text && v.value_text.trim()) || !!v.value_image);
        const style = {
          left:   `${Number(f.x) * 100}%`,
          top:    `${Number(f.y) * 100}%`,
          width:  `${Number(f.w) * 100}%`,
          height: `${Number(f.h) * 100}%`,
        };
        const onClick = (e) => {
          e.preventDefault();
          if (f.field_type === 'signature' || f.field_type === 'initials') onSignatureClick(f);
          else if (f.field_type === 'date') onDateClick(f);
          else if (f.field_type === 'text') onTextClick(f);
        };
        return (
          <FieldBtn key={f.id} className={filled ? 'filled' : ''} style={style} onClick={onClick}>
            {filled && v.value_image && <Thumb src={v.value_image} alt="" />}
            {filled && !v.value_image && String(v.value_text || '').slice(0, 40)}
            {!filled && (
              f.field_type === 'signature' ? 'Tap to sign' :
              f.field_type === 'initials' ? 'Initials' :
              f.field_type === 'date'     ? 'Tap for date' :
                                            'Tap to type'
            )}
          </FieldBtn>
        );
      })}
    </>,
    pageWrap
  );
};

const SignDocumentClient = ({ token }) => {
  const router = useRouter();
  const [meta, setMeta] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [agreement, setAgreement] = useState(null);
  const [consented, setConsented] = useState(false);
  const [pages, setPages] = useState([]);
  const [values, setValues] = useState({}); // { field_id: { value_text, value_image } }
  const [openField, setOpenField] = useState(null);
  const [textPrompt, setTextPrompt] = useState({ open: false, fieldId: null, value: '' });
  const [busy, setBusy] = useState(false);
  const blobRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: m }, { data: ag }, fileResp] = await Promise.all([
          axios.get(`/api/sign/${token}`),
          axios.get(`/api/sign/agreement`),
          axios.get(`/api/sign/${token}/file`, { responseType: 'blob' }),
        ]);
        setMeta(m);
        setAgreement(ag);
        blobRef.current = URL.createObjectURL(fileResp.data);
        setPdfBlob(blobRef.current);
        if (m.status === 'signed') {
          // Already signed — bounce to confirmation
          router.push(`/signed/${token}`);
        }
      } catch (e) {
        if (e?.response?.status === 404) router.push('/');
      }
    })();
    return () => { if (blobRef.current) URL.revokeObjectURL(blobRef.current); };
  }, [token, router]);

  const required = useMemo(() => (meta?.fields || []).filter(f => f.required), [meta]);
  const filledCount = required.filter(f => {
    const v = values[f.id];
    return v && ((v.value_text && v.value_text.trim()) || v.value_image);
  }).length;

  const fieldByPage = useMemo(() => {
    const m = new Map();
    for (const f of (meta?.fields || [])) {
      if (!m.has(f.page)) m.set(f.page, []);
      m.get(f.page).push(f);
    }
    return m;
  }, [meta]);

  const giveConsent = async () => {
    setBusy(true);
    try {
      await axios.post(`/api/sign/${token}/consent`, {});
      setConsented(true);
    } catch (e) {
      if (e?.response?.status === 409) setConsented(true); // already recorded
      else alert(e?.response?.data?.error || 'Could not record consent');
    } finally { setBusy(false); }
  };

  const saveValue = async (fieldId, val) => {
    setValues((prev) => ({ ...prev, [fieldId]: val }));
    try {
      await axios.post(`/api/sign/${token}/values`, {
        values: [{ field_id: fieldId, ...val }],
      });
    } catch (e) { console.error('save value', e); }
  };

  const finish = async () => {
    setBusy(true);
    try {
      // For Date fields not yet set, auto-fill with today
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      for (const f of (meta.fields || []).filter(x => x.field_type === 'date' && !values[x.id]?.value_text)) {
        await saveValue(f.id, { value_text: today });
      }
      await axios.post(`/api/sign/${token}/submit`, {});
      router.push(`/signed/${token}`);
    } catch (e) {
      alert(e?.response?.data?.error || 'Could not submit');
    } finally { setBusy(false); }
  };

  if (!meta) return <Page><div style={{ padding: 40 }}>Loading…</div></Page>;

  if (!consented) {
    return (
      <Page>
        <Header>
          <img src="/nextlevellogo.png" alt="Next Level Epoxy" />
          <h1>{meta.title}</h1>
        </Header>
        <ConsentCard>
          <h2 style={{ marginTop: 0 }}>Ready to sign?</h2>
          <p>You're about to sign <strong>{meta.title}</strong>. Before you can fill in any fields, please confirm you agree to use an electronic signature.</p>
          <div style={{ background: '#f7fafc', borderRadius: 8, padding: 16, fontSize: '.92rem', color: '#4a5568', margin: '14px 0' }}>
            {agreement?.text}
          </div>
          <button
            onClick={giveConsent}
            disabled={busy}
            style={{
              width: '100%', padding: 14, background: '#0f4c81',
              color: 'white', border: 'none', borderRadius: 999,
              fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
            }}
          >
            I agree — start signing
          </button>
        </ConsentCard>
      </Page>
    );
  }

  return (
    <Page>
      <Header>
        <img src="/nextlevellogo.png" alt="Next Level Epoxy" />
        <h1>{meta.title}</h1>
        <span>{filledCount}/{required.length} required fields</span>
      </Header>

      <div style={{ position: 'relative' }}>
        {pdfBlob && <PdfPreview src={pdfBlob} onPagesLoaded={setPages} />}
        {pages.map((p) => (
          <SignerPageOverlay
            key={p.num}
            pageWrap={p.wrap}
            fields={fieldByPage.get(p.num) || []}
            values={values}
            onSignatureClick={(f) => setOpenField({ kind: 'signature', field: f })}
            onDateClick={async (f) => {
              const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              await saveValue(f.id, { value_text: today });
            }}
            onTextClick={(f) => setTextPrompt({ open: true, fieldId: f.id, value: values[f.id]?.value_text || '' })}
          />
        ))}
      </div>

      <Stick>
        <div>{filledCount} of {required.length} required fields complete</div>
        <button onClick={finish} disabled={busy || filledCount < required.length}>Finish &amp; Sign</button>
      </Stick>

      {openField && (
        <SignatureModal
          onClose={() => setOpenField(null)}
          onAdopt={async (val) => {
            await saveValue(openField.field.id, val);
            setOpenField(null);
          }}
        />
      )}

      {textPrompt.open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{ background: 'white', padding: 20, borderRadius: 10, width: 'min(420px, 92vw)' }}>
            <input
              autoFocus
              value={textPrompt.value}
              onChange={(e) => setTextPrompt({ ...textPrompt, value: e.target.value })}
              style={{ width: '100%', padding: 12, fontSize: '1rem', boxSizing: 'border-box' }}
              placeholder="Type here…"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button onClick={() => setTextPrompt({ open: false, fieldId: null, value: '' })}>Cancel</button>
              <button onClick={async () => {
                await saveValue(textPrompt.fieldId, { value_text: textPrompt.value });
                setTextPrompt({ open: false, fieldId: null, value: '' });
              }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
};

export default SignDocumentClient;
