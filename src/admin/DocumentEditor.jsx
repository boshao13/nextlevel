import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FiArrowLeft, FiTrash2, FiSend } from 'react-icons/fi';
import api from './api';
import {
  PageContainer, PageTitle, Card, Input, TextArea, Button, ButtonSecondary, StatusBadge,
} from './styles';
import PdfPreview from '../components/PdfPreview';

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

const debounce = (fn, ms) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

const DocumentEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [pdfBlob, setPdfBlob] = useState(null);
  const [title, setTitle] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    let revokeUrl = null;
    (async () => {
      const { data } = await api.get(`/api/documents/${id}`);
      setDoc(data);
      setTitle(data.title);
      setRecipientName(data.recipient_name || '');
      setRecipientEmail(data.recipient_email || '');
      setNotes(data.notes || '');
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

  const handleDelete = async () => {
    if (!window.confirm('Delete this draft? File is removed permanently.')) return;
    await api.delete(`/api/documents/${id}`);
    navigate('/admin/documents');
  };

  if (!doc) return <PageContainer><div>Loading…</div></PageContainer>;

  const isDraft = doc.status === 'draft';

  return (
    <PageContainer>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <ButtonSecondary onClick={() => navigate('/admin/documents')}><FiArrowLeft /> Back</ButtonSecondary>
        <PageTitle style={{ margin: 0, flex: 1 }}>{doc.title}</PageTitle>
        <StatusBadge status={doc.status}>{doc.status}</StatusBadge>
      </div>

      <Layout>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {pdfBlob && <PdfPreview src={pdfBlob} />}
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
              <p style={{ margin: 0, color: '#6b7280', fontSize: '.92rem' }}>
                Field placement and Send for Signature ship in the next deploy.
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <Button disabled title="Available in PR 2"><FiSend /> Send for Signature</Button>
                <ButtonSecondary onClick={handleDelete}><FiTrash2 /> Delete draft</ButtonSecondary>
              </div>
            </Card>
          )}

          {!isDraft && (
            <Card>
              <p style={{ margin: 0, color: '#6b7280' }}>Editor for status "{doc.status}" lands in a later deploy.</p>
            </Card>
          )}
        </Right>
      </Layout>
    </PageContainer>
  );
};

export default DocumentEditor;
