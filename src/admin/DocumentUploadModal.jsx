import React, { useState } from 'react';
import styled from 'styled-components';
import { FiX, FiUploadCloud } from 'react-icons/fi';
import api from './api';
import { Button, Input, ButtonSecondary, Modal, ModalContent, ModalTitle } from './styles';

const DropZone = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-content: center;
  border: 2px dashed #c5d5e8;
  border-radius: 10px;
  padding: 32px;
  background: #f7fafc;
  cursor: pointer;
  color: #4a5568;

  &:hover { border-color: #0f4c81; background: #eef4fa; }
  input { display: none; }
`;

const Row = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 12px;
  > * { flex: 1; }
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 16px;
`;

const Err = styled.p`
  color: #c62828;
  font-size: 0.88rem;
  margin: 8px 0 0;
`;

const DocumentUploadModal = ({ onClose, onCreated }) => {
  const [file, setFile] = useState(null);
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!file) { setErr('Pick a PDF first'); return; }
    setErr('');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('recipient_email', recipientEmail || '');
      fd.append('recipient_name', recipientName || '');
      const { data } = await api.post('/documents', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onCreated(data);
    } catch (e2) {
      setErr(e2?.response?.data?.error || 'Upload failed');
    } finally { setBusy(false); }
  };

  return (
    <Modal>
      <ModalContent>
        <ModalTitle>Upload PDF</ModalTitle>
        <form onSubmit={submit}>
          <DropZone>
            <FiUploadCloud size={28} />
            <div>{file ? file.name : 'Click or drag a PDF here'}</div>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </DropZone>
          <Row>
            <Input placeholder="Recipient name (optional)" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
            <Input placeholder="Recipient email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
          </Row>
          {err && <Err>{err}</Err>}
          <Actions>
            <ButtonSecondary type="button" onClick={onClose} disabled={busy}><FiX /> Cancel</ButtonSecondary>
            <Button type="submit" disabled={busy || !file}>{busy ? 'Uploading…' : 'Upload'}</Button>
          </Actions>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default DocumentUploadModal;
