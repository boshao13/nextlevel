import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import api from './api';
import {
  PageContainer,
  PageTitle,
  Card,
  SummaryGrid,
  SummaryCard,
  SummaryLabel,
  SummaryValue,
  Table,
  Th,
  Td,
  EmptyState,
} from './styles';

const ChartSection = styled.div`
  margin-bottom: 32px;
`;

const ChartTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 16px;
`;

const BarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
`;

const BarLabel = styled.span`
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text);
  min-width: 80px;
  text-align: right;
`;

const BarContainer = styled.div`
  flex: 1;
  background: #f0f0f0;
  height: 32px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
`;

const BarFill = styled.div`
  height: 100%;
  background: var(--primary);
  border-radius: 8px;
  width: ${({ $pct }) => $pct}%;
  transition: width 0.5s ease;
`;

const BarAmount = styled.span`
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text);
  min-width: 90px;
`;

const SectionTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 16px;
`;

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

const MONTH_NAMES = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];

function formatMonthLabel(m) {
  // m = "2026-01"
  const [y, mo] = m.split('-');
  return `${MONTH_NAMES[parseInt(mo, 10) - 1]} ${y}`;
}

const Finances = () => {
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    api.get('/finances/summary').then((r) => setSummary(r.data)).catch(() => {});
    api.get('/finances/monthly').then((r) => setMonthly(r.data)).catch(() => setMonthly([]));
    api.get('/payments').then((r) => setPayments(r.data)).catch(() => setPayments([]));
  }, []);

  const maxRevenue = monthly.reduce((max, m) => Math.max(max, m.revenue || 0), 0) || 1;

  return (
    <PageContainer>
      <PageTitle>Finances</PageTitle>

      {/* Summary Cards */}
      <SummaryGrid>
        <SummaryCard>
          <SummaryLabel>Total Revenue</SummaryLabel>
          <SummaryValue>{formatCurrency(summary?.total_revenue)}</SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>This Year</SummaryLabel>
          <SummaryValue>{formatCurrency(summary?.this_year)}</SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>This Quarter</SummaryLabel>
          <SummaryValue>{formatCurrency(summary?.this_quarter)}</SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>This Month</SummaryLabel>
          <SummaryValue>{formatCurrency(summary?.this_month)}</SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Outstanding Balance</SummaryLabel>
          <SummaryValue>{formatCurrency(summary?.outstanding_balance)}</SummaryValue>
        </SummaryCard>
      </SummaryGrid>

      {/* Monthly Revenue Chart */}
      <ChartSection>
        <Card>
          <ChartTitle>Monthly Revenue (Last 12 Months)</ChartTitle>
          {monthly.length === 0 ? (
            <EmptyState>No revenue data available.</EmptyState>
          ) : (
            monthly.map((m) => (
              <BarRow key={m.month}>
                <BarLabel>{formatMonthLabel(m.month)}</BarLabel>
                <BarContainer>
                  <BarFill $pct={(m.revenue / maxRevenue) * 100} />
                </BarContainer>
                <BarAmount>{formatCurrency(m.revenue)}</BarAmount>
              </BarRow>
            ))
          )}
        </Card>
      </ChartSection>

      {/* Payment History */}
      <Card>
        <SectionTitle>Payment History</SectionTitle>
        {payments.length === 0 ? (
          <EmptyState>No payments recorded yet.</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Invoice #</Th>
                <Th>Client</Th>
                <Th>Amount</Th>
                <Th>Method</Th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={i}>
                  <Td>{p.payment_date}</Td>
                  <Td>{p.invoice_number}</Td>
                  <Td>{p.lead_name}</Td>
                  <Td>{formatCurrency(p.amount)}</Td>
                  <Td style={{ textTransform: 'capitalize' }}>{p.method}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </PageContainer>
  );
};

export default Finances;
