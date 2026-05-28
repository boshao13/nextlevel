import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { FiChevronLeft, FiChevronRight, FiCheck, FiRefreshCw } from 'react-icons/fi';
import api from './api';
import { isHalfStep } from './halfStep';

// ── Workers config ──────────────────────────────────────────────────
const WORKERS = {
  jesus_garcia: { name: 'Jesus Garcia', rate: 30, color: '#0f4c81' },
  jerry_francia: { name: 'Jerry Francia', rate: 25, color: '#0d7377' },
  robert_pyle: { name: 'Robert Pyle', rate: 20, color: '#b45309' },
};

// ── Date helpers ────────────────────────────────────────────────────
function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Normalize whatever the API returns (ISO string or YYYY-MM-DD) to YYYY-MM-DD
function normalizeDateKey(apiDate) {
  if (!apiDate) return '';
  return String(apiDate).slice(0, 10);
}

// Pay period logic:
//   Period 1 (H=1): (prev month lastDay-2) → current month 12. Payroll 13, deposit 15.
//   Period 2 (H=2): current month 13 → current month (lastDay-3). Payroll lastDay-2, deposit lastDay.
function getPayPeriod(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = date.getMonth(); // 0-indexed
  const d = date.getDate();
  const lastDay = new Date(y, m + 1, 0).getDate();
  const p2End = lastDay - 3;

  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (d <= 12) {
    // Period 1 of current month
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
    // Period 2 of current month
    const startDate = new Date(y, m, 13);
    const endDate = new Date(y, m, p2End);
    return {
      start: `${y}-${pad(m + 1)}-13`,
      end: `${y}-${pad(m + 1)}-${pad(p2End)}`,
      label: `${fmt(startDate)} – ${fmt(endDate)}`,
      key: `${y}-${pad(m + 1)}-2`,
    };
  }
  // Period 1 of NEXT month (last 3 days of this month roll forward)
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

const TRAILER_TRIPS = [
  { key: 'trailer_delivered_abq', label: 'Delivered → ABQ', minutes: 30, short: '+30m' },
  { key: 'trailer_returned_abq',  label: 'Returned ← ABQ',  minutes: 30, short: '+30m' },
  { key: 'trailer_delivered_sf',  label: 'Delivered → Santa Fe', minutes: 60, short: '+1h' },
  { key: 'trailer_returned_sf',   label: 'Returned ← Santa Fe',  minutes: 60, short: '+1h' },
];

function calcTrailerMinutes(flags) {
  let total = 0;
  for (const t of TRAILER_TRIPS) if (flags[t.key]) total += t.minutes;
  return total;
}

function calcHours(clockIn, clockOut, lunchMinutes, trailerMinutes = 0) {
  if (!clockIn || !clockOut) return 0;
  const [inH, inM] = clockIn.split(':').map(Number);
  const [outH, outM] = clockOut.split(':').map(Number);
  const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM) - (lunchMinutes || 0) + (trailerMinutes || 0);
  return Math.max(0, +(totalMinutes / 60).toFixed(2));
}

function normalizeTime(t) {
  // API may return "09:00:00"; UI wants "09:00"
  if (!t) return '';
  return String(t).slice(0, 5);
}

// ── Animations ──────────────────────────────────────────────────────
const spin = keyframes`to { transform: rotate(360deg); }`;
const fadeIn = keyframes`from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); }`;
const pop = keyframes`0% { transform: scale(0.8); opacity: 0; } 60% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; }`;

// ── Layout ──────────────────────────────────────────────────────────
const Wrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f8fc 0%, #eef3fa 100%);
  padding: 16px 12px 40px;

  @media (min-width: 768px) {
    padding: 32px 24px 60px;
  }
`;

const Container = styled.div`
  max-width: 560px;
  margin: 0 auto;
`;

const Heading = styled.h1`
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text);
  margin: 0 0 16px;
  text-align: center;

  @media (min-width: 768px) {
    font-size: 1.7rem;
    margin-bottom: 28px;
  }
