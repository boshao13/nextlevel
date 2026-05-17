import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from './api';
import {
  PageContainer, PageTitle, Card, Table, Th, Td,
  StatusBadge, Button, ButtonSecondary, TextArea, Select,
  ClickableRow, Modal, ModalContent, ModalTitle,
} from './styles';

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 8px;
`;

const InfoItem = styled.div`
  font-size: 0.9rem;
  color: var(--text);
`;

const InfoLabel = styled.div`
  font-size: 0.75rem;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
  font-weight: 700;
`;

const Section = styled.div`
  margin-bottom: 32px;
`;

const SectionTitle = styled.h2`
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 16px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
`;

const SmallSelect = styled(Select)`
  max-width: 200px;
`;

const DangerButton = styled(Button)`
  background: #c62828;
  &:hover { background: #b71c1c; }
`;

const MailLink = styled.a`
  color: var(--primary);
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const STATUSES = ['new', 'contacted', 'quoted', 'scheduled', 'completed', 'closed'];

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString() : '—';

const formatCurrency = (val) =>
  Number(val).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const sourceLabels = {
  contact_form: 'Contact',
  commercial_form: 'Commercial',
  career_form: 'Career',
};

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const fetchLead = async () => {
    try {
      const res = await api.get(`/leads/${id}`);
      setLead(res.data);
      setNotes(res.data.notes || '');
    } catch (err) {
      console.error('Failed to fetch lead:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await api.put(`/leads/${id}`, { notes });
      await fetchLead();
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      await api.put(`/leads/${id}`, { status: newStatus });
      await fetchLead();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/leads/${id}`);
      navigate('/admin/leads');
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
  };

  if (loading) return <PageContainer><p>Loading...</p></PageContainer>;
  if (!lead) return <PageContainer><p>Lead not found.</p></PageContainer>;

  const quotes = lead.quotes || [];
  const jobs = lead.jobs || [];
  const invoices = lead.invoices || [];

  return (
    <PageContainer>
      <HeaderRow>
        <PageTitle style={{ marginBottom: 0 }}>{lead.name}</PageTitle>
        <StatusBadge $status={lead.status}>{lead.status}</StatusBadge>
      </HeaderRow>

      <Section>
        <Card>
          <InfoGrid>
            <InfoItem>
              <InfoLabel>Email</InfoLabel>
              <MailLink href={`mailto:${lead.email}`}>{lead.email}</MailLink>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Phone</InfoLabel>
              {lead.phone ? (
                <MailLink href={`tel:${lead.phone}`}>{lead.phone}</MailLink>
              ) : '—'}
            </InfoItem>
            <InfoItem>
              <InfoLabel>Source</InfoLabel>
              {sourceLabels[lead.source] || lead.source || '—'}
            </InfoItem>
            <InfoItem>
              <InfoLabel>Area Desired</InfoLabel>
              {lead.area_desired || lead.area || '—'}
            </InfoItem>
            <InfoItem>
              <InfoLabel>Created</InfoLabel>
              {formatDate(lead.created_at)}
            </InfoItem>
          </InfoGrid>
        </Card>
      </Section>

      <StatusRow>
        <InfoLabel style={{ marginBottom: 0 }}>Status:</InfoLabel>
        <SmallSelect value={lead.status} onChange={handleStatusChange}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </SmallSelect>
      </StatusRow>

      <Section>
        <Card>
          <SectionTitle>Notes</SectionTitle>
          <TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this lead..."
          />
          <div style={{ marginTop: 12 }}>
            <Button onClick={handleSaveNotes} disabled={saving}>
              {saving ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>
        </Card>
      </Section>

      {quotes.length > 0 && (
        <Section>
          <Card>
            <SectionTitle>Quotes</SectionTitle>
            <Table>
              <thead>
                <tr>
                  <Th>Description</Th>
                  <Th>Total</Th>
                  <Th>Status</Th>
                  <Th>Date</Th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <ClickableRow key={q._id} onClick={() => navigate(`/admin/quotes/${q._id}`)}>
                    <Td>{q.description || q.title || '—'}</Td>
                    <Td>{formatCurrency(q.total || 0)}</Td>
                    <Td><StatusBadge $status={q.status}>{q.status}</StatusBadge></Td>
                    <Td>{formatDate(q.created_at)}</Td>
                  </ClickableRow>
                ))}
              </tbody>
            </Table>
          </Card>
        </Section>
      )}

      {jobs.length > 0 && (
        <Section>
          <Card>
            <SectionTitle>Jobs</SectionTitle>
            <Table>
              <thead>
                <tr>
                  <Th>Title</Th>
                  <Th>Status</Th>
                  <Th>Start Date</Th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <ClickableRow key={j._id} onClick={() => navigate(`/admin/jobs/${j._id}`)}>
                    <Td>{j.title}</Td>
                    <Td><StatusBadge $status={j.status}>{j.status}</StatusBadge></Td>
                    <Td>{formatDate(j.start_date)}</Td>
                  </ClickableRow>
                ))}
              </tbody>
            </Table>
          </Card>
        </Section>
      )}

      {invoices.length > 0 && (
        <Section>
          <Card>
            <SectionTitle>Invoices</SectionTitle>
            <Table>
              <thead>
                <tr>
                  <Th>Invoice #</Th>
                  <Th>Total</Th>
                  <Th>Status</Th>
                  <Th>Due Date</Th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <ClickableRow key={inv._id} onClick={() => navigate(`/admin/invoices/${inv._id}`)}>
                    <Td>{inv.invoice_number || inv._id}</Td>
                    <Td>{formatCurrency(inv.total || 0)}</Td>
                    <Td><StatusBadge $status={inv.status}>{inv.status}</StatusBadge></Td>
                    <Td>{formatDate(inv.due_date)}</Td>
                  </ClickableRow>
                ))}
              </tbody>
            </Table>
          </Card>
        </Section>
      )}

      <ButtonGroup>
        <Button onClick={() => navigate(`/admin/quotes/new?lead_id=${id}`)}>
          Create Quote
        </Button>
        <DangerButton onClick={() => setShowDelete(true)}>
          Delete Lead
        </DangerButton>
      </ButtonGroup>

      {showDelete && (
        <Modal onClick={() => setShowDelete(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Delete Lead</ModalTitle>
            <p style={{ marginBottom: 20 }}>
              Are you sure you want to delete this lead? This action cannot be undone.
            </p>
            <ButtonGroup>
              <DangerButton onClick={handleDelete}>Yes, Delete</DangerButton>
              <ButtonSecondary onClick={() => setShowDelete(false)}>Cancel</ButtonSecondary>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}
    </PageContainer>
  );
};

export default LeadDetail;
