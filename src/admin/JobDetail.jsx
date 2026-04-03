import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import api from './api';
import {
  PageContainer, PageTitle, Card, Table, Th, Td,
  StatusBadge, Button, ButtonSecondary, Input,
  Modal, ModalContent, ModalTitle,
} from './styles';

/* ── styled helpers ── */

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
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

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 8px;
`;

const InfoLabel = styled.div`
  font-size: 0.75rem;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
  font-weight: 700;
`;

const InfoItem = styled.div`
  font-size: 0.9rem;
  color: var(--text);
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const SuccessButton = styled(Button)`
  background: #2e7d32;
  &:hover { background: #1b5e20; }
`;

const WarningButton = styled(Button)`
  background: #e65100;
  &:hover { background: #bf360c; }
`;

const StyledLink = styled(Link)`
  color: var(--primary);
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const SmallButton = styled.button`
  padding: 4px 10px;
  font-size: 0.78rem;
  border-radius: 6px;
  background: var(--primary);
  color: white;
  border: none;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  margin-right: 6px;
  &:hover { background: var(--primary-dark); }
`;

const SmallDangerButton = styled(SmallButton)`
  background: #c62828;
  &:hover { background: #b71c1c; }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  font-size: 0.82rem;
  font-weight: 700;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
`;

/* ── helpers ── */

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString() : '—';

const formatCurrency = (val) =>
  Number(val || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const statusLabel = (s) => {
  if (s === 'in_progress') return 'In Progress';
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
};

const emptyScheduleEntry = () => ({ date: '', start_time: '', end_time: '', notes: '' });

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  // Schedule modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleEntry());
  const [editingScheduleId, setEditingScheduleId] = useState(null);

  // Complete-job modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const fetchJob = async () => {
    try {
      const res = await api.get(`/jobs/${id}`);
      setJob(res.data);
    } catch (err) {
      console.error('Failed to fetch job:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── status actions ── */

  const handleStartJob = async () => {
    try {
      await api.put(`/jobs/${id}`, { status: 'in_progress' });
      await fetchJob();
    } catch (err) {
      console.error('Failed to start job:', err);
    }
  };

  const handleCompleteJob = async () => {
    try {
      await api.put(`/jobs/${id}`, { status: 'completed' });
      await fetchJob();
      setShowCompleteModal(true);
    } catch (err) {
      console.error('Failed to complete job:', err);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      const res = await api.post('/invoices', { job_id: id });
      const newId = res.data._id || res.data.id;
      navigate(`/admin/invoices/${newId}`);
    } catch (err) {
      console.error('Failed to create invoice:', err);
      setShowCompleteModal(false);
    }
  };

  /* ── schedule CRUD ── */

  const openAddSchedule = () => {
    setEditingScheduleId(null);
    setScheduleForm(emptyScheduleEntry());
    setShowScheduleModal(true);
  };

  const openEditSchedule = (entry) => {
    setEditingScheduleId(entry._id);
    setScheduleForm({
      date: entry.date ? entry.date.slice(0, 10) : '',
      start_time: entry.start_time || '',
      end_time: entry.end_time || '',
      notes: entry.notes || '',
    });
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = async () => {
    try {
      if (editingScheduleId) {
        await api.put(`/schedule/${editingScheduleId}`, scheduleForm);
      } else {
        await api.post('/schedule', { job_id: id, ...scheduleForm });
      }
      setShowScheduleModal(false);
      await fetchJob();
    } catch (err) {
      console.error('Failed to save schedule entry:', err);
    }
  };

  const handleDeleteSchedule = async (entryId) => {
    if (!window.confirm('Delete this schedule entry?')) return;
    try {
      await api.delete(`/schedule/${entryId}`);
      await fetchJob();
    } catch (err) {
      console.error('Failed to delete schedule entry:', err);
    }
  };

  /* ── render ── */

  if (loading) return <PageContainer><p>Loading...</p></PageContainer>;
  if (!job) return <PageContainer><p>Job not found.</p></PageContainer>;

  const schedule = job.schedule || [];
  const quote = job.quote || null;

  return (
    <PageContainer>
      {/* Header */}
      <HeaderRow>
        <PageTitle style={{ marginBottom: 0 }}>{job.title}</PageTitle>
        <StatusBadge $status={job.status}>{statusLabel(job.status)}</StatusBadge>
      </HeaderRow>

      {/* Status actions */}
      <Section>
        <ButtonGroup>
          {job.status === 'scheduled' && (
            <WarningButton onClick={handleStartJob}>Start Job</WarningButton>
          )}
          {job.status === 'in_progress' && (
            <SuccessButton onClick={handleCompleteJob}>Complete Job</SuccessButton>
          )}
        </ButtonGroup>
      </Section>

      {/* Info card */}
      <Section>
        <Card>
          <SectionTitle>Job Details</SectionTitle>
          <InfoGrid>
            <InfoItem>
              <InfoLabel>Address</InfoLabel>
              {job.address || '—'}
            </InfoItem>
            <InfoItem>
              <InfoLabel>Start Date</InfoLabel>
              {formatDate(job.start_date)}
            </InfoItem>
            <InfoItem>
              <InfoLabel>End Date</InfoLabel>
              {formatDate(job.end_date)}
            </InfoItem>
            <InfoItem>
              <InfoLabel>Client</InfoLabel>
              {job.lead_id ? (
                <StyledLink to={`/admin/leads/${job.lead_id}`}>{job.lead_name || '—'}</StyledLink>
              ) : (
                job.lead_name || '—'
              )}
            </InfoItem>
            <InfoItem>
              <InfoLabel>Phone</InfoLabel>
              {job.lead_phone || '—'}
            </InfoItem>
            <InfoItem>
              <InfoLabel>Email</InfoLabel>
              {job.lead_email || '—'}
            </InfoItem>
          </InfoGrid>
        </Card>
      </Section>

      {/* Quote info */}
      {quote && (
        <Section>
          <Card>
            <SectionTitle>Quote</SectionTitle>
            <InfoGrid>
              <InfoItem>
                <InfoLabel>Quote</InfoLabel>
                <StyledLink to={`/admin/quotes/${quote._id || job.quote_id}`}>View Quote</StyledLink>
              </InfoItem>
              <InfoItem>
                <InfoLabel>Quote Total</InfoLabel>
                {formatCurrency(quote.total)}
              </InfoItem>
            </InfoGrid>
          </Card>
        </Section>
      )}

      {/* Schedule */}
      <Section>
        <Card>
          <SectionTitle>Schedule</SectionTitle>
          {schedule.length === 0 ? (
            <p style={{ color: '#999', marginBottom: 16 }}>No schedule entries yet.</p>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Start Time</Th>
                  <Th>End Time</Th>
                  <Th>Notes</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((entry) => (
                  <tr key={entry._id}>
                    <Td>{formatDate(entry.date)}</Td>
                    <Td>{entry.start_time || '—'}</Td>
                    <Td>{entry.end_time || '—'}</Td>
                    <Td>{entry.notes || '—'}</Td>
                    <Td>
                      <SmallButton onClick={() => openEditSchedule(entry)}>Edit</SmallButton>
                      <SmallDangerButton onClick={() => handleDeleteSchedule(entry._id)}>Delete</SmallDangerButton>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <div style={{ marginTop: 12 }}>
            <ButtonSecondary onClick={openAddSchedule}>+ Add Schedule Entry</ButtonSecondary>
          </div>
        </Card>
      </Section>

      {/* Schedule modal */}
      {showScheduleModal && (
        <Modal onClick={() => setShowScheduleModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{editingScheduleId ? 'Edit Schedule Entry' : 'Add Schedule Entry'}</ModalTitle>
            <FormGroup>
              <FormLabel>Date *</FormLabel>
              <Input
                type="date"
                required
                value={scheduleForm.date}
                onChange={(e) => setScheduleForm((f) => ({ ...f, date: e.target.value }))}
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>Start Time</FormLabel>
              <Input
                type="time"
                value={scheduleForm.start_time}
                onChange={(e) => setScheduleForm((f) => ({ ...f, start_time: e.target.value }))}
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>End Time</FormLabel>
              <Input
                type="time"
                value={scheduleForm.end_time}
                onChange={(e) => setScheduleForm((f) => ({ ...f, end_time: e.target.value }))}
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>Notes</FormLabel>
              <Input
                value={scheduleForm.notes}
                onChange={(e) => setScheduleForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes"
              />
            </FormGroup>
            <ButtonGroup>
              <Button onClick={handleScheduleSubmit}>
                {editingScheduleId ? 'Update' : 'Add'}
              </Button>
              <ButtonSecondary onClick={() => setShowScheduleModal(false)}>Cancel</ButtonSecondary>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}

      {/* Complete-job modal */}
      {showCompleteModal && (
        <Modal onClick={() => setShowCompleteModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Job Completed</ModalTitle>
            <p style={{ marginBottom: 20 }}>Create an invoice for this job?</p>
            <ButtonGroup>
              <Button onClick={handleCreateInvoice}>Yes, Create Invoice</Button>
              <ButtonSecondary onClick={() => setShowCompleteModal(false)}>No, Thanks</ButtonSecondary>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}
    </PageContainer>
  );
};

export default JobDetail;