`;

// ── Worker selector ─────────────────────────────────────────────────
const WorkerSelectScreen = styled.div`
  animation: ${fadeIn} 0.3s ease;
`;

const Prompt = styled.p`
  text-align: center;
  color: #666;
  font-size: 0.95rem;
  margin: 0 0 20px;
`;

const WorkerButton = styled.button`
  width: 100%;
  padding: 20px 18px;
  margin-bottom: 14px;
  background: ${({ $color }) => $color};
  color: white;
  border: none;
  border-radius: 16px;
  font-family: inherit;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0,0,0,0.08), 0 8px 30px rgba(15,76,129,0.15);
  transition: transform 0.15s, box-shadow 0.15s;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 80px;
  -webkit-tap-highlight-color: transparent;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.12), 0 12px 40px rgba(15,76,129,0.2);
  }

  &:active {
    transform: translateY(0);
  }
`;

const WorkerButtonLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const WorkerAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255,255,255,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: 800;
`;

const WorkerButtonName = styled.div`
  text-align: left;
  line-height: 1.3;
`;

const WorkerButtonRate = styled.div`
  font-size: 0.82rem;
  font-weight: 600;
  opacity: 0.85;
  margin-top: 2px;
`;

// ── Entry Card ──────────────────────────────────────────────────────
const EntryScreen = styled.div`
  animation: ${fadeIn} 0.3s ease;
`;

const WorkerChip = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px 16px;
  min-height: 52px;
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
  margin-bottom: 16px;
  transition: border-color 0.2s;
  -webkit-tap-highlight-color: transparent;

  &:hover, &:active {
    border-color: ${({ $color }) => $color};
  }
`;

const ChipLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ChipDot = styled.span`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

const ChipRate = styled.span`
  font-size: 0.82rem;
  color: #888;
  font-weight: 600;
`;

const Card = styled.div`
  background: white;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.06);
  overflow: hidden;
`;

const CardHeader = styled.div`
  background: ${({ $color }) => $color};
  color: white;
  padding: 16px 14px;
  display: flex;
  align-items: center;
  gap: 6px;

  @media (min-width: 768px) {
    padding: 18px 20px;
    gap: 8px;
  }
`;

const DateNav = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.15);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
  -webkit-tap-highlight-color: transparent;
  flex-shrink: 0;

  &:hover {
    background: rgba(255,255,255,0.25);
  }

  &:active {
    background: rgba(255,255,255,0.3);
  }
`;

const DateDisplay = styled.div`
  flex: 1;
  text-align: center;
`;

const DayOfWeek = styled.div`
  font-size: 0.78rem;
  font-weight: 600;
  opacity: 0.85;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const DateMain = styled.div`
  font-size: 1rem;
  font-weight: 800;
  margin-top: 2px;
  line-height: 1.25;

  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
`;

const TodayButton = styled.button`
  font-size: 0.72rem;
  font-weight: 700;
  padding: 4px 10px;
  background: rgba(255,255,255,0.2);
  border: none;
  border-radius: 20px;
  color: white;
  font-family: inherit;
  cursor: pointer;
  margin-top: 4px;
  letter-spacing: 0.04em;

  &:hover {
    background: rgba(255,255,255,0.3);
  }
`;

const CardBody = styled.div`
  padding: 20px 16px;

  @media (min-width: 768px) {
    padding: 24px 22px;
  }
`;

const Field = styled.div`
  margin-bottom: 18px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const FieldLabel = styled.label`
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #777;
  margin-bottom: 8px;
`;

const TimeInput = styled.input`
  width: 100%;
  padding: 14px 16px;
  font-size: 16px; /* Prevents iOS zoom on focus */
  font-weight: 600;
  color: var(--text);
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  -webkit-appearance: none;
  min-height: 48px;

  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(15,76,129,0.08);
  }
`;

const LunchRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LunchBtn = styled.button`
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  background: white;
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--primary);
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.15s, background 0.15s;
  -webkit-tap-highlight-color: transparent;

  &:hover, &:active {
    border-color: var(--primary);
    background: #f0f7ff;
  }
