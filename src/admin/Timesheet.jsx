import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled, { keyframes, css } from 'styled-components';
import api from './api';
import { PageContainer, PageTitle, Button, Select, Table, Th, Td, EmptyState } from './styles';

// ── Workers config ──────────────────────────────────────────────────
const WORKERS = {
  jesus_garcia: { name: 'Jesus Garcia', rate: 30, color: '#0f4c81' },
  jerry_francia: { name: 'Jerry Francia', rate: 25, color: '#0d7377' },
};

// ── Pay period helpers ──────────────────────────────────────────────
function getPayPeriod(date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const monthStr = String(m + 1).padStart(2, '0');
  if (d <= 15) {
    return {
      start: `${y}-${monthStr}-01`,
      end: `${y}-${monthStr}-15`,
      label: `${date.toLocaleString('en-US', { month: 'short' })} 1-15, ${y}`,
      key: `${y}-${monthStr}-1`,
    };
  } else {
    const lastDay = new Date(y, m + 1, 0).getDate();
    return {
      start: `${y}-${monthStr}-16`,
      end: `${y}-${monthStr}-${lastDay}`,
      label: `${date.toLocaleString('en-US', { month: 'short' })} 16-${lastDay}, ${y}`,
      key: `${y}-${monthStr}-2`,
    };
  }
}

function getRecentPeriods(count = 6) {
  const periods = [];
  let date = new Date();
  for (let i = 0; i < count; i++) {
    periods.push(getPayPeriod(date));
    // Move to previous period
    const d = date.getDate();
    if (d <= 15) {
      // Go to second half of previous month
      date = new Date(date.getFullYear(), date.getMonth() - 1, 20);
    } else {
      // Go to first half of same month
      date = new Date(date.getFullYear(), date.getMonth(), 5);
    }
  }
  return periods;
}

function getDaysInPeriod(start, end) {
  const days = [];
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDayLabel(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function calcHours(clockIn, clockOut, lunchMinutes) {
  if (!clockIn || !clockOut) return 0;
  const [inH, inM] = clockIn.split(':').map(Number);
  const [outH, outM] = clockOut.split(':').map(Number);
  const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM) - (lunchMinutes || 0);
  return Math.max(0, +(totalMinutes / 60).toFixed(2));
}

// ── Animations ──────────────────────────────────────────────────────
const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ── Styled Components ───────────────────────────────────────────────
const TabBar = styled.div`
  display: flex;
  gap: 0;
  margin-bottom: 28px;
  border-bottom: 2px solid #e2e8f0;
`;

const Tab = styled.button`
  padding: 12px 24px;
  font-size: 0.95rem;
  font-weight: 700;
  font-family: inherit;
  border: none;
  background: none;
  cursor: pointer;
  color: ${({ $active }) => ($active ? 'var(--accent)' : '#888')};
  border-bottom: 3px solid ${({ $active }) => ($active ? 'var(--accent)' : 'transparent')};
  margin-bottom: -2px;
  transition: color 0.2s, border-color 0.2s;

  &:hover {
    color: ${({ $active }) => ($active ? 'var(--accent)' : 'var(--text)')};
  }
`;

const WorkerGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  animation: ${fadeIn} 0.3s ease;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const WorkerCard = styled.div`
  background: white;
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07), 0 6px 20px rgba(0, 0, 0, 0.04);
  overflow: hidden;
`;

const WorkerHeader = styled.div`
  background: ${({ $color }) => $color};
  color: white;
  padding: 18px 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
`;

const WorkerName = styled.h2`
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0;
`;

const RateBadge = styled.span`
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
`;

const PeriodBar = styled.div`
  padding: 14px 22px;
  background: #f8fafd;
  border-bottom: 1px solid #eef2f6;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const PeriodSelect = styled.select`
  padding: 8px 32px 8px 12px;
  font-size: 0.85rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-family: inherit;
  font-weight: 600;
  outline: none;
  appearance: none;
  background: white url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") no-repeat right 8px center / 14px;
  cursor: pointer;

  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(15, 76, 129, 0.1);
  }
`;

const DayRows = styled.div`
  padding: 0 10px 14px;
  max-height: 540px;
  overflow-y: auto;
