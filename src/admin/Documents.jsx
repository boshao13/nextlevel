import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FiPlus } from 'react-icons/fi';
import api from './api';
import {
  PageContainer, PageTitle, Card, Table, Th, Td, Input, Button,
  StatusBadge, FilterBar, ClickableRow, EmptyState,
} from './styles';
import DocumentUploadModal from './DocumentUploadModal';

const Pill = styled.button`
  padding: 6px 12px;
  border-radius: 999px;
  border: 1.5px solid ${({ active }) => active ? '#0f4c81' : '#cbd5e0'};
  background: ${({ active }) => active ? '#0f4c81' : 'white'};
  color: ${({ active }) => active ? 'white' : '#4a5568'};
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
`;

const fmtDate = (iso) => iso
  ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  : '—';

const STATUSES = ['', 'draft', 'sent', 'viewed', 'signed', 'voided'];

const Documents = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    const { data } = await api.get('/api/documents', { params: { status, q, limit: 100 } });
    setItems(data.documents);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status, q]);

  return (
    <PageContainer>
      <PageTitle>Documents</PageTitle>

      <FilterBar>
        {STATUSES.map(s => (
          <Pill key={s || 'all'} active={status === s} onClick={() => setStatus(s)}>
            {s ? s[0].toUpperCase() + s.slice(1) : 'All'}
          </Pill>
        ))}
        <Input
          placeholder="Search recipient email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ maxWidth: 260, marginLeft: 8 }}
        />
        <Button onClick={() => setShowModal(true)} style={{ marginLeft: 'auto' }}>
          <FiPlus /> New Document
        </Button>
      </FilterBar>

      <Card>
        {items.length === 0 && (
          <EmptyState>No documents yet. Upload one to get started.</EmptyState>
        )}
        {items.length > 0 && (
          <Table>
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Recipient</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Last activity</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <ClickableRow key={d.id} onClick={() => navigate(`/admin/documents/${d.id}`)}>
                  <Td>{d.title}</Td>
                  <Td>
                    {d.recipient_name || '—'}
                    <div style={{ fontSize: '.78rem', color: '#6b7280' }}>{d.recipient_email}</div>
                  </Td>
                  <Td><StatusBadge status={d.status}>{d.status}</StatusBadge></Td>
                  <Td>{fmtDate(d.created_at)}</Td>
                  <Td>{fmtDate(d.signed_at || d.viewed_at || d.sent_at || d.voided_at || d.created_at)}</Td>
                </ClickableRow>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {showModal && (
        <DocumentUploadModal
          onClose={() => setShowModal(false)}
          onCreated={(doc) => navigate(`/admin/documents/${doc.id}`)}
        />
      )}
    </PageContainer>
  );
};

export default Documents;