`;

const LunchInput = styled(TimeInput)`
  text-align: center;
  flex: 1;
`;

const LunchUnit = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: #888;
`;

const TrailerGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const TrailerBtn = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 12px 14px;
  min-height: 64px;
  border-radius: 12px;
  border: 2px solid ${({ $active, $color }) => ($active ? $color : '#e2e8f0')};
  background: ${({ $active, $color }) => ($active ? $color : 'white')};
  color: ${({ $active }) => ($active ? 'white' : 'var(--text)')};
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, transform 0.1s;
  -webkit-tap-highlight-color: transparent;

  &:hover:not(:disabled) {
    border-color: ${({ $color }) => $color};
    transform: translateY(-1px);
  }
`;

const TrailerBtnLabel = styled.span`
  font-size: 0.85rem;
`;

const TrailerBtnMinutes = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  opacity: ${({ $active }) => ($active ? 1 : 0.6)};
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

const HoursPreview = styled.div`
  background: linear-gradient(135deg, #f8fafd, #eef3f9);
  border-radius: 14px;
  padding: 16px;
  margin-top: 22px;
  display: flex;
  justify-content: space-around;
  text-align: center;
`;

const PreviewStat = styled.div``;

const PreviewValue = styled.div`
  font-size: 1.6rem;
  font-weight: 800;
  color: ${({ $green }) => ($green ? '#16a34a' : 'var(--text)')};
`;

const PreviewLabel = styled.div`
  font-size: 0.72rem;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  margin-top: 2px;
`;

const SaveButton = styled.button`
  width: 100%;
  min-height: 54px;
  padding: 16px;
  margin-top: 22px;
  background: ${({ $saved, $color }) => ($saved ? '#16a34a' : $color)};
  color: white;
  border: none;
  border-radius: 14px;
  font-family: inherit;
  font-size: 1.05rem;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: background 0.2s, transform 0.1s;
  box-shadow: 0 4px 14px rgba(0,0,0,0.1);
  -webkit-tap-highlight-color: transparent;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.15);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SavedToast = styled.div`
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  background: #16a34a;
  color: white;
  padding: 12px 22px;
  border-radius: 30px;
  font-size: 0.92rem;
  font-weight: 700;
  box-shadow: 0 8px 30px rgba(22,163,74,0.4);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 1000;
  animation: ${pop} 0.3s ease;
`;

const Spinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: ${spin} 0.6s linear infinite;
`;

// ── Pay period overview ─────────────────────────────────────────────
const PayPeriodCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 16px 14px;
  margin-top: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border: 1px solid #eef2f6;

  @media (min-width: 768px) {
    padding: 20px;
    margin-top: 20px;
  }
`;

const PeriodHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
`;

const PeriodLabel = styled.div`
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #888;
`;

const PeriodDates = styled.div`
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text);
`;

const PeriodStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  text-align: center;
`;

const PeriodStat = styled.div``;

const PeriodStatValue = styled.div`
  font-size: 1.2rem;
  font-weight: 800;
  color: ${({ $green }) => ($green ? '#16a34a' : 'var(--text)')};

  @media (min-width: 768px) {
    font-size: 1.4rem;
  }
`;

const PeriodStatLabel = styled.div`
  font-size: 0.68rem;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 700;
  margin-top: 2px;
`;

const SwitchWorkerBtn = styled.button`
  width: 100%;
  padding: 14px;
  margin-top: 16px;
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  color: #555;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }
`;

// ── Materials Used subcomponent ────────────────────────────────────
const MaterialsHeader = styled.div`
  margin-top: 18px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #4a5468;
`;

const MaterialsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
`;

const MaterialsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 110px 32px;
  gap: 8px;
  align-items: center;
`;

const AddMatBtn = styled.button`
  margin-top: 6px;
  align-self: flex-start;
  background: none;
  border: 1.5px dashed #c5d5e8;
  color: #0f4c81;
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #f0f4f9; }
`;

const RemoveMatBtn = styled.button`
  background: none;
  border: none;
  color: #c62828;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0;
`;