`;

const DayRow = styled.div`
  display: grid;
  grid-template-columns: 110px 1fr 1fr 70px 70px 42px;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  margin-top: 4px;
  background: ${({ $weekend }) => ($weekend ? '#f5f7fa' : 'transparent')};
  transition: background 0.15s;

  &:hover {
    background: ${({ $weekend }) => ($weekend ? '#edf0f5' : '#f8fafd')};
  }

  @media (max-width: 600px) {
    grid-template-columns: 80px 1fr 1fr 56px 56px 36px;
    gap: 4px;
    padding: 6px 6px;
  }
`;

const DayRowHeader = styled(DayRow)`
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #888;
  padding-bottom: 4px;
  border-bottom: 1px solid #eee;
  margin-bottom: 2px;

  &:hover {
    background: transparent;
  }
`;

const DayLabel = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ $weekend }) => ($weekend ? '#aaa' : 'var(--text)')};

  @media (max-width: 600px) {
    font-size: 0.78rem;
  }
`;

const TimeInput = styled.input`
  padding: 7px 8px;
  font-size: 0.85rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 7px;
  font-family: inherit;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(15, 76, 129, 0.08);
  }

  @media (max-width: 600px) {
    padding: 6px 4px;
    font-size: 0.8rem;
  }
`;

const LunchInput = styled(TimeInput)`
  text-align: center;
`;

const HoursDisplay = styled.div`
  font-size: 0.88rem;
  font-weight: 700;
  color: ${({ $hasHours }) => ($hasHours ? 'var(--text)' : '#ccc')};
  text-align: center;
`;

const SaveBtn = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: background 0.2s, transform 0.15s;
  background: ${({ $saved }) => ($saved ? '#4ade80' : '#e2e8f0')};
  color: ${({ $saved }) => ($saved ? 'white' : '#666')};

  &:hover {
    transform: scale(1.1);
    background: ${({ $saved }) => ($saved ? '#22c55e' : '#d1d5db')};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    transform: none;
  }

  @media (max-width: 600px) {
    width: 30px;
    height: 30px;
  }
`;

const Spinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.15);
  border-top-color: #666;
  border-radius: 50%;
  animation: ${spin} 0.6s linear infinite;
`;

const TotalBar = styled.div`
  padding: 16px 22px;
  background: linear-gradient(135deg, #f8fafd, #eef3f9);
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
`;

const TotalLabel = styled.span`
  font-size: 0.82rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
`;

const TotalValue = styled.span`
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text);
`;

const GrossPay = styled.span`
  font-size: 1.4rem;
  font-weight: 800;
  color: #16a34a;
`;

// Summary tab styles
const SummaryContainer = styled.div`
  animation: ${fadeIn} 0.3s ease;
`;

const SummaryPeriodBar = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
  flex-wrap: wrap;
`;

const SummaryWorkerGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryWorkerCard = styled.div`
  background: white;
  border-radius: 14px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07), 0 6px 20px rgba(0, 0, 0, 0.04);
  overflow: hidden;
`;

const SummaryStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 22px;
`;

const StatBox = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 800;
  color: ${({ $highlight }) => ($highlight ? '#16a34a' : 'var(--text)')};
`;

const StatLabel = styled.div`
  font-size: 0.75rem;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  margin-top: 2px;
`;

const BreakdownTable = styled.div`
  padding: 0 22px 22px;
  overflow-x: auto;
`;

const PrintBtn = styled(Button)`
  background: var(--accent);
  &:hover {
    background: #d99200;
  }
`;

const PrintStyles = styled.div`
  @media print {
    .no-print {
      display: none !important;
    }
  }
