import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { FiCheck, FiX, FiPrinter, FiClock, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import api from './api';

const WORKERS = {
  jesus_garcia: { name: 'Jesus Garcia', rate: 30, color: '#0f4c81' },
  jerry_francia: { name: 'Jerry Francia', rate: 25, color: '#0d7377' },
};

// Same logic as Timesheet.jsx
// P1: (prev lastDay-2) → current 12. Payroll 13, deposit 15.
// P2: current 13 → current (lastDay-3). Payroll lastDay-2, deposit lastDay.
function getPayPeriod(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const lastDay = new Date(y, m + 1, 0).getDate();
  const p2End = lastDay - 3;
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (d <= 12) {
    const prevLast = new Date(y, m, 0).getDate();
    const startDate = new Date(y, m - 1, prevLast - 2);
    const endDate = new Date(y, m, 12);
    return {
      start: `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`,
      end: `${y}-${pad(m + 1)}-12`,
      label: `${fmt(startDate)} – ${fmt(endDate)}`,
      key: `${y}-${pad(m + 1)}-1`,
    };
  }
  if (d <= p2End) {
    const startDate = new Date(y, m, 13);
    const endDate = new Date(y, m, p2End);
    return {
      start: `${y}-${pad(m + 1)}-13`,
      end: `${y}-${pad(m + 1)}-${pad(p2End)}`,
      label: `${fmt(startDate)} – ${fmt(endDate)}`,
      key: `${y}-${pad(m + 1)}-2`,
    };
  }
  const startDate = new Date(y, m, lastDay - 2);
  const nextY = m === 11 ? y + 1 : y;
  const nextM = m === 11 ? 0 : m + 1;
  const endDate = new Date(nextY, nextM, 12);
  return {
    start: `${y}-${pad(m + 1)}-${pad(lastDay - 2)}`,
    end: `${nextY}-${pad(nextM + 1)}-12`,
    label: `${fmt(startDate)} – ${fmt(endDate)}`,
    key: `${nextY}-${pad(nextM + 1)}-1`,
  };
}

function getRecentPeriods(count = 6) {
  const periods = [];
  const seen = new Set();
  let cursor = new Date();
  for (let i = 0; i < count; i++) {
    const p = getPayPeriod(cursor);
    if (!seen.has(p.key)) {
      periods.push(p);
      seen.add(p.key);
    }
    // Step back: go to a date clearly in the prior period
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 16);
  }
  return periods;
}

function normalizeDateKey(apiDate) {
  return String(apiDate || '').slice(0, 10);
}

function normalizeTime(t) {
  return String(t || '').slice(0, 5);
}

const TRAILER_TRIPS = [
  { key: 'trailer_delivered_abq', label: 'Del ABQ',      minutes: 30 },
  { key: 'trailer_returned_abq',  label: 'Ret ABQ',      minutes: 30 },
  { key: 'trailer_delivered_sf',  label: 'Del Santa Fe', minutes: 60 },
  { key: 'trailer_returned_sf',   label: 'Ret Santa Fe', minutes: 60 },
];

function activeTrailerTrips(entry) {
  return TRAILER_TRIPS.filter((t) => !!entry[t.key]);
}

function trailerMinutes(entry) {
  return activeTrailerTrips(entry).reduce((sum, t) => sum + t.minutes, 0);
}

