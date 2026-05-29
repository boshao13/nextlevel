import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  FiArrowLeft, FiTrash2, FiSend, FiSlash, FiType, FiCalendar, FiFileText, FiAtSign, FiDownload,
} from 'react-icons/fi';
import api from './api';
import {
  PageContainer, PageTitle, Card, Input, TextArea, Button, ButtonSecondary, StatusBadge,
} from './styles';
import PdfPreview from '../components/PdfPreview';
import FieldOverlay from './FieldOverlay';

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  @media (max-width: 1000px) { grid-template-columns: 1fr; }
`;

const Right = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  label { font-size: 0.82rem; color: #4a5568; font-weight: 600; }
`;

const ToolbarRow = styled.div`
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  align-items: center;
  flex-wrap: wrap;
`;

const ToolBtn = styled.button`
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 10px; border-radius: 8px;
  border: 1.5px solid ${({ active }) => active ? '#0f4c81' : '#cbd5e0'};
  background: ${({ active }) => active ? '#0f4c81' : 'white'};
  color: ${({ active }) => active ? 'white' : '#1f2937'};
  font-size: 0.82rem; font-weight: 600; cursor: pointer;
`;

const Timeline = styled.ul`
  list-style: none; padding: 0; margin: 0;
  li { padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: .9rem; }
  li:last-child { border-bottom: none; }
  .ip { color: #6b7280; font-size: .78rem; }
`;

const Banner = styled.div`
  background: ${({ $tone }) => $tone === 'voided' ? '#fef2f2' : ($tone === 'signed' ? '#ecfdf5' : '#fef3c7')};
  color: ${({ $tone }) => $tone === 'voided' ? '#991b1b' : ($tone === 'signed' ? '#065f46' : '#92400e')};
  padding: 12px 14px;
  border-radius: 8px;
  font-size: .92rem;
  font-weight: 600;
`;

const debounce = (fn, ms) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  : '—';

const DocumentEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [title, setTitle] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [pages, setPages] = useState([]);
  const [fields, setFields] = useState([]);
  const [placingType, setPlacingType] = useState(null);
  const initialFieldsLoaded = useRef(false);

  useEffect(() => {
    let revokeUrl = null;
    (async () => {
      const { data } = await api.get(`/api/documents/${id}`);
      setDoc(data);
      setTitle(data.title);
      setRecipientName(data.recipient_name || '');
      setRecipientEmail(data.recipient_email || '');
      setNotes(data.notes || '');
      setFields((data.fields || []).map(f => ({
        ...f,
        x: Number(f.x), y: Number(f.y), w: Number(f.w), h: Number(f.h),
      })));
      // Mark initial-load complete on next tick so the field-save useEffect skips first run.
      setTimeout(() => { initialFieldsLoaded.current = true; }, 0);

      const fileResp = await api.get(`/api/documents/${id}/file`, { responseType: 'blob' });
      revokeUrl = URL.createObjectURL(fileResp.data);
      setPdfBlob(revokeUrl);
    })();
    return () => { if (revokeUrl) URL.revokeObjectURL(revokeUrl); };
  }, [id]);

  const persist = useCallback(debounce(async (patch) => {
    try { await api.put(`/api/documents/${id}`, patch); }
    catch (e) { console.error('autosave', e); }
  }, 600), [id]);

  const persistFields = useCallback(debounce(async (next) => {
    try { await api.put(`/api/documents/${id}/fields`, { fields: next }); }
    catch (e) { console.error('field save', e); }
  }, 500), [id]);

  useEffect(() => {
    if (!initialFieldsLoaded.current) return;
    persistFields(fields);
  }, [fields, persistFields]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this draft? File is removed permanently.')) return;
    await api.delete(`/api/documents/${id}`);
    navigate('/admin/documents');
  };

  const handleSend = async () => {
    if (!window.confirm(`Send to ${recipientEmail}? They will receive an email with a link to sign.`)) return;
    try {
      await api.post(`/api/documents/${id}/send`);
      const { data } = await api.get(`/api/documents/${id}`);
      setDoc(data);
    } catch (e) {
      alert(e?.response?.data?.error || 'Send failed');
    }
  };

  const handleResend = async () => {
    try {
      await api.post(`/api/documents/${id}/resend`);
      const { data } = await api.get(`/api/documents/${id}`);
      setDoc(data);
    } catch (e) { alert(e?.response?.data?.error || 'Resend failed'); }
  };

  const handleVoid = async () => {
    if (!window.confirm('Void this document? The signer can no longer sign it.')) return;
    try {
      await api.post(`/api/documents/${id}/void`);
      const { data } = await api.get(`/api/documents/${id}`);
      setDoc(data);
    } catch (e) { alert(e?.response?.data?.error || 'Void failed'); }
  };

  const downloadSigned = async () => {
    const resp = await api.get(`/api/documents/${id}/signed-file`, { responseType: 'blob' });
    const url = URL.createObjectURL(resp.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(doc.title || 'document').replace(/[^\w.-]+/g, '_')}-signed.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAudit = () => {
    const audit = {
      document: doc,
      fields: doc.fields,
      events: doc.events,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(audit, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doc-${doc.id}-audit.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!doc) return <PageContainer><div>Loading…</div></PageContainer>;

  const isDraft = doc.status === 'draft';
  const canSend = recipientEmail
    && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(recipientEmail)
    && fields.some(f => f.field_type === 'signature');

  return (
    <PageContainer>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <ButtonSecondary onClick={() => navigate('/admin/documents')}><FiArrowLeft /> Back</ButtonSecondary>
        <PageTitle style={{ margin: 0, flex: 1 }}>{doc.title}</PageTitle>
        <StatusBadge status={doc.status}>{doc.status}</StatusBadge>
      </div>

      <Layout>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {isDraft && (
            <ToolbarRow>
              {[
                { t: 'signature', icon: <FiFileText />, label: 'Signature' },
                { t: 'initials',  icon: <FiAtSign />,   label: 'Initials' },
                { t: 'date',      icon: <FiCalendar />, label: 'Date' },
                { t: 'text',      icon: <FiType />,     label: 'Text' },
              ].map((b) => (
                <ToolBtn key={b.t} active={placingType === b.t} onClick={() => setPlacingType(placingType === b.t ? null : b.t)}>
                  {b.icon} {b.label}
                </ToolBtn>
              ))}
              <span style={{ marginLeft: 'auto', fontSize: '.82rem', color: '#6b7280' }}>
                {placingType ? `Click on a page to place a ${placingType} field` : 'Pick a field type, then click on the PDF'}
              </span>
            </ToolbarRow>
          )}
          {pdfBlob && <PdfPreview src={pdfBlob} onPagesLoaded={setPages} />}
          {isDraft && pages.length > 0 && (
            <FieldOverlay
              pages={pages}
              value={fields}
              onChange={(updater) => setFields(typeof updater === 'function' ? updater(fields) : updater)}
              placingType={placingType}
              onPlaced={() => setPlacingType(null)}
            />
          )}
        </Card>

        <Right>
          <Card>
            <Field>
              <label htmlFor="title">Title</label>
              <Input
                id="title"
                value={title}
                onChange={(e) => { setTitle(e.target.value); persist({ title: e.target.value }); }}
                disabled={!isDraft}
              />
            </Field>

            <Field style={{ marginTop: 12 }}>
              <label htmlFor="rname">Recipient name</label>
              <Input
                id="rname"
                placeholder="(optional)"
                value={recipientName}
                onChange={(e) => { setRecipientName(e.target.value); persist({ recipient_name: e.target.value }); }}
                disabled={!isDraft}
              />
            </Field>

            <Field style={{ marginTop: 12 }}>
              <label htmlFor="remail">Recipient email</label>
              <Input
                id="remail"
                type="email"
                value={recipientEmail}
                onChange={(e) => { setRecipientEmail(e.target.value); persist({ recipient_email: e.target.value }); }}
                disabled={!isDraft}
              />
            </Field>

            <Field style={{ marginTop: 12 }}>
              <label htmlFor="notes">Internal notes</label>
              <TextArea
                id="notes"
                rows={2}
                value={notes}
                onChange={(e) => { setNotes(e.target.value); persist({ notes: e.target.value }); }}
                disabled={!isDraft}
              />
            </Field>
          </Card>

          {isDraft && (
            <Card>
              <Button onClick={handleSend} disabled={!canSend} style={{ width: '100%' }}>
                <FiSend /> Send for Signature
              </Button>
              <div style={{ fontSize: '.78rem', color: '#6b7280', marginTop: 6 }}>
                {fields.filter(f => f.field_type === 'signature').length} signature field(s) placed · {fields.length} total
              </div>
              <div style={{ marginTop: 12 }}>
                <ButtonSecondary onClick={handleDelete} style={{ width: '100%' }}>
                  <FiTrash2 /> Delete draft
                </ButtonSecondary>
              </div>
            </Card>
          )}

          {(doc.status === 'sent' || doc.status === 'viewed') && (
            <Card>
              <Banner>Sent to {doc.recipient_email}. Waiting on signer.</Banner>
              <h3 style={{ margin: '14px 0 8px' }}>Activity</h3>
              <Timeline>
                {(doc.events || []).map((ev) => (
                  <li key={ev.id}>
                    <strong>{ev.event_type}</strong> {fmtDate(ev.occurred_at)}
                    {ev.ip && <div className="ip">IP {ev.ip}</div>}
                  </li>
                ))}
              </Timeline>
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <Button onClick={handleResend}>Resend email</Button>
                <ButtonSecondary onClick={handleVoid}><FiSlash /> Void</ButtonSecondary>
              </div>
            </Card>
          )}

          {doc.status === 'signed' && (
            <Card>
              <Banner $tone="signed">Signed on {fmtDate(doc.signed_at)} ✓</Banner>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <Button onClick={downloadSigned}>
                  <FiDownload /> Download signed PDF
                </Button>
                <ButtonSecondary onClick={downloadAudit}>Download audit JSON</ButtonSecondary>
              </div>
              <h3 style={{ marginTop: 18 }}>Audit</h3>
              <Timeline>
                {(doc.events || []).map((ev) => {
                  const det = typeof ev.detail === 'string' ? JSON.parse(ev.detail) : ev.detail;
                  return (
                    <li key={ev.id}>
                      <strong>{ev.event_type}</strong> {fmtDate(ev.occurred_at)}
                      {ev.ip && <div className="ip">IP {ev.ip}</div>}
                      {det?.signed_sha256 && <div className="ip">Signed SHA256: {String(det.signed_sha256).slice(0, 16)}…</div>}
                      {det?.agreement_version && <div className="ip">Agreement: {det.agreement_version}</div>}
                    </li>
                  );
                })}
              </Timeline>
              <div style={{ fontSize: '.78rem', color: '#6b7280', marginTop: 12 }}>
                Original SHA256: {doc.file_hash}
              </div>
            </Card>
          )}

          {doc.status === 'voided' && (
            <Card>
              <Banner $tone="voided">This document was voided on {fmtDate(doc.voided_at)}.</Banner>
              <h3 style={{ margin: '14px 0 8px' }}>Activity</h3>
              <Timeline>
                {(doc.events || []).map((ev) => (
                  <li key={ev.id}>
                    <strong>{ev.event_type}</strong> {fmtDate(ev.occurred_at)}
                    {ev.ip && <div className="ip">IP {ev.ip}</div>}
                  </li>
                ))}
              </Timeline>
            </Card>
          )}
        </Right>
      </Layout>
    </PageContainer>
  );
};

export default DocumentEditor;
