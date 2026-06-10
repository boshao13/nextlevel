// src/admin/PaySchedule.jsx — read-only pay schedule reference.
// Data lives in payScheduleData.js (owner-provided, hand-adjusted paydays).
import React from 'react';
import styled from 'styled-components';
import { PageContainer, PageTitle, Card, Table, Th, Td } from './styles';
import { PAY_SCHEDULE } from './payScheduleData';

// 'YYYY-MM-DD' → 'MM/DD/YYYY' (string ops only — never new Date(iso))
const fmtUS = (ymd) => {
  const [y, m, d] = String(ymd).split('-');
  return `${m}/${d}/${y}`;
};

function todayYMD() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const TopGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  @media (max-width: 700px) { grid-template-columns: 1fr; }
`;

const TopLabel = styled.div`
  font-size: 0.78rem;
  font-weight: 600;
  color: #4a5468;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const TopValue = styled.div`
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f4c81;
  margin-top: 4px;
`;

const Row = styled.tr`
  background: ${({ $current }) => ($current ? '#eef6ff' : 'transparent')};
  font-weight: ${({ $current }) => ($current ? 700 : 400)};
  opacity: ${({ $past }) => ($past ? 0.55 : 1)};
`;

const PaySchedule = () => {
  const today = todayYMD();
  const current = PAY_SCHEDULE.find((r) => today >= r.start && today <= r.end);
  const nextSubmit = PAY_SCHEDULE.find((r) => r.submitBy >= today);
  const nextPayday = PAY_SCHEDULE.find((r) => r.payday >= today);

  return (
    <PageContainer>
      <PageTitle>Pay Schedule</PageTitle>

      <TopGrid>
        <Card>
          <TopLabel>Current pay period</TopLabel>
          <TopValue>
            {current ? `${fmtUS(current.start)} – ${fmtUS(current.end)}` : '—'}
          </TopValue>
        </Card>
        <Card>
          <TopLabel>Submit payroll by</TopLabel>
          <TopValue>{nextSubmit ? fmtUS(nextSubmit.submitBy) : '—'}</TopValue>
        </Card>
        <Card>
          <TopLabel>Next payday</TopLabel>
          <TopValue>{nextPayday ? fmtUS(nextPayday.payday) : '—'}</TopValue>
        </Card>
      </TopGrid>

      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Pay period</Th>
              <Th>Submit payroll by</Th>
              <Th>Payday</Th>
            </tr>
          </thead>
          <tbody>
            {PAY_SCHEDULE.map((r) => (
              <Row
                key={r.start}
                $current={current && r.start === current.start}
                $past={r.end < today}
              >
                <Td>{fmtUS(r.start)} – {fmtUS(r.end)}</Td>
                <Td>{fmtUS(r.submitBy)}</Td>
                <Td>{fmtUS(r.payday)}</Td>
              </Row>
            ))}
          </tbody>
        </Table>
        <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: 0 }}>
          Schedule covers {fmtUS(PAY_SCHEDULE[0].start)} – {fmtUS(PAY_SCHEDULE[PAY_SCHEDULE.length - 1].end)}.
          Paydays are adjusted for weekends and holidays.
        </p>
      </Card>
    </PageContainer>
  );
};

export default PaySchedule;