function formatDateLong(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatTimestamp(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  return `${days}d ago`;
}

const spin = keyframes`to { transform: rotate(360deg); }`;
const fadeIn = keyframes`from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); }`;

const Wrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f8fc 0%, #eef3fa 100%);
  padding: 16px 12px 60px;

  @media (min-width: 768px) {
    padding: 28px 24px 60px;
  }
`;

const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  animation: ${fadeIn} 0.3s ease;
`;

const Heading = styled.h1`
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text);
  margin: 0 0 16px;

  @media (min-width: 768px) {
    font-size: 1.8rem;
    margin-bottom: 20px;
  }
`;

const ControlBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: stretch;
  margin-bottom: 20px;

  @media (max-width: 600px) {
    > * { flex: 1 1 auto; }
  }

  @media print { display: none; }
`;

const PeriodSelect = styled.select`
  padding: 12px 34px 12px 14px;
  font-size: 16px;
  font-weight: 700;
  min-height: 48px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: white url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") no-repeat right 10px center / 14px;
  appearance: none;
  -webkit-appearance: none;
  font-family: inherit;
  cursor: pointer;
  outline: none;
  flex: 1;
  min-width: 0;
  width: 100%;

  &:focus {
    border-color: var(--primary);
  }

  @media (min-width: 600px) {
    min-width: 220px;
    width: auto;
  }
`;

const ActionBtn = styled.button`
  padding: 12px 16px;
  font-size: 0.92rem;
  font-weight: 700;
  min-height: 48px;
  font-family: inherit;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  -webkit-tap-highlight-color: transparent;
  background: ${({ $variant }) => $variant === 'primary' ? '#16a34a' : 'white'};
  color: ${({ $variant }) => $variant === 'primary' ? 'white' : 'var(--text)'};
  border: ${({ $variant }) => $variant === 'primary' ? 'none' : '1.5px solid #e2e8f0'};
  transition: transform 0.1s, box-shadow 0.15s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 24px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryCard = styled.div`
  background: white;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04), 0 10px 30px rgba(0,0,0,0.04);
`;

const SummaryHeader = styled.div`
  background: ${({ $color }) => $color};
  color: white;
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SummaryName = styled.div`
  font-size: 1.05rem;
  font-weight: 700;
`;

const SummaryRate = styled.div`
  background: rgba(255,255,255,0.2);
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
`;

const SummaryStats = styled.div`
  padding: 16px 14px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (min-width: 480px) {
    padding: 18px;
    gap: 14px;
  }
`;

const SummaryStat = styled.div``;

const SummaryStatValue = styled.div`
  font-size: 1.3rem;
  font-weight: 800;
  color: ${({ $green }) => ($green ? '#16a34a' : 'var(--text)')};
  line-height: 1.1;

  @media (min-width: 480px) {
    font-size: 1.5rem;
  }
`;

const SummaryStatLabel = styled.div`
  font-size: 0.68rem;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  margin-top: 2px;
`;

const ApprovalProgress = styled.div`
  padding: 0 18px 18px;
`;

const ProgressText = styled.div`
  font-size: 0.82rem;
  color: #666;
  margin-bottom: 6px;
  font-weight: 600;
`;

const ProgressBar = styled.div`
  height: 8px;
  background: #eef2f6;
  border-radius: 20px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #4ade80, #16a34a);
  width: ${({ $pct }) => $pct}%;
  transition: width 0.3s;
`;

const WorkerSection = styled.div`
  margin-bottom: 28px;
`;

const WorkerSectionTitle = styled.h2`
  font-size: 1.05rem;
  font-weight: 800;
  color: ${({ $color }) => $color};
  margin: 0 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ColorDot = styled.span`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

const EntriesTable = styled.div`
  background: white;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);

  @media (max-width: 700px) {
    background: transparent;
    box-shadow: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
`;

const EntryRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 90px 90px 70px 80px 130px;
  gap: 10px;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #eef2f6;
  background: ${({ $approved }) => ($approved ? '#f0faf3' : 'white')};
  transition: background 0.15s;

  &:last-child {
    border-bottom: none;
  }

  @media (max-width: 700px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    padding: 14px;
    background: ${({ $approved }) => ($approved ? '#f0faf3' : 'white')};
    border: 1.5px solid ${({ $approved }) => ($approved ? '#bbf7d0' : '#eef2f6')};
    border-radius: 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  }

  @media print {
    grid-template-columns: 1fr 100px 100px 80px 80px 80px;
    padding: 8px 12px;
    background: white !important;
    border: none;
    border-bottom: 1px solid #eef2f6;
    border-radius: 0;
    box-shadow: none;
  }
`;

const EntryDate = styled.div`
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text);

  @media (max-width: 700px) {
    grid-column: 1 / -1;
    padding-bottom: 8px;
    margin-bottom: 2px;
    border-bottom: 1px solid ${({ $approved }) => ($approved ? '#bbf7d0' : '#eef2f6')};
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.98rem;
  }
`;

const EntryCell = styled.div`
  font-size: 0.92rem;
  color: var(--text);
  font-weight: 600;
  text-align: center;

  @media (max-width: 700px) {
    text-align: left;
    font-size: 0.95rem;
    font-weight: 700;

    &::before {
      content: attr(data-label);
      display: block;
      font-size: 0.62rem;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
      margin-bottom: 3px;
    }
  }
`;

const HeaderRow = styled(EntryRow)`
  background: #f8fafd;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #888;
  padding: 10px 16px;

  @media (max-width: 700px) {
    display: none;
  }
`;

const ApproveBtn = styled.button`
  padding: 9px 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  -webkit-tap-highlight-color: transparent;
  background: ${({ $approved }) => ($approved ? '#16a34a' : '#e2e8f0')};
  color: ${({ $approved }) => ($approved ? 'white' : '#555')};
  transition: background 0.15s, transform 0.1s;

  &:hover:not(:disabled) {
    transform: scale(1.03);
    background: ${({ $approved }) => ($approved ? '#15803d' : '#16a34a')};
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 700px) {
    min-height: 44px;
    font-size: 0.9rem;
    padding: 10px;
  }

  @media print {
    background: transparent !important;
    color: ${({ $approved }) => ($approved ? '#16a34a' : '#999')} !important;
    border: 1.5px solid currentColor;
  }
`;

const ApproveWrap = styled.div`
  text-align: center;

  @media (max-width: 700px) {
    grid-column: 1 / -1;
    margin-top: 4px;
  }
`;

const StatusPill = styled.span`
  display: none;

  @media (max-width: 700px) {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: ${({ $approved }) => ($approved ? '#16a34a' : '#fef3c7')};
    color: ${({ $approved }) => ($approved ? 'white' : '#92400e')};
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const ApprovedBy = styled.div`
  font-size: 0.7rem;
  color: #888;
  margin-top: 2px;
  font-weight: 500;
`;

const MetaRow = styled.div`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px dashed #eef2f6;
  font-size: 0.74rem;
  color: #888;
  font-weight: 500;

  @media print { display: none; }
`;

const MetaLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const HistoryToggle = styled.button`
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--primary);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    background: rgba(15,76,129,0.08);
  }
