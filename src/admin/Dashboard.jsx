import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import api from './api';
import {
  PageContainer, PageTitle, Card, Table, Th, Td,
  SummaryGrid, SummaryCard, SummaryLabel, SummaryValue,
  StatusBadge, ClickableRow, EmptyState,
} from './styles';

const SectionTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 16px;
`;

const ViewAllLink = styled(Link)`
  display: block;
  text-align: right;
  margin-top: 16px;
  color: var(--primary);
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const Section = styled.div`
  margin-bottom: 32px;
`;

const WarningCard = styled(Card)`
  border-left: 4px solid #e65100;
`;

const formatCurrency = (val) =>
  Number(val).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString() : '—';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsRes, jobsRes, invoicesSentRes, invoicesOverdueRes, financeRes] = await Promise.all([
          api.get('/leads', { params: { status: 'new', limit: 5 } }),
          api.get('/jobs', { params: { status: 'scheduled' } }),
          api.get('/invoices', { params: { status: 'sent' } }),
          api.get('/invoices', { params: { status: 'overdue' } }),
          api.get('/finances/summary'),
        ]);
        setData({
          leads: leadsRes.data,
          jobs: jobsRes.data,
          invoicesSent: invoicesSentRes.data,
          invoicesOverdue: invoicesOverdueRes.data,
          finance: financeRes.data,
        });
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <PageContainer><PageTitle>Dashboard</PageTitle><p>Loading...</p></PageContainer>;
  if (!data) return <PageContainer><PageTitle>Dashboard</PageTitle><p>Failed to load dashboard data.</p></PageContainer>;

  const { leads, jobs, invoicesSent, invoicesOverdue, finance } = data;
  const recentLeads = leads.leads || [];
  const upcomingJobs = Array.isArray(jobs) ? jobs : (jobs.jobs || []);
  const overdueList = Array.isArray(invoicesOverdue) ? invoicesOverdue : (invoicesOverdue.invoices || []);
  const sentList = Array.isArray(invoicesSent) ? invoicesSent : (invoicesSent.invoices || []);

  return (
    <PageContainer>
      <PageTitle>Dashboard</PageTitle>

      <SummaryGrid>
        <SummaryCard>
          <SummaryLabel>New Leads</SummaryLabel>
          <SummaryValue>{leads.total || 0}</SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Active Jobs</SummaryLabel>
          <SummaryValue>{upcomingJobs.length}</SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Outstanding Invoices</SummaryLabel>
          <SummaryValue>{sentList.length + overdueList.length}</SummaryValue>
        </SummaryCard>
        <SummaryCard>
          <SummaryLabel>Revenue This Month</SummaryLabel>
          <SummaryValue>{formatCurrency(finance.this_month || 0)}</SummaryValue>
        </SummaryCard>
      </SummaryGrid>

      <Section>
        <Card>
          <SectionTitle>Recent Leads</SectionTitle>
          {recentLeads.length === 0 ? (
            <EmptyState>No new leads yet.</EmptyState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Source</Th>
                  <Th>Date</Th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <ClickableRow key={lead._id} onClick={() => navigate(`/admin/leads/${lead._id}`)}>
                    <Td>{lead.name}</Td>
                    <Td>{lead.source}</Td>
                    <Td>{formatDate(lead.created_at)}</Td>
                  </ClickableRow>
                ))}
              </tbody>
            </Table>
          )}
          <ViewAllLink to="/admin/leads">View All Leads &rarr;</ViewAllLink>
        </Card>
      </Section>

      <Section>
        <Card>
          <SectionTitle>Upcoming Jobs</SectionTitle>
          {upcomingJobs.length === 0 ? (
            <EmptyState>No upcoming jobs.</EmptyState>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Title</Th>
                  <Th>Client</Th>
                  <Th>Start Date</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {upcomingJobs.map((job) => (
                  <ClickableRow key={job._id} onClick={() => navigate(`/admin/jobs/${job._id}`)}>
                    <Td>{job.title}</Td>
                    <Td>{job.client_name || job.lead?.name || '—'}</Td>
                    <Td>{formatDate(job.start_date)}</Td>
                    <Td><StatusBadge $status={job.status}>{job.status}</StatusBadge></Td>
                  </ClickableRow>
                ))}
              </tbody>
            </Table>
          )}
          <ViewAllLink to="/admin/jobs">View All Jobs &rarr;</ViewAllLink>
        </Card>
      </Section>

      {overdueList.length > 0 && (
        <Section>
          <WarningCard>
            <SectionTitle>Overdue Invoices</SectionTitle>
            <Table>
              <thead>
                <tr>
                  <Th>Invoice #</Th>
                  <Th>Client</Th>
                  <Th>Total</Th>
                  <Th>Due Date</Th>
                </tr>
              </thead>
              <tbody>
                {overdueList.map((inv) => (
                  <ClickableRow key={inv._id} onClick={() => navigate(`/admin/invoices/${inv._id}`)}>
                    <Td>{inv.invoice_number || inv._id}</Td>
                    <Td>{inv.client_name || inv.lead?.name || '—'}</Td>
                    <Td>{formatCurrency(inv.total || 0)}</Td>
                    <Td>{formatDate(inv.due_date)}</Td>
                  </ClickableRow>
                ))}
              </tbody>
            </Table>
          </WarningCard>
        </Section>
      )}
    </PageContainer>
  );
};

export default Dashboard;