`;

// ── Main Component ──────────────────────────────────────────────────
export default function Timesheet() {
  const [activeTab, setActiveTab] = useState('entry');
  const periods = useMemo(() => getRecentPeriods(6), []);
  const currentPeriod = periods[0];

  // Entry tab state
  const [entryPeriods, setEntryPeriods] = useState(() => {
    const init = {};
    Object.keys(WORKERS).forEach((w) => { init[w] = currentPeriod.key; });
    return init;
  });
  const [entries, setEntries] = useState({});
  const [savedDays, setSavedDays] = useState({});
  const [savingDays, setSavingDays] = useState({});

  // Summary tab state
  const [summaryPeriodKey, setSummaryPeriodKey] = useState(currentPeriod.key);
  const [summaryData, setSummaryData] = useState({});
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Get the period object from a key
  const periodFromKey = useCallback((key) => {
    return periods.find((p) => p.key === key) || currentPeriod;
  }, [periods, currentPeriod]);

  // ── Fetch entries for a worker + period ───────────────────────────
  const fetchEntries = useCallback(async (workerKey, periodKey) => {
    const period = periods.find((p) => p.key === periodKey) || currentPeriod;
    try {
      const res = await api.get('/timesheet', {
        params: { worker: workerKey, start: period.start, end: period.end },
      });
      const data = res.data || [];
      const newEntries = {};
      const newSaved = {};
      data.forEach((entry) => {
        const dateKey = entry.date;
        newEntries[`${workerKey}_${dateKey}`] = {
          clock_in: entry.clock_in || '',
          clock_out: entry.clock_out || '',
          lunch_minutes: entry.lunch_minutes ?? 30,
        };
        newSaved[`${workerKey}_${dateKey}`] = true;
      });
      setEntries((prev) => ({ ...prev, ...newEntries }));
      setSavedDays((prev) => ({ ...prev, ...newSaved }));
    } catch (err) {
      // Silently fail — entries just start empty
    }
  }, [periods, currentPeriod]);

  // Fetch entries on mount + period change
  useEffect(() => {
    Object.keys(WORKERS).forEach((w) => {
      fetchEntries(w, entryPeriods[w]);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePeriodChange = (workerKey, periodKey) => {
    setEntryPeriods((prev) => ({ ...prev, [workerKey]: periodKey }));
    fetchEntries(workerKey, periodKey);
  };

  // ── Entry helpers ─────────────────────────────────────────────────
  const getEntry = (workerKey, dateStr) => {
    const key = `${workerKey}_${dateStr}`;
    return entries[key] || { clock_in: '', clock_out: '', lunch_minutes: 30 };
  };

  const updateEntry = (workerKey, dateStr, field, value) => {
    const key = `${workerKey}_${dateStr}`;
    setEntries((prev) => ({
      ...prev,
      [key]: { ...getEntry(workerKey, dateStr), [field]: value },
    }));
    // Mark as unsaved when edited
    setSavedDays((prev) => ({ ...prev, [key]: false }));
  };

  const saveEntry = async (workerKey, dateStr) => {
    const key = `${workerKey}_${dateStr}`;
    const entry = getEntry(workerKey, dateStr);
    if (!entry.clock_in || !entry.clock_out) return;

    setSavingDays((prev) => ({ ...prev, [key]: true }));
    try {
      const hours = calcHours(entry.clock_in, entry.clock_out, entry.lunch_minutes);
      await api.post('/timesheet', {
        worker: workerKey,
        date: dateStr,
        clock_in: entry.clock_in,
        clock_out: entry.clock_out,
        lunch_minutes: entry.lunch_minutes,
        total_hours: hours,
      });
      setSavedDays((prev) => ({ ...prev, [key]: true }));
    } catch (err) {
      // Could add toast here
    } finally {
      setSavingDays((prev) => ({ ...prev, [key]: false }));
    }
  };

  // ── Summary fetch ─────────────────────────────────────────────────
  const fetchSummary = useCallback(async (periodKey) => {
    setSummaryLoading(true);
    const results = {};
    try {
      const fetches = Object.keys(WORKERS).map(async (workerKey) => {
        const period = periods.find((p) => p.key === periodKey) || currentPeriod;
        try {
          const res = await api.get('/timesheet/summary', {
            params: { period: periodKey, worker: workerKey, start: period.start, end: period.end },
          });
          results[workerKey] = res.data;
        } catch {
          results[workerKey] = null;
        }
      });
      await Promise.all(fetches);
      setSummaryData(results);
    } finally {
      setSummaryLoading(false);
    }
  }, [periods, currentPeriod]);

  useEffect(() => {
    if (activeTab === 'summary') {
      fetchSummary(summaryPeriodKey);
    }
  }, [activeTab, summaryPeriodKey, fetchSummary]);

  // ── Render helpers ────────────────────────────────────────────────
  const renderWorkerCard = (workerKey) => {
    const worker = WORKERS[workerKey];
    const periodKey = entryPeriods[workerKey];
    const period = periodFromKey(periodKey);
    const days = getDaysInPeriod(period.start, period.end);

    let totalHours = 0;
    days.forEach((day) => {
      const dateStr = formatDateKey(day);
      const entry = getEntry(workerKey, dateStr);
      totalHours += calcHours(entry.clock_in, entry.clock_out, entry.lunch_minutes);
    });
    const grossPay = (totalHours * worker.rate).toFixed(2);

    return (
      <WorkerCard key={workerKey}>
        <WorkerHeader $color={worker.color}>
          <WorkerName>{worker.name}</WorkerName>
          <RateBadge>${worker.rate}/hr</RateBadge>
        </WorkerHeader>

        <PeriodBar>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#666' }}>Period:</span>
          <PeriodSelect
            value={periodKey}
            onChange={(e) => handlePeriodChange(workerKey, e.target.value)}
          >
            {periods.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </PeriodSelect>
        </PeriodBar>

        <DayRows>
          <DayRowHeader>
            <div>Day</div>
            <div>Clock In</div>
            <div>Clock Out</div>
            <div>Lunch</div>
            <div>Hrs</div>
            <div></div>
          </DayRowHeader>

          {days.map((day) => {
            const dateStr = formatDateKey(day);
            const entryKey = `${workerKey}_${dateStr}`;
            const entry = getEntry(workerKey, dateStr);
            const hours = calcHours(entry.clock_in, entry.clock_out, entry.lunch_minutes);
            const weekend = isWeekend(day);
            const saving = savingDays[entryKey];
            const saved = savedDays[entryKey];

            return (
              <DayRow key={dateStr} $weekend={weekend}>
                <DayLabel $weekend={weekend}>{formatDayLabel(day)}</DayLabel>
                <TimeInput
                  type="time"
                  value={entry.clock_in}
                  onChange={(e) => updateEntry(workerKey, dateStr, 'clock_in', e.target.value)}
                />
                <TimeInput
                  type="time"
                  value={entry.clock_out}
                  onChange={(e) => updateEntry(workerKey, dateStr, 'clock_out', e.target.value)}
                />
                <LunchInput
                  type="number"
                  min="0"
                  max="120"
                  value={entry.lunch_minutes}
                  onChange={(e) => updateEntry(workerKey, dateStr, 'lunch_minutes', parseInt(e.target.value) || 0)}
                />
                <HoursDisplay $hasHours={hours > 0}>
                  {hours > 0 ? hours.toFixed(1) : '--'}
                </HoursDisplay>
                <SaveBtn
                  $saved={saved}
                  disabled={saving || !entry.clock_in || !entry.clock_out}
                  onClick={() => saveEntry(workerKey, dateStr)}
                  title={saved ? 'Saved' : 'Save entry'}
                >
                  {saving ? <Spinner /> : saved ? '\u2713' : '\u2713'}
                </SaveBtn>
              </DayRow>
            );
          })}
        </DayRows>

        <TotalBar>
          <div>
            <TotalLabel>Total Hours</TotalLabel>
            <br />
            <TotalValue>{totalHours.toFixed(1)}</TotalValue>
          </div>
          <div style={{ textAlign: 'right' }}>
            <TotalLabel>Gross Pay</TotalLabel>
            <br />
            <GrossPay>${grossPay}</GrossPay>
          </div>
        </TotalBar>
      </WorkerCard>
    );
  };

  const renderSummaryCard = (workerKey) => {
    const worker = WORKERS[workerKey];
    const data = summaryData[workerKey];

    // Build from local entries if no API data
    const period = periodFromKey(summaryPeriodKey);
    const days = getDaysInPeriod(period.start, period.end);

    let dayEntries = [];
    let totalHours = 0;
    let totalLunch = 0;
    let daysWorked = 0;

    if (data && data.entries) {
      // Use API data
      dayEntries = data.entries;
      totalHours = data.total_hours || 0;
      totalLunch = data.total_lunch || 0;
      daysWorked = data.days_worked || 0;
    } else {
      // Fallback: build from local state
      days.forEach((day) => {
        const dateStr = formatDateKey(day);
        const entry = getEntry(workerKey, dateStr);
        const hours = calcHours(entry.clock_in, entry.clock_out, entry.lunch_minutes);
        if (hours > 0) {
          daysWorked++;
          totalHours += hours;
          totalLunch += entry.lunch_minutes || 0;
          dayEntries.push({
            date: dateStr,
            clock_in: entry.clock_in,
            clock_out: entry.clock_out,
            lunch_minutes: entry.lunch_minutes,
            total_hours: hours,
          });
        }
      });
    }

    const grossPay = (totalHours * worker.rate).toFixed(2);

    return (
      <SummaryWorkerCard key={workerKey}>
        <WorkerHeader $color={worker.color}>
          <WorkerName>{worker.name}</WorkerName>
          <RateBadge>${worker.rate}/hr</RateBadge>
        </WorkerHeader>

        <SummaryStats>
          <StatBox>
            <StatValue>{totalHours.toFixed(1)}</StatValue>
            <StatLabel>Total Hours</StatLabel>
          </StatBox>
          <StatBox>
            <StatValue $highlight>${grossPay}</StatValue>
            <StatLabel>Gross Pay</StatLabel>
          </StatBox>
          <StatBox>
            <StatValue>{daysWorked}</StatValue>
            <StatLabel>Days Worked</StatLabel>
          </StatBox>
          <StatBox>
            <StatValue>{totalLunch}</StatValue>
            <StatLabel>Lunch (min)</StatLabel>
          </StatBox>
        </SummaryStats>

        {dayEntries.length > 0 ? (
          <BreakdownTable>
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Clock In</Th>
                  <Th>Clock Out</Th>
                  <Th>Lunch</Th>
                  <Th>Hours</Th>
                </tr>
              </thead>
              <tbody>
                {dayEntries.map((entry) => {
                  const d = new Date(entry.date + 'T00:00:00');
                  return (
                    <tr key={entry.date}>
                      <Td>{formatDayLabel(d)}</Td>
                      <Td>{entry.clock_in || '--'}</Td>
                      <Td>{entry.clock_out || '--'}</Td>
                      <Td>{entry.lunch_minutes} min</Td>
                      <Td style={{ fontWeight: 700 }}>
                        {(entry.total_hours || calcHours(entry.clock_in, entry.clock_out, entry.lunch_minutes)).toFixed(1)}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </BreakdownTable>
        ) : (
          <EmptyState>No entries for this period</EmptyState>
        )}
      </SummaryWorkerCard>
    );
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <PrintStyles>
      <PageContainer>
        <div className="no-print">
          <PageTitle>Timesheets</PageTitle>

          <TabBar>
            <Tab $active={activeTab === 'entry'} onClick={() => setActiveTab('entry')}>
              Time Entry
            </Tab>
            <Tab $active={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>
              Pay Period Summary
            </Tab>
          </TabBar>
        </div>

        {activeTab === 'entry' && (
          <WorkerGrid>
            {Object.keys(WORKERS).map(renderWorkerCard)}
          </WorkerGrid>
        )}

        {activeTab === 'summary' && (
          <SummaryContainer>
            <SummaryPeriodBar className="no-print">
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Pay Period:</span>
              <PeriodSelect
                value={summaryPeriodKey}
                onChange={(e) => setSummaryPeriodKey(e.target.value)}
                style={{ minWidth: 180 }}
              >
                {periods.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </PeriodSelect>
              <PrintBtn onClick={() => window.print()}>
                Print Summary
              </PrintBtn>
            </SummaryPeriodBar>

            {summaryLoading ? (
              <EmptyState>Loading summary...</EmptyState>
            ) : (
              <SummaryWorkerGrid>
                {Object.keys(WORKERS).map(renderSummaryCard)}
              </SummaryWorkerGrid>
            )}
          </SummaryContainer>
        )}
      </PageContainer>
    </PrintStyles>
  );
}