`;

const HistoryPanel = styled.div`
  grid-column: 1 / -1;
  background: #fafbfc;
  border-radius: 10px;
  padding: 12px;
  margin-top: 4px;
  border: 1px solid #eef2f6;
  animation: ${fadeIn} 0.2s ease;
`;

const HistoryItem = styled.div`
  padding: 10px 0;
  border-bottom: 1px solid #eef2f6;
  font-size: 0.82rem;

  &:last-child { border-bottom: none; }
`;

const HistoryBadge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: ${({ $action }) => ($action === 'created' ? '#dbeafe' : '#fef3c7')};
  color: ${({ $action }) => ($action === 'created' ? '#1e40af' : '#92400e')};
  margin-right: 8px;
`;

const HistoryMeta = styled.div`
  color: #666;
  font-size: 0.78rem;
  margin-bottom: 6px;
  font-weight: 500;
`;

const TrailerChipsRow = styled.div`
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
`;

const TrailerChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  background: #e0e7ff;
  color: #3730a3;
  letter-spacing: 0.03em;
`;

const HistoryValues = styled.div`
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  color: var(--text);
  font-weight: 600;

  span {
    font-size: 0.82rem;
  }

  em {
    color: #999;
    font-weight: 500;
    font-style: normal;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-right: 4px;
  }
