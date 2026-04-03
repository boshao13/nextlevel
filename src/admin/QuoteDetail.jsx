import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import api from './api';
import {
  PageContainer, PageTitle, Card, Table, Th, Td,
  StatusBadge, Button, ButtonSecondary, Input, TextArea,
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

const DangerButton = styled(Button)`
  background: #c62828;
  &:hover { background: #b71c1c; }
`;

const SuccessButton = styled(Button)`
  background: #2e7d32;
  &:hover { background: #1b5e20; }
`;

const WarningButton = styled(Button)`
  background: #e65100;
  &:hover { background: #bf360c; }
`;

const LineItemInput = styled(Input)`
  min-width: 60px;
`;

const TotalsCard = styled(Card)`
  max-width: 400px;
  margin-left: auto;
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 0.95rem;
  color: var(--text);
  ${({ $bold }) => $bold && 'font-weight: 700; font-size: 1.1rem;'}
  ${({ $border }) => $border && 'border-top: 2px solid #eee; margin-top: 4px; padding-top: 12px;'}
`;

const TaxInput = styled(Input)`
  width: 80px;
  display: inline-block;
  text-align: right;
`;

const RemoveBtn = styled.button`
  background: none;
  border: none;
  color: #c62828;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px 8px;
  font-weight: 700;
  &:hover { color: #b71c1c; }
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

const formatCurrency = (val) =>
  Number(val || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const emptyLineItem = () => ({ item: '', qty: 1, unit_price: 0 });

const QuoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isNew = id === 'new';
  const leadIdParam = isNew ? new URLSearchParams(location.search).get('lead_id') : null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leadInfo, setLeadInfo] = useState(null);
  const [description, setDescription] = useState('');
  const [lineItems, setLineItems] = useState([emptyLineItem()]);
  const [taxRate, setTaxRate] = useState(7.31);
  const [quoteStatus, setQuoteStatus] = useState('draft');
  const [quoteId, setQuoteId] = useState(isNew ? null : id);
  const [leadId, setLeadId] = useState(leadIdParam);

  // Accept-flow modal
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [jobForm, setJobForm] = useState({ title: '', address: '', start_date: '', end_date: '' });

  /* ── data fetching ── */

  useEffect(() => {
    const load = async () => {
      try {
        if (isNew) {
          if (leadIdParam) {
            const res = await api.get(`/leads/${leadIdParam}`);
            setLeadInfo({ name: res.data.name, email: res.data.email, phone: res.data.phone });
            setLeadId(leadIdParam);
          }
        } else {
          const res = await api.get(`/quotes/${id}`);
          const q = res.data;
          setDescription(q.description || '');
          setLineItems(q.line_items && q.line_items.length > 0 ? q.line_items : [emptyLineItem()]);
          setTaxRate(q.tax_rate != null ? Number((q.tax_rate * 100).toFixed(4)) : 7.31);
          setQuoteStatus(q.status || 'draft');
          setLeadId(q.lead_id);
          setLeadInfo({
            name: q.lead_name || '—',
            email: q.lead_email || '',
            phone: q.lead_phone || '',
          });
        }
      } catch (err) {
        console.error('Failed to load quote data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isNew, leadIdParam]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── line-item helpers ── */

  const updateLineItem = (idx, field, value) => {
    setLineItems((prev) => prev.map((li, i) =>
      i === idx ? { ...li, [field]: value } : li
    ));
  };

  const removeLineItem = (idx) => {
    setLineItems((prev) => prev.length <= 1 ? [emptyLineItem()] : prev.filter((_, i) => i !== idx));
  };

  const addLineItem = () => {
    setLineItems((prev) => [...prev, emptyLineItem()]);
  };

  /* ── totals ── */

  const subtotal = useMemo(
    () => lineItems.reduce((sum, li) => sum + (Number(li.qty) || 0) * (Number(li.unit_price) || 0), 0),
    [lineItems]
  );
  const taxDecimal = (Number(taxRate) || 0) / 100;
  const taxAmount = subtotal * taxDecimal;
  const total = subtotal + taxAmount;

  /* ── save ── */

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        lead_id: leadId,
        description,
        line_items: lineItems,
        tax_rate: taxDecimal,
      };
      if (isNew || !quoteId) {
        const res = await api.post('/quotes', body);
        const newId = res.data._id || res.data.id;
        setQuoteId(newId);
        navigate(`/admin/quotes/${newId}`, { replace: true });
      } else {
        await api.put(`/quotes/${quoteId}`, body);
      }
    } catch (err) {
      console.error('Failed to save quote:', err);
    } finally {
      setSaving(false);
    }
  };

  /* ── status actions ── */

  const handleStatusUpdate = async (newStatus) => {
    try {
      await api.put(`/quotes/${quoteId}`, { status: newStatus });
      setQuoteStatus(newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleAccept = async () => {
    try {
      await api.put(`/quotes/${quoteId}`, { status: 'accepted' });
      setQuoteStatus('accepted');
      setJobForm({
        title: `Job for ${leadInfo?.name || ''}`,
        address: '',
        start_date: '',
        end_date: '',
      });
      setShowAcceptModal(true);
    } catch (err) {
      console.error('Failed to accept quote:', err);
    }
  };

  const handleCreateJob = async () => {
    try {
      const res = await api.post('/jobs', {
        quote_id: quoteId,
        title: jobForm.title,
        address: jobForm.address,
        start_date: jobForm.start_date,
        end_date: jobForm.end_date,
      });
      const newJobId = res.data._id || res.data.id;
      navigate(`/admin/jobs/${newJobId}`);
    } catch (err) {
      console.error('Failed to create job:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this quote?')) return;
    try {
      await api.delete(`/quotes/${quoteId}`);
      navigate('/admin/quotes');
    } catch (err) {
      console.error('Failed to delete quote:', err);
    }
  };

  const handleDownloadPdf = () => {
    window.open(`/api/quotes/${quoteId}/pdf`, '_blank');
  };

  /* ── render ── */

  if (loading) return <PageContainer><p>Loading...</p></PageContainer>;

  return (
    <PageContainer>
      <HeaderRow>
        <PageTitle style={{ marginBottom: 0 }}>
          {isNew && !quoteId ? 'New Quote' : 'Quote Detail'}
        </PageTitle>
        {!isNew && <StatusBadge $status={quoteStatus}>{quoteStatus}</StatusBadge>}
      </HeaderRow>

      {/* Lead info */}
      {leadInfo && (
        <Section>
          <Card>
            <SectionTitle>Client</SectionTitle>
            <InfoGrid>
              <InfoItem><InfoLabel>Name</InfoLabel>{leadInfo.name}</InfoItem>
              <InfoItem><InfoLabel>Email</InfoLabel>{leadInfo.email || '—'}</InfoItem>
              <InfoItem><InfoLabel>Phone</InfoLabel>{leadInfo.phone || '—'}</InfoItem>
            </InfoGrid>
          </Card>
        </Section>
      )}

      {/* Description */}
      <Section>
        <FormGroup>
          <FormLabel>Description</FormLabel>
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Quote description..."
          />
        </FormGroup>
      </Section>

      {/* Line items */}
      <Section>
        <Card>
          <SectionTitle>Line Items</SectionTitle>
          <Table>
            <thead>
              <tr>
                <Th>Item Description</Th>
                <Th style={{ width: 90 }}>Qty</Th>
                <Th style={{ width: 130 }}>Unit Price</Th>
                <Th style={{ width: 130 }}>Line Total</Th>
                <Th style={{ width: 50 }}></Th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li, idx) => (
                <tr key={idx}>
                  <Td>
                    <LineItemInput
                      value={li.item}
                      onChange={(e) => updateLineItem(idx, 'item', e.target.value)}
                      placeholder="Description"
                    />
                  </Td>
                  <Td>
                    <LineItemInput
                      type="number"
                      min="0"
                      value={li.qty}
                      onChange={(e) => updateLineItem(idx, 'qty', e.target.value)}
                    />
                  </Td>
                  <Td>
                    <LineItemInput
                      type="number"
                      min="0"
                      step="0.01"
                      value={li.unit_price}
                      onChange={(e) => updateLineItem(idx, 'unit_price', e.target.value)}
                    />
                  </Td>
                  <Td>{formatCurrency((Number(li.qty) || 0) * (Number(li.unit_price) || 0))}</Td>
                  <Td>
                    <RemoveBtn onClick={() => removeLineItem(idx)} title="Remove">&times;</RemoveBtn>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div style={{ marginTop: 12 }}>
            <ButtonSecondary onClick={addLineItem}>+ Add Line Item</ButtonSecondary>
          </div>
        </Card>
      </Section>

      {/* Totals */}
      <Section>
        <TotalsCard>
          <SectionTitle>Totals</SectionTitle>
          <TotalRow>
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </TotalRow>
          <TotalRow>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Tax Rate
              <TaxInput
                type="number"
                min="0"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
              %
            </span>
            <span>{formatCurrency(taxAmount)}</span>
          </TotalRow>
          <TotalRow $bold $border>
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </TotalRow>
        </TotalsCard>
      </Section>

      {/* Actions */}
      <ButtonGroup>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Quote'}
        </Button>

        {!isNew && quoteId && (
          <>
            <ButtonSecondary onClick={handleDownloadPdf}>Download PDF</ButtonSecondary>

            {quoteStatus === 'draft' && (
              <WarningButton onClick={() => handleStatusUpdate('sent')}>Mark Sent</WarningButton>
            )}
            {(quoteStatus === 'draft' || quoteStatus === 'sent') && (
              <SuccessButton onClick={handleAccept}>Mark Accepted</SuccessButton>
            )}
            {(quoteStatus === 'draft' || quoteStatus === 'sent') && (
              <ButtonSecondary onClick={() => handleStatusUpdate('declined')}>Mark Declined</ButtonSecondary>
            )}
            {quoteStatus === 'draft' && (
              <DangerButton onClick={handleDelete}>Delete</DangerButton>
            )}
          </>
        )}
      </ButtonGroup>

      {/* Accept modal — create job */}
      {showAcceptModal && (
        <Modal onClick={() => setShowAcceptModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Create Job</ModalTitle>
            <FormGroup>
              <FormLabel>Title</FormLabel>
              <Input
                value={jobForm.title}
                onChange={(e) => setJobForm((f) => ({ ...f, title: e.target.value }))}
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>Address</FormLabel>
              <Input
                value={jobForm.address}
                onChange={(e) => setJobForm((f) => ({ ...f, address: e.target.value }))}
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>Start Date</FormLabel>
              <Input
                type="date"
                value={jobForm.start_date}
                onChange={(e) => setJobForm((f) => ({ ...f, start_date: e.target.value }))}
              />
            </FormGroup>
            <FormGroup>
              <FormLabel>End Date</FormLabel>
              <Input
                type="date"
                value={jobForm.end_date}
                onChange={(e) => setJobForm((f) => ({ ...f, end_date: e.target.value }))}
              />
            </FormGroup>
            <ButtonGroup>
              <Button onClick={handleCreateJob}>Create Job</Button>
              <ButtonSecondary onClick={() => setShowAcceptModal(false)}>Cancel</ButtonSecondary>
            </ButtonGroup>
          </ModalContent>
        </Modal>
      )}
    </PageContainer>
  );
};

export default QuoteDetail;
