import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import api from './api';
import {
  PageContainer,
  PageTitle,
  Card,
  Table,
  Th,
  Td,
  StatusBadge,
  Button,
  ButtonSecondary,
  ActionButton,
  Modal,
  ModalContent,
  ModalTitle,
  Input,
} from './styles';

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 8px;
`;

const InfoItem = styled.div`
  label {
    display: block;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #999;
    margin-bottom: 4px;
    font-weight: 700;
  }
  span {
    font-size: 0.95rem;
    color: var(--text);
    font-weight: 500;
  }
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 16px;
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 24px;
  padding: 12px 16px;
  font-size: 0.9rem;

  span:first-child {
    color: #666;
    font-weight: 600;
  }
  span:last-child {
    color: var(--text);
    font-weight: 700;
    min-width: 100px;
    text-align: right;
  }
`;

const BalanceRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 0.95rem;

  &:last-child {
    font-weight: 700;
    font-size: 1.05rem;
    border-top: 2px solid #eee;
    padding-top: 12px;
    margin-top: 4px;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 16px;
  label {
    display: block;
    font-size: 0.82rem;
    font-weight: 600;
    margin-bottom: 6px;
    color: var(--text);
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 20px;
  label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.9rem;
    cursor: pointer;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
`;

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

const InvoiceDetail = () => {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState(false);
  const [payForm, setPayForm] = useState({
    amount: '',
    method: 'cash',
    check_number: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const fetchInvoice = useCallback(() => {
    api.get(`/invoices/${id}`)
      .then((r) => setInvoice(r.data))
      .catch(() => setInvoice(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchInvoice(); }, [fetchInvoice]);

  if (loading) return <PageContainer><PageTitle>Loading...</PageTitle></PageContainer>;
  if (!invoice) return <PageContainer><PageTitle>Invoice not found</PageTitle></PageContainer>;

  const payments = invoice.payments || [];
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const remaining = Number(invoice.total || 0) - totalPaid;

  const openPaymentModal = () => {
    setPayForm({
      amount: remaining > 0 ? remaining.toFixed(2) : '',
      method: 'cash',
      check_number: '',
      payment_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setPaymentModal(true);
  };

  const handlePayment = (e) => {
    e.preventDefault();
    api.post('/payments', {
      invoice_id: invoice.id,
      amount: Number(payForm.amount),
      method: payForm.method,
      check_number: payForm.method === 'check' ? payForm.check_number : null,
      notes: payForm.notes,
      payment_date: payForm.payment_date,
    }).then(() => {
      setPaymentModal(false);
      fetchInvoice();
    }).catch(() => alert('Failed to record payment.'));
  };

  const updateStatus = (newStatus) => {
    api.put(`/invoices/${id}`, { status: newStatus }).then(() => fetchInvoice())
      .catch(() => alert('Failed to update status.'));
  };

  return (
    <PageContainer>
      <Header>
        <PageTitle style={{ marginBottom: 0 }}>Invoice #{invoice.invoice_number}</PageTitle>
        <StatusBadge $status={invoice.status}>{invoice.status}</StatusBadge>
      </Header>

      {/* Invoice Info */}
      <Card style={{ marginBottom: 24 }}>
        <InfoGrid>
          <InfoItem>
            <label>Invoice Number</label>
            <span>{invoice.invoice_number}</span>
          </InfoItem>
          <InfoItem>
            <label>Date Created</label>
            <span>{invoice.created_at?.split('T')[0] || invoice.date_created}</span>
          </InfoItem>
          <InfoItem>
            <label>Due Date</label>
            <span>{invoice.due_date}</span>
          </InfoItem>
          <InfoItem>
            <label>Client</label>
            <span>{invoice.lead_name}</span>
          </InfoItem>
          <InfoItem>
            <label>Email</label>
            <span>{invoice.lead_email}</span>
          </InfoItem>
          <InfoItem>
            <label>Phone</label>
            <span>{invoice.lead_phone}</span>
          </InfoItem>
        </InfoGrid>
      </Card>

      {/* Line Items */}
      <Section>
        <Card>
          <SectionTitle>Line Items</SectionTitle>
          <Table>
            <thead>
              <tr>
                <Th>Item</Th>
                <Th style={{ textAlign: 'right' }}>Qty</Th>
                <Th style={{ textAlign: 'right' }}>Unit Price</Th>
                <Th style={{ textAlign: 'right' }}>Line Total</Th>
              </tr>
            </thead>
            <tbody>
              {(invoice.line_items || []).map((item, i) => (
                <tr key={i}>
                  <Td>{item.description}</Td>
                  <Td style={{ textAlign: 'right' }}>{item.quantity}</Td>
                  <Td style={{ textAlign: 'right' }}>{formatCurrency(item.unit_price)}</Td>
                  <Td style={{ textAlign: 'right' }}>{formatCurrency(item.line_total)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <TotalRow>
            <span>Subtotal</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </TotalRow>
          <TotalRow>
            <span>Tax</span>
            <span>{formatCurrency(invoice.tax)}</span>
          </TotalRow>
          <TotalRow style={{ borderTop: '2px solid #eee', paddingTop: 12 }}>
            <span style={{ fontSize: '1.05rem' }}>Total</span>
            <span style={{ fontSize: '1.05rem' }}>{formatCurrency(invoice.total)}</span>
          </TotalRow>
        </Card>
      </Section>

      {/* Payments */}
      <Section>
        <Card>
          <SectionTitle>Payments</SectionTitle>
          <div style={{ marginBottom: 16 }}>
            <BalanceRow>
              <span>Total Paid</span>
              <span>{formatCurrency(totalPaid)}</span>
            </BalanceRow>
            <BalanceRow>
              <span>Remaining Balance</span>
              <span>{formatCurrency(remaining)}</span>
            </BalanceRow>
          </div>

          {payments.length > 0 && (
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Amount</Th>
                  <Th>Method</Th>
                  <Th>Check #</Th>
                  <Th>Notes</Th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i}>
                    <Td>{p.payment_date}</Td>
                    <Td>{formatCurrency(p.amount)}</Td>
                    <Td style={{ textTransform: 'capitalize' }}>{p.method}</Td>
                    <Td>{p.check_number || '—'}</Td>
                    <Td>{p.notes || '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          <div style={{ marginTop: 16 }}>
            <Button onClick={openPaymentModal}>Record Payment</Button>
          </div>
        </Card>
      </Section>

      {/* Action Buttons */}
      <Actions>
        {invoice.status === 'draft' && (
          <ActionButton onClick={() => updateStatus('sent')}>Mark Sent</ActionButton>
        )}
        {invoice.status === 'sent' && (
          <ActionButton onClick={() => updateStatus('overdue')}>Mark Overdue</ActionButton>
        )}
        <ButtonSecondary
          onClick={() => window.open(`/api/invoices/${id}/pdf`, '_blank')}
        >
          Download PDF
        </ButtonSecondary>
      </Actions>

      {/* Record Payment Modal */}
      {paymentModal && (
        <Modal onClick={() => setPaymentModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Record Payment</ModalTitle>
            <form onSubmit={handlePayment}>
              <FormGroup>
                <label>Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <label>Method</label>
                <RadioGroup>
                  <label>
                    <input
                      type="radio"
                      name="method"
                      value="cash"
                      checked={payForm.method === 'cash'}
                      onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
                    />
                    Cash
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="method"
                      value="check"
                      checked={payForm.method === 'check'}
                      onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
                    />
                    Check
                  </label>
                </RadioGroup>
              </FormGroup>
              {payForm.method === 'check' && (
                <FormGroup>
                  <label>Check Number</label>
                  <Input
                    type="text"
                    value={payForm.check_number}
                    onChange={(e) => setPayForm({ ...payForm, check_number: e.target.value })}
                  />
                </FormGroup>
              )}
              <FormGroup>
                <label>Payment Date</label>
                <Input
                  type="date"
                  value={payForm.payment_date}
                  onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <label>Notes</label>
                <Input
                  type="text"
                  value={payForm.notes}
                  onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                  placeholder="Optional notes..."
                />
              </FormGroup>
              <ModalActions>
                <ButtonSecondary type="button" onClick={() => setPaymentModal(false)}>Cancel</ButtonSecondary>
                <Button type="submit">Record Payment</Button>
              </ModalActions>
            </form>
          </ModalContent>
        </Modal>
      )}
    </PageContainer>
  );
};

export default InvoiceDetail;
