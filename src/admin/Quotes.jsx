import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from './api';
import {
  PageContainer, PageTitle, Card, Table, Th, Td,
  StatusBadge, Select, FilterBar, ClickableRow, EmptyState,
} from './styles';

const StatusSelect = styled(Select)`
  max-width: 180px;
`;

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString() : '—';

const formatCurrency = (val) =>
  Number(val || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const truncate = (str, len = 60) => {
  if (!str) return '—';
  return str.length > len ? str.slice(0, len) + '...' : str;
};

const STATUSES = ['', 'draft', 'sent', 'accepted', 'declined'];

const Quotes = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchQuotes = async (st) => {
    setLoading(true);
    try {
      const params = {};
      if (st) params.status = st;
      const res = await api.get('/quotes', { params });
      setQuotes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes(status);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <PageContainer>
      <PageTitle>Quotes</PageTitle>

      <FilterBar>
        <StatusSelect value={status} onChange={(e) => { setStatus(e.target.value); }}>
          <option value="">All Statuses</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </StatusSelect>
      </FilterBar>

      <Card>
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Loading...</p>
        ) : quotes.length === 0 ? (
          <EmptyState>No quotes found.</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Lead Name</Th>
                <Th>Description</Th>
                <Th>Total</Th>
                <Th>Status</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <ClickableRow key={q._id} onClick={() => navigate(`/admin/quotes/${q._id}`)}>
                  <Td>{q.lead_name || '—'}</Td>
                  <Td>{truncate(q.description)}</Td>
                  <Td>{formatCurrency(q.total)}</Td>
                  <Td><StatusBadge $status={q.status}>{q.status}</StatusBadge></Td>
                  <Td>{formatDate(q.created_at)}</Td>
                </ClickableRow>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </PageContainer>
  );
};

export default Quotes;
