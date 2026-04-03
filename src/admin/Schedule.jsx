import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from './api';
import {
  PageContainer,
  PageTitle,
  Modal,
  ModalContent,
  ModalTitle,
  Button,
  ButtonSecondary,
  Input,
  Select,
  TextArea,
} from './styles';

/* ── Calendar Styled Components ──────────────────────────────────── */
const CalendarHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const MonthTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text);
  min-width: 200px;
  text-align: center;
`;

const NavBtn = styled.button`
  padding: 8px 16px;
  background: white;
  border: 1.5px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-family: inherit;
  font-size: 0.85rem;
  transition: border-color 0.2s, color 0.2s;

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border: 1px solid #eee;
  border-radius: 12px;
  overflow: hidden;

  @media (max-width: 768px) {
    display: none;
  }
`;

const DayHeader = styled.div`
  padding: 10px 4px;
  text-align: center;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #666;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
`;

const DayCell = styled.div`
  min-height: 100px;
  border: 1px solid #eee;
  padding: 4px;
  background: ${({ $isToday }) => ($isToday ? 'rgba(240, 165, 0, 0.08)' : 'white')};
  opacity: ${({ $dimmed }) => ($dimmed ? 0.4 : 1)};
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: ${({ $isToday }) => ($isToday ? 'rgba(240, 165, 0, 0.12)' : '#f8fafd')};
  }
`;

const DayNumber = styled.div`
  font-size: 0.82rem;
  font-weight: 600;
  color: ${({ $isToday }) => ($isToday ? 'var(--accent)' : 'var(--text)')};
  margin-bottom: 4px;
  padding: 2px 6px;