// State shape for one editor row:
//   { tempId, id?: number, item_id: number|'', units_used: number|string, _removed?: boolean }
// `id` present = persisted server row. `tempId` is a stable local key for React.
let _matCounter = 0;
const nextTempId = () => `tmp-${++_matCounter}`;

function rowsFromServer(usage) {
  return usage.map(u => ({
    tempId: nextTempId(),
    id: u.id,
    item_id: u.item_id,
    units_used: Number(u.units_used),
  }));
}

function validateMaterials(rows) {
  const errs = [];
  for (const r of rows.filter(x => !x._removed)) {
    if (!r.item_id) errs.push('Pick a material for every row, or remove blanks.');
    const u = Number(r.units_used);
    if (!isHalfStep(u) || u === 0) errs.push('Units used must be a positive multiple of 0.5.');
  }
  return [...new Set(errs)];
}

function MaterialsUsed({ rows, items, onChange, disabled }) {
  const update = (tempId, patch) => {
    onChange(rows.map(r => r.tempId === tempId ? { ...r, ...patch } : r));
  };
  const add = () => {
    onChange([...rows, { tempId: nextTempId(), item_id: '', units_used: '' }]);
  };
  const remove = (tempId) => {
    onChange(rows.map(r => r.tempId === tempId ? { ...r, _removed: true } : r));
  };

  const visible = rows.filter(r => !r._removed);

  return (
    <div>
      <MaterialsHeader>Materials Used</MaterialsHeader>
      <MaterialsList>
        {visible.map(r => (
          <MaterialsRow key={r.tempId}>
            <select
              value={r.item_id || ''}
              onChange={(e) => update(r.tempId, { item_id: Number(e.target.value) || '' })}
              disabled={disabled}
            >
              <option value="">— pick a material —</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <input
              type="number"
              step="0.5"
              min="0.5"
              placeholder="0"
              value={r.units_used}
              onChange={(e) => update(r.tempId, { units_used: e.target.value })}
              disabled={disabled}
            />
            <RemoveMatBtn type="button" onClick={() => remove(r.tempId)} disabled={disabled} title="Remove">×</RemoveMatBtn>
          </MaterialsRow>
        ))}
      </MaterialsList>
      {!disabled && (
        <AddMatBtn type="button" onClick={add}>+ Add material</AddMatBtn>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────
export default function Timesheet() {
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entry, setEntry] = useState({
    clock_in: '', clock_out: '', lunch_minutes: 30,
    trailer_delivered_abq: false, trailer_returned_abq: false,
    trailer_delivered_sf: false, trailer_returned_sf: false,
  });
  const [periodEntries, setPeriodEntries] = useState([]);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [inventoryItems, setInventoryItems] = useState([]);  // active items for the dropdown
  const [materials, setMaterials] = useState([]);            // editor rows for the CURRENT (worker, date)
  const originalMaterialsRef = useRef([]);                   // baseline last loaded from server (for diff)

  const today = new Date();
  const dateKey = formatDateKey(currentDate);
  const isToday = formatDateKey(today) === dateKey;
  const period = getPayPeriod(currentDate);
  const worker = selectedWorker ? WORKERS[selectedWorker] : null;

  // ── Fetch all entries for the pay period ──────────────────────────
  const fetchPeriod = useCallback(async (workerKey, periodObj) => {
    try {
      const res = await api.get('/timesheet', {
        params: { worker: workerKey, start: periodObj.start, end: periodObj.end },
      });
      setPeriodEntries(res.data || []);
    } catch {
      setPeriodEntries([]);
    }
  }, []);

  // When worker or period changes, refetch
  useEffect(() => {
    if (selectedWorker) {
      fetchPeriod(selectedWorker, period);
    }
  }, [selectedWorker, period.start, period.end, fetchPeriod]); // eslint-disable-line

  // When the date or fetched entries change, update the current entry form
  useEffect(() => {
    if (!selectedWorker) return;
    const match = periodEntries.find((e) => normalizeDateKey(e.date) === dateKey);
    if (match) {
      setEntry({
        clock_in: normalizeTime(match.clock_in),
        clock_out: normalizeTime(match.clock_out),
        lunch_minutes: match.lunch_minutes ?? 30,
        trailer_delivered_abq: !!match.trailer_delivered_abq,
        trailer_returned_abq: !!match.trailer_returned_abq,
        trailer_delivered_sf: !!match.trailer_delivered_sf,
        trailer_returned_sf: !!match.trailer_returned_sf,
      });
    } else {
      setEntry({
        clock_in: '', clock_out: '', lunch_minutes: 30,
        trailer_delivered_abq: false, trailer_returned_abq: false,
        trailer_delivered_sf: false, trailer_returned_sf: false,
      });
    }
  }, [dateKey, periodEntries, selectedWorker]);

  // Load inventory items once on mount
  useEffect(() => {
    api.get('/inventory').then(({ data }) => setInventoryItems(data)).catch(() => {});
  }, []);

  // Reload materials whenever (worker, date) changes
  useEffect(() => {
    if (!selectedWorker) {
      setMaterials([]);
      originalMaterialsRef.current = [];
      return;
    }
    api.get('/inventory/usage', { params: { worker: selectedWorker, date: dateKey } })
      .then(({ data }) => {
        const rows = rowsFromServer(data);
        setMaterials(rows);
        originalMaterialsRef.current = rows;
      })
      .catch(() => {
        setMaterials([]);
        originalMaterialsRef.current = [];
      });
  }, [selectedWorker, dateKey]);

  const trailerMinutes = calcTrailerMinutes(entry);
  const hours = calcHours(entry.clock_in, entry.clock_out, entry.lunch_minutes, trailerMinutes);

  // Period totals
  const periodTotals = periodEntries.reduce(
    (acc, e) => {
      const h = Number(e.total_hours) || 0;
      acc.hours += h;
      acc.days += 1;
      return acc;
    },
    { hours: 0, days: 0 }
  );
  const periodPay = worker ? periodTotals.hours * worker.rate : 0;

  const handleChangeDate = (dir) => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + dir);
    setCurrentDate(next);
  };

  const handleSave = async () => {
    if (!selectedWorker || !entry.clock_in || !entry.clock_out) return;
    setSaving(true);
    try {
      await api.post('/timesheet', {
        worker: selectedWorker,
        date: dateKey,
        clock_in: entry.clock_in,
        clock_out: entry.clock_out,
        lunch_minutes: Number(entry.lunch_minutes) || 0,
        trailer_delivered_abq: entry.trailer_delivered_abq,
        trailer_returned_abq: entry.trailer_returned_abq,
        trailer_delivered_sf: entry.trailer_delivered_sf,
        trailer_returned_sf: entry.trailer_returned_sf,
      });

      // ── Materials diff: POST new, PUT changed, DELETE removed ──
      const errs = validateMaterials(materials);
      if (errs.length) {
        alert(errs.join('\n'));
        return;
      }

      const original = originalMaterialsRef.current;
      const ops = [];

      // Removed: had a server id and _removed=true
      materials.filter(r => r._removed && r.id).forEach(r => {
        ops.push(api.delete(`/inventory/usage/${r.id}`));
      });
      // Edited: had a server id, units_used changed
      materials.filter(r => r.id && !r._removed).forEach(r => {
        const orig = original.find(o => o.id === r.id);
        if (orig && Number(orig.units_used) !== Number(r.units_used)) {
          ops.push(api.put(`/inventory/usage/${r.id}`, { units_used: Number(r.units_used) }));
        }
      });
      // New: no id, not removed
      materials.filter(r => !r.id && !r._removed).forEach(r => {
        ops.push(api.post('/inventory/usage', {
          item_id: r.item_id, worker: selectedWorker, date: dateKey,
          units_used: Number(r.units_used),
        }));
      });

      const results = await Promise.allSettled(ops);
      const failures = results.filter(r => r.status === 'rejected');
      const sawSoftDeleted = failures.some(r => r.reason?.response?.status === 410);

      // Always re-fetch to capture new server ids (success path) or to resync (failure path).
      const { data: freshUsage } = await api.get('/inventory/usage', {
        params: { worker: selectedWorker, date: dateKey },
      });
      const freshRows = rowsFromServer(freshUsage);
      setMaterials(freshRows);
      originalMaterialsRef.current = freshRows;

      if (sawSoftDeleted) {
        const { data: items } = await api.get('/inventory');
        setInventoryItems(items);
      }

      if (failures.length) {
        alert('Some material entries failed to save. The list has been refreshed; try again.');
      }

      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
      fetchPeriod(selectedWorker, period);
    } catch (err) {
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const adjustLunch = (delta) => {
    const current = Number(entry.lunch_minutes) || 0;
    const next = Math.max(0, Math.min(120, current + delta));
    setEntry((prev) => ({ ...prev, lunch_minutes: next }));
  };

  // ── Render: Worker selection ──────────────────────────────────────
  if (!selectedWorker) {
    return (
      <Wrapper>
        <Container>
          <Heading>Timesheet</Heading>
          <WorkerSelectScreen>
            <Prompt>Who are you logging time for?</Prompt>
            {Object.entries(WORKERS).map(([key, w]) => (
              <WorkerButton
                key={key}
                $color={w.color}
                onClick={() => setSelectedWorker(key)}
              >
                <WorkerButtonLeft>
                  <WorkerAvatar>{w.name[0]}</WorkerAvatar>
                  <WorkerButtonName>
                    {w.name}
                    <WorkerButtonRate>${w.rate}/hr</WorkerButtonRate>
                  </WorkerButtonName>
                </WorkerButtonLeft>
                <FiChevronRight size={22} />
              </WorkerButton>
            ))}
          </WorkerSelectScreen>
        </Container>
      </Wrapper>
    );
  }

  // ── Render: Entry screen ──────────────────────────────────────────
  return (
    <Wrapper>
      <Container>
        <Heading>Timesheet</Heading>

        <WorkerChip $color={worker.color} onClick={() => setSelectedWorker(null)}>
          <ChipLeft>
            <ChipDot $color={worker.color} />
            {worker.name}
          </ChipLeft>
          <ChipRate>${worker.rate}/hr · Change</ChipRate>
        </WorkerChip>

        <EntryScreen>
          <Card>
            <CardHeader $color={worker.color}>
              <DateNav onClick={() => handleChangeDate(-1)} aria-label="Previous day">
                <FiChevronLeft size={20} />
              </DateNav>
              <DateDisplay>
                <DayOfWeek>{currentDate.toLocaleDateString('en-US', { weekday: 'long' })}</DayOfWeek>
                <DateMain>
                  {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </DateMain>
                {!isToday && (
                  <TodayButton onClick={() => setCurrentDate(new Date())}>Jump to today</TodayButton>
                )}
              </DateDisplay>
              <DateNav onClick={() => handleChangeDate(1)} aria-label="Next day">
                <FiChevronRight size={20} />
              </DateNav>
            </CardHeader>

            <CardBody>
              <Field>
                <FieldLabel>Time Started</FieldLabel>
                <TimeInput
                  type="time"
                  value={entry.clock_in}
                  onChange={(e) => setEntry((p) => ({ ...p, clock_in: e.target.value }))}
                />
              </Field>

              <Field>
                <FieldLabel>Time Finished</FieldLabel>
                <TimeInput
                  type="time"
                  value={entry.clock_out}
                  onChange={(e) => setEntry((p) => ({ ...p, clock_out: e.target.value }))}
                />
              </Field>

              <Field>
                <FieldLabel>Lunch Break (minutes)</FieldLabel>
                <LunchRow>
                  <LunchBtn onClick={() => adjustLunch(-15)} type="button" aria-label="Less lunch">−</LunchBtn>
                  <LunchInput
                    type="number"
                    min="0"
                    max="120"
                    value={entry.lunch_minutes}
                    onChange={(e) => setEntry((p) => ({ ...p, lunch_minutes: parseInt(e.target.value) || 0 }))}
                  />
                  <LunchBtn onClick={() => adjustLunch(15)} type="button" aria-label="More lunch">+</LunchBtn>
                  <LunchUnit>
                    {(() => {
                      const n = Number(entry.lunch_minutes) || 0;
                      if (n < 60) return 'min';
                      const h = Math.floor(n / 60);
                      const m = n % 60;
                      return m === 0 ? `min · ${h}h` : `min · ${h}h ${m}m`;
                    })()}
                  </LunchUnit>
                </LunchRow>
              </Field>

              <Field>
                <FieldLabel>Trailer Trips</FieldLabel>
                <TrailerGrid>
                  {TRAILER_TRIPS.map((t) => {
                    const active = !!entry[t.key];
                    return (
                      <TrailerBtn
                        key={t.key}
                        type="button"
                        $active={active}
                        $color={worker.color}
                        onClick={() => setEntry((p) => ({ ...p, [t.key]: !p[t.key] }))}
                      >
                        <TrailerBtnLabel>{t.label}</TrailerBtnLabel>
                        <TrailerBtnMinutes $active={active}>{t.short}</TrailerBtnMinutes>
                      </TrailerBtn>
                    );
                  })}
                </TrailerGrid>
              </Field>

              <MaterialsUsed
                rows={materials}
                items={inventoryItems}
                onChange={setMaterials}
                disabled={false /* Task 3.4 wires this to entry.is_locked === 1 */}
              />

              <HoursPreview>
                <PreviewStat>
                  <PreviewValue>{hours.toFixed(2)}</PreviewValue>
                  <PreviewLabel>Hours</PreviewLabel>
                </PreviewStat>
                {trailerMinutes > 0 && (
                  <PreviewStat>
                    <PreviewValue>+{(trailerMinutes / 60).toFixed(2)}</PreviewValue>
                    <PreviewLabel>Trailer</PreviewLabel>
                  </PreviewStat>
                )}
                <PreviewStat>
                  <PreviewValue $green>${(hours * worker.rate).toFixed(2)}</PreviewValue>
                  <PreviewLabel>Pay (Day)</PreviewLabel>
                </PreviewStat>
              </HoursPreview>

              <SaveButton
                $color={worker.color}
                $saved={justSaved}
                disabled={saving || !entry.clock_in || !entry.clock_out}
                onClick={handleSave}
              >
                {saving ? (
                  <>
                    <Spinner />
                    Saving...
                  </>
                ) : justSaved ? (
                  <>
                    <FiCheck size={20} />
                    Saved!
                  </>
                ) : (
                  <>
                    <FiCheck size={20} />
                    Save Entry
                  </>
                )}
              </SaveButton>
            </CardBody>
          </Card>

          <PayPeriodCard>
            <PeriodHeader>
              <PeriodLabel>Pay Period</PeriodLabel>
              <PeriodDates>{period.label}</PeriodDates>
            </PeriodHeader>
            <PeriodStats>
              <PeriodStat>
                <PeriodStatValue>{periodTotals.days}</PeriodStatValue>
                <PeriodStatLabel>Days</PeriodStatLabel>
              </PeriodStat>
              <PeriodStat>
                <PeriodStatValue>{periodTotals.hours.toFixed(1)}</PeriodStatValue>
                <PeriodStatLabel>Hours</PeriodStatLabel>
              </PeriodStat>
              <PeriodStat>
                <PeriodStatValue $green>${periodPay.toFixed(2)}</PeriodStatValue>
                <PeriodStatLabel>Gross Pay</PeriodStatLabel>
              </PeriodStat>
            </PeriodStats>
          </PayPeriodCard>

          <SwitchWorkerBtn onClick={() => setSelectedWorker(null)}>
            <FiRefreshCw size={14} />
            Switch Worker
          </SwitchWorkerBtn>
        </EntryScreen>

        {justSaved && (
          <SavedToast>
            <FiCheck size={18} />
            Time entry saved
          </SavedToast>
        )}
      </Container>
    </Wrapper>
  );
}
