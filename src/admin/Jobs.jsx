import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from './api';
import {
  PageContainer, PageTitle, Card, Table, Th, Td,
  StatusBadge, Select, FilterBar, ClickableRow, EmptyState,
} from './styles';

const StatusSelect = styled(Select)`
  max-width: 200px;
`;

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString() : '—';

const STATUSES = ['', 'scheduled', 'in_progress', 'completed', 'cancelled'];

const statusLabel = (s) => {
  if (s === 'in_progress') return 'In Progress';
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
};

const Jobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchJobs = async (st) => {
    setLoading(true);
    try {
      const params = {};
      if (st) params.status = st;
      const res = await api.get('/jobs', { params });
      setJobs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(status);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <PageContainer>
      <PageTitle>Jobs</PageTitle>

      <FilterBar>
        <StatusSelect value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </StatusSelect>
      </FilterBar>

      <Card>
        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Loading...</p>
        ) : jobs.length === 0 ? (
          <EmptyState>No jobs found.</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Client</Th>
                <Th>Address</Th>
                <Th>Status</Th>
                <Th>Start Date</Th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <ClickableRow key={j._id} onClick={() => navigate(`/admin/jobs/${j._id}`)}>
                  <Td>{j.title}</Td>
                  <Td>{j.lead_name || '—'}</Td>
                  <Td>{j.address || '—'}</Td>
                  <Td><StatusBadge $status={j.status}>{statusLabel(j.status)}</StatusBadge></Td>
                  <Td>{formatDate(j.start_date)}</Td>
                </ClickableRow>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </PageContainer>
  );
};

export default Jobs;
