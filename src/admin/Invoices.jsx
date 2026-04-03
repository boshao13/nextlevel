import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import {
  PageContainer,
  PageTitle,
  Card,
  Table,
  Th,
  Td,
  StatusBadge,
  Select,
  FilterBar,
  EmptyState,
  ClickableRow,
} from './styles';

const Invoices = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = status ? { status } : {};
    api.get('/invoices', { params })
      .then((r) => setInvoices(r.data))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, [status]);

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

  return (
    <PageContainer>
      <PageTitle>Invoices</PageTitle>

      <FilterBar>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ width: 'auto', minWidth: 160 }}
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </Select>
      </FilterBar>

      <Card>
        {!loading && invoices.length === 0 ? (
          <EmptyState>No invoices found.</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Invoice #</Th>
                <Th>Client</Th>
                <Th>Total</Th>
                <Th>Status</Th>
                <Th>Due Date</Th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <ClickableRow key={inv.id} onClick={() => navigate(`/admin/invoices/${inv.id}`)}>
                  <Td>{inv.invoice_number}</Td>
                  <Td>{inv.lead_name}</Td>
                  <Td>{formatCurrency(inv.total)}</Td>
                  <Td>
                    <StatusBadge $status={inv.status}>{inv.status}</StatusBadge>
                  </Td>
                  <Td>{inv.due_date}</Td>
                </ClickableRow>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </PageContainer>
  );
};

export default Invoices;