`;

const EmptyNote = styled.div`
  background: white;
  border-radius: 14px;
  padding: 40px;
  text-align: center;
  color: #999;
  font-size: 0.95rem;
`;

const Toast = styled.div`
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  background: #16a34a;
  color: white;
  padding: 12px 22px;
  border-radius: 30px;
  font-weight: 700;
  box-shadow: 0 8px 30px rgba(22,163,74,0.4);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1000;
  animation: ${fadeIn} 0.25s ease;
`;

const Spinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: ${spin} 0.6s linear infinite;
`;

const PrintOnly = styled.div`
  display: none;
  @media print {
    display: block;
    margin-bottom: 20px;
    font-size: 1.1rem;
    font-weight: 700;
  }
`;

const PrintHide = styled.div`
  @media print { display: none; }
`;

// ──────────────────────────────────────────────────────────────────────
export default function ApproveTimesheets() {
  const periods = useMemo(() => getRecentPeriods(6), []);
  const [periodKey, setPeriodKey] = useState(periods[0].key);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState({});
  const [toast, setToast] = useState('');
  const [expandedHistory, setExpandedHistory] = useState({});
  const [historyData, setHistoryData] = useState({});
  const [historyLoading, setHistoryLoading] = useState({});

  const period = periods.find((p) => p.key === periodKey) || periods[0];

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/timesheet/summary', { params: { period: periodKey } });
      setSummary(res.data);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [periodKey]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const toggleApproval = async (entry) => {
    setActing((prev) => ({ ...prev, [entry.id]: true }));
    try {
      if (entry.approved_at) {
        await api.put(`/timesheet/${entry.id}/unapprove`);
        showToast('Unapproved');
      } else {
        await api.put(`/timesheet/${entry.id}/approve`);
        showToast('Approved');
      }
      await fetchSummary();
    } catch {
      showToast('Error');
    } finally {
      setActing((prev) => ({ ...prev, [entry.id]: false }));
    }
  };

  const toggleHistory = async (entryId) => {
    const isOpen = !!expandedHistory[entryId];
    setExpandedHistory((prev) => ({ ...prev, [entryId]: !isOpen }));
    if (!isOpen && !historyData[entryId]) {
      setHistoryLoading((prev) => ({ ...prev, [entryId]: true }));
      try {
        const res = await api.get(`/timesheet/${entryId}/history`);
        setHistoryData((prev) => ({ ...prev, [entryId]: res.data }));
      } catch {
        setHistoryData((prev) => ({ ...prev, [entryId]: [] }));
      } finally {
        setHistoryLoading((prev) => ({ ...prev, [entryId]: false }));
      }
    }
  };

  const approveAll = async () => {
    if (!window.confirm(`Approve all entries in ${period.label}?`)) return;
    setLoading(true);
    try {
      const res = await api.post('/timesheet/approve-all', { start: period.start, end: period.end });
      showToast(`Approved ${res.data.approved} entries`);
      await fetchSummary();
    } catch {
      showToast('Error');
      setLoading(false);
    }
  };

  const totalGrossPay = summary
    ? Object.values(summary.workers).reduce((sum, w) => sum + w.grossPay, 0)
    : 0;
  const totalApprovedPay = summary
    ? Object.values(summary.workers).reduce((sum, w) => sum + w.approvedPay, 0)
    : 0;

  return (
    <Wrapper>
      <Container>
        <Heading>Timesheet Approval</Heading>

        <PrintOnly>Pay Period: {period.label}</PrintOnly>

        <ControlBar>
          <PeriodSelect value={periodKey} onChange={(e) => setPeriodKey(e.target.value)}>
            {periods.map((p) => (
              <option key={p.key} value={p.key}>Pay Period: {p.label}</option>
            ))}
          </PeriodSelect>
          <ActionBtn $variant="primary" onClick={approveAll} disabled={loading}>
            <FiCheck size={16} />
            Approve All
          </ActionBtn>
          <ActionBtn onClick={() => window.print()}>
            <FiPrinter size={16} />
            Print for Payroll
          </ActionBtn>
        </ControlBar>

        {summary && (
          <>
            <SummaryGrid>
              {Object.entries(summary.workers).map(([key, w]) => {
                const pct = w.daysWorked > 0 ? (w.daysApproved / w.daysWorked) * 100 : 0;
                return (
                  <SummaryCard key={key}>
                    <SummaryHeader $color={WORKERS[key].color}>
                      <SummaryName>{w.name}</SummaryName>
                      <SummaryRate>${w.rate}/hr</SummaryRate>
                    </SummaryHeader>
                    <SummaryStats>
                      <SummaryStat>
                        <SummaryStatValue>{w.totalHours.toFixed(1)}</SummaryStatValue>
                        <SummaryStatLabel>Total Hours</SummaryStatLabel>
                      </SummaryStat>
                      <SummaryStat>
                        <SummaryStatValue $green>${w.grossPay.toFixed(2)}</SummaryStatValue>
                        <SummaryStatLabel>Gross Pay</SummaryStatLabel>
                      </SummaryStat>
                      <SummaryStat>
                        <SummaryStatValue>{w.approvedHours.toFixed(1)}</SummaryStatValue>
                        <SummaryStatLabel>Approved Hrs</SummaryStatLabel>
                      </SummaryStat>
                      <SummaryStat>
                        <SummaryStatValue $green>${w.approvedPay.toFixed(2)}</SummaryStatValue>
                        <SummaryStatLabel>Approved Pay</SummaryStatLabel>
                      </SummaryStat>
                    </SummaryStats>
                    <ApprovalProgress>
                      <ProgressText>{w.daysApproved}/{w.daysWorked} days approved</ProgressText>
                      <ProgressBar><ProgressFill $pct={pct} /></ProgressBar>
                    </ApprovalProgress>
                  </SummaryCard>
                );
              })}
            </SummaryGrid>

            <SummaryCard style={{ marginBottom: 28 }}>
              <SummaryHeader $color="#1a1a2e">
                <SummaryName>Payroll Total</SummaryName>
                <SummaryRate>This Period</SummaryRate>
              </SummaryHeader>
              <SummaryStats>
                <SummaryStat>
                  <SummaryStatValue>${totalGrossPay.toFixed(2)}</SummaryStatValue>
                  <SummaryStatLabel>Total Gross</SummaryStatLabel>
                </SummaryStat>
                <SummaryStat>
                  <SummaryStatValue $green>${totalApprovedPay.toFixed(2)}</SummaryStatValue>
                  <SummaryStatLabel>Ready for Payroll</SummaryStatLabel>
                </SummaryStat>
              </SummaryStats>
            </SummaryCard>

            {Object.entries(summary.workers).map(([key, w]) => (
              <WorkerSection key={key}>
                <WorkerSectionTitle $color={WORKERS[key].color}>
                  <ColorDot $color={WORKERS[key].color} />
                  {w.name} — {w.entries.length} {w.entries.length === 1 ? 'day' : 'days'}
                </WorkerSectionTitle>
                {w.entries.length === 0 ? (
                  <EmptyNote>No entries for this pay period</EmptyNote>
                ) : (
                  <EntriesTable>
                    <HeaderRow>
                      <div>Date</div>
                      <div style={{ textAlign: 'center' }}>In</div>
                      <div style={{ textAlign: 'center' }}>Out</div>
                      <div style={{ textAlign: 'center' }}>Lunch</div>
                      <div style={{ textAlign: 'center' }}>Hours</div>
                      <PrintHide style={{ textAlign: 'center' }}>Status</PrintHide>
                    </HeaderRow>
                    {w.entries.map((entry) => {
                      const approved = !!entry.approved_at;
                      const isActing = acting[entry.id];
                      return (
                        <EntryRow key={entry.id} $approved={approved}>
                          <EntryDate $approved={approved}>
                            <span>{formatDateLong(normalizeDateKey(entry.date))}</span>
                            <StatusPill $approved={approved}>
                              {approved ? <><FiCheck size={11} /> Approved</> : 'Pending'}
                            </StatusPill>
                          </EntryDate>
                          <EntryCell data-label="In">{normalizeTime(entry.clock_in)}</EntryCell>
                          <EntryCell data-label="Out">{normalizeTime(entry.clock_out)}</EntryCell>
                          <EntryCell data-label="Lunch">{entry.lunch_minutes}m</EntryCell>
                          <EntryCell data-label="Hours" style={{ fontWeight: 800 }}>
                            {Number(entry.total_hours).toFixed(2)}
                          </EntryCell>
                          {activeTrailerTrips(entry).length > 0 && (
                            <TrailerChipsRow>
                              {activeTrailerTrips(entry).map((t) => (
                                <TrailerChip key={t.key}>
                                  {t.label} +{t.minutes >= 60 ? `${t.minutes / 60}h` : `${t.minutes}m`}
                                </TrailerChip>
                              ))}
                            </TrailerChipsRow>
                          )}
                          <ApproveWrap>
                            <ApproveBtn
                              $approved={approved}
                              disabled={isActing}
                              onClick={() => toggleApproval(entry)}
                            >
                              {isActing ? <Spinner /> : approved ? <><FiCheck size={14} /> Approved</> : <><FiX size={14} /> Approve</>}
                            </ApproveBtn>
                            {approved && entry.approved_by && (
                              <ApprovedBy>by {entry.approved_by}</ApprovedBy>
                            )}
                          </ApproveWrap>
                          <MetaRow>
                            <MetaLabel>
                              <FiClock size={11} />
                              {entry.created_at === entry.updated_at ? 'Saved' : 'Updated'} {timeAgo(entry.updated_at)} · {formatTimestamp(entry.updated_at)}
                            </MetaLabel>
                            <HistoryToggle onClick={() => toggleHistory(entry.id)}>
                              {expandedHistory[entry.id] ? <><FiChevronUp size={12} /> Hide history</> : <><FiChevronDown size={12} /> View history</>}
                            </HistoryToggle>
                          </MetaRow>
                          {expandedHistory[entry.id] && (
                            <HistoryPanel>
                              {historyLoading[entry.id] ? (
                                <HistoryMeta>Loading history...</HistoryMeta>
                              ) : (historyData[entry.id] || []).length === 0 ? (
                                <HistoryMeta>No history recorded</HistoryMeta>
                              ) : (
                                (historyData[entry.id] || []).map((h) => (
                                  <HistoryItem key={h.id}>
                                    <HistoryMeta>
                                      <HistoryBadge $action={h.action}>{h.action}</HistoryBadge>
                                      {formatTimestamp(h.edited_at)} by <strong>{h.edited_by || 'unknown'}</strong>
                                    </HistoryMeta>
                                    <HistoryValues>
                                      <span><em>In</em>{normalizeTime(h.clock_in)}</span>
                                      <span><em>Out</em>{normalizeTime(h.clock_out)}</span>
                                      <span><em>Lunch</em>{h.lunch_minutes}m</span>
                                      {trailerMinutes(h) > 0 && (
                                        <span><em>Trailer</em>+{trailerMinutes(h)}m</span>
                                      )}
                                      <span><em>Hours</em>{Number(h.total_hours).toFixed(2)}</span>
                                    </HistoryValues>
                                  </HistoryItem>
                                ))
                              )}
                            </HistoryPanel>
                          )}
                        </EntryRow>
                      );
                    })}
                  </EntriesTable>
                )}
              </WorkerSection>
            ))}
          </>
        )}

        {loading && !summary && <EmptyNote>Loading...</EmptyNote>}
      </Container>

      {toast && <Toast><FiCheck size={16} />{toast}</Toast>}
    </Wrapper>
  );
}