`;

const pillColors = {
  scheduled: '#0f4c81',
  in_progress: '#f0a500',
  completed: '#4ade80',
  cancelled: '#999',
};

const Pill = styled.div`
  padding: 2px 6px;
  margin-bottom: 2px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  color: white;
  background: ${({ $status }) => pillColors[$status] || '#0f4c81'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;

  &:hover {
    opacity: 0.85;
  }
`;

/* Mobile list view */
const MobileList = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileDay = styled.div`
  margin-bottom: 16px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
`;

const MobileDayTitle = styled.div`
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--text);
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #eee;
`;

const MobileEntry = styled.div`
  padding: 6px 0;
  font-size: 0.85rem;
  color: var(--text);
  cursor: pointer;

  &:hover { color: var(--primary); }
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

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
`;

/* ── Helpers ─────────────────────────────────────────────────────── */
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatDate(y, m, d) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? 'pm' : 'am';
  return `${hr % 12 || 12}:${m}${ampm}`;
}

/* ── Component ───────────────────────────────────────────────────── */
const Schedule = () => {
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [entries, setEntries] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ job_id: '', date: '', start_time: '', end_time: '', notes: '' });

  const fetchEntries = useCallback(() => {
    const daysInMonth = getDaysInMonth(year, month);
    const start = formatDate(year, month, 1);
    const end = formatDate(year, month, daysInMonth);
    api.get('/schedule', { params: { start, end } })
      .then((r) => setEntries(r.data))
      .catch(() => setEntries([]));
  }, [year, month]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  const openModal = (dateStr) => {
    setForm({ job_id: '', date: dateStr, start_time: '08:00', end_time: '17:00', notes: '' });
    api.get('/jobs').then((r) => {
      setJobs(r.data.filter((j) => j.status !== 'completed' && j.status !== 'cancelled'));
    }).catch(() => setJobs([]));
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    api.post('/schedule', form).then(() => {
      setModalOpen(false);
      fetchEntries();
    }).catch(() => alert('Failed to add schedule entry.'));
  };

  // Build calendar grid
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const prevMonthDays = month === 0 ? getDaysInMonth(year - 1, 11) : getDaysInMonth(year, month - 1);

  const cells = [];
  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = month === 0 ? 11 : month - 1;
    const y = month === 0 ? year - 1 : year;
    cells.push({ day: d, month: m, year: y, dimmed: true, dateStr: formatDate(y, m, d) });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, month, year, dimmed: false, dateStr: formatDate(year, month, d) });
  }
  // Next month leading days
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1;
    const y = month === 11 ? year + 1 : year;
    cells.push({ day: d, month: m, year: y, dimmed: true, dateStr: formatDate(y, m, d) });
  }

  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  // Group entries by date
  const byDate = {};
  entries.forEach((e) => {
    if (!byDate[e.date]) byDate[e.date] = [];
    byDate[e.date].push(e);
  });

  // Mobile: current month days with entries
  const mobileDays = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = formatDate(year, month, d);
    if (byDate[ds] && byDate[ds].length > 0) {
      mobileDays.push({ day: d, dateStr: ds, entries: byDate[ds] });
    }
  }

  return (
    <PageContainer>
      <PageTitle>Schedule</PageTitle>

      <CalendarHeader>
        <NavBtn onClick={prevMonth}>&larr; Prev</NavBtn>
        <MonthTitle>{MONTHS[month]} {year}</MonthTitle>
        <NavBtn onClick={nextMonth}>Next &rarr;</NavBtn>
        <NavBtn onClick={goToday}>Today</NavBtn>
      </CalendarHeader>

      {/* Desktop grid */}
      <CalendarGrid>
        {DAYS.map((d) => (
          <DayHeader key={d}>{d}</DayHeader>
        ))}
        {cells.map((cell, i) => {
          const isToday = cell.dateStr === todayStr;
          const dayEntries = byDate[cell.dateStr] || [];
          return (
            <DayCell
              key={i}
              $isToday={isToday}
              $dimmed={cell.dimmed}
              onClick={() => openModal(cell.dateStr)}
            >
              <DayNumber $isToday={isToday}>{cell.day}</DayNumber>
              {dayEntries.map((entry) => (
                <Pill
                  key={entry.id}
                  $status={entry.job_status}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/jobs/${entry.job_id}`);
                  }}
                  title={`${entry.job_title} — ${entry.lead_name}`}
                >
                  {formatTime(entry.start_time)} {entry.job_title}
                </Pill>
              ))}
            </DayCell>
          );
        })}
      </CalendarGrid>

      {/* Mobile list view */}
      <MobileList>
        {mobileDays.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
            No scheduled entries this month.
          </div>
        )}
        {mobileDays.map(({ day, dateStr, entries: dayEntries }) => (
          <MobileDay key={dateStr}>
            <MobileDayTitle>
              {MONTHS[month]} {day}{dateStr === todayStr ? ' (Today)' : ''}
            </MobileDayTitle>
            {dayEntries.map((entry) => (
              <MobileEntry key={entry.id} onClick={() => navigate(`/admin/jobs/${entry.job_id}`)}>
                {formatTime(entry.start_time)}–{formatTime(entry.end_time)} &middot; {entry.job_title} &middot; {entry.lead_name}
              </MobileEntry>
            ))}
            <NavBtn style={{ marginTop: 8, fontSize: '0.78rem' }} onClick={() => openModal(dateStr)}>
              + Add Entry
            </NavBtn>
          </MobileDay>
        ))}
      </MobileList>

      {/* Add Entry Modal */}
      {modalOpen && (
        <Modal onClick={() => setModalOpen(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Add Schedule Entry</ModalTitle>
            <form onSubmit={handleSubmit}>
              <FormGroup>
                <label>Job</label>
                <Select
                  value={form.job_id}
                  onChange={(e) => setForm({ ...form, job_id: e.target.value })}
                  required
                >
                  <option value="">Select a job...</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title} — {j.lead_name}
                    </option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup>
                <label>Date</label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <label>Start Time</label>
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <label>End Time</label>
                <Input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  required
                />
              </FormGroup>
              <FormGroup>
                <label>Notes</label>
                <TextArea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional notes..."
                />
              </FormGroup>
              <ModalActions>
                <ButtonSecondary type="button" onClick={() => setModalOpen(false)}>Cancel</ButtonSecondary>
                <Button type="submit">Add Entry</Button>
              </ModalActions>
            </form>
          </ModalContent>
        </Modal>
      )}
    </PageContainer>
  );
};

export default Schedule;
