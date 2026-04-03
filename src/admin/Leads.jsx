import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from './api';
import {
  PageContainer, PageTitle, Card, Table, Th, Td,
  StatusBadge, Input, Select, FilterBar, ClickableRow,
  EmptyState, Button, ButtonSecondary,
} from './styles';

const PaginationBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
  font-size: 0.9rem;
  color: var(--text);
`;

const SearchInput = styled(Input)`
  max-width: 280px;
`;

const StatusSelect = styled(Select)`
  max-width: 180px;
`;

const sourceLabels = {
  contact_form: 'Contact',
  commercial_form: 'Commercial',
  career_form: 'Career',
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString() : '—';

const STATUSES = ['', 'new', 'contacted', 'quoted', 'scheduled', 'completed', 'closed'];

const Leads = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const limit = 25;
  const debounceRef = useRef(null);

  const fetchLeads = useCallback(async (p, s, st) => {
    setLoading(true);
    try {
      const params = { page: p, limit };
      if (st) params.status = st;
      if (s) params.search = s;
      const res = await api.get('/leads', { params });
      setLeads(res.data.leads || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads(page, search, status);
  }, [page, status, fetchLeads]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchLeads(1, val, status);
    }, 300);
  };

  const handleStatusChange = (e) => {
    const val = e.target.value;
    setStatus(val);
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <PageContainer>
      <PageTitle>Leads</PageTitle>

      <FilterBar>
        <SearchInput
          placeholder="Search leads..."
          value={search}
          onChange={handleSearchChange}
        />
        <StatusSelect value={status} onChange={handleStatusChange}>
          <option value="">All Statuses</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </StatusSelect>
      </FilterBar>

      <Card>
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Loading...</p>
        ) : leads.length === 0 ? (
          <EmptyState>No leads found matching your filters.</EmptyState>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Phone</Th>
                  <Th>Source</Th>
                  <Th>Status</Th>
                  <Th>Date</Th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <ClickableRow key={lead._id} onClick={() => navigate(`/admin/leads/${lead._id}`)}>
                    <Td>{lead.name}</Td>
                    <Td>{lead.email}</Td>
                    <Td>{lead.phone || '—'}</Td>
                    <Td>{sourceLabels[lead.source] || lead.source || '—'}</Td>
                    <Td><StatusBadge $status={lead.status}>{lead.status}</StatusBadge></Td>
                    <Td>{formatDate(lead.created_at)}</Td>
                  </ClickableRow>
                ))}
              </tbody>
            </Table>

            <PaginationBar>
              <ButtonSecondary
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </ButtonSecondary>
              <span>Page {page} of {totalPages}</span>
              <ButtonSecondary
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </ButtonSecondary>
            </PaginationBar>
          </>
        )}
      </Card>
    </PageContainer>
  );
};

export default Leads;
