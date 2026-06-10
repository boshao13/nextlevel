// src/admin/Payroll.jsx
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FiPlay, FiUnlock, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import api from './api';
import {
  PageContainer, PageTitle, Card, Table, Th, Td,
  Input, TextArea, Button, ButtonSecondary, Select,
} from './styles';
import { useAuth } from './AdminRoute';
import { PAY_SCHEDULE } from './payScheduleData';

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const DateRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  > div { flex: 1; }
  label { display: block; font-size: 0.78rem; font-weight: 600; color: #4a5468; margin-bottom: 4px; }
`;

const HistoryRow = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  opacity: ${({ $unlocked }) => ($unlocked ? 0.55 : 1)};
`;

const HistoryHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
`;

const fmtMoney = (n) => `$${Number(n || 0).toFixed(2)}`;
const fmtDate = (s) => String(s || '').slice(0, 10);
// 'YYYY-MM-DD' → 'MM/DD/YYYY' for option labels (string ops only — never new Date(iso))
const fmtUS = (ymd) => {
  const [y, m, d] = String(ymd).split('-');
  return `${m}/${d}/${y}`;
};

const Payroll = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [start, setStart] = useState('');
  const [end, setEnd] = useState(new Date().toISOString().slice(0, 10));
  const [periodSel, setPeriodSel] = useState('');

  const onSelectPeriod = (e) => {
    const v = e.target.value;
    setPeriodSel(v);
    if (!v) return;
    const p = PAY_SCHEDULE.find((r) => r.start === v);
    if (p) {
      setStart(p.start);
      setEnd(p.end);
    }
  };

  const [preview, setPreview] = useState(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [runs, setRuns] = useState([]);
  const [expanded, setExpanded] = useState({});

  const loadRuns = async () => {
    const { data } = await api.get('/payroll/runs');
    setRuns(data);
    if (data.length && !start) {
      const lastActive = data.find(r => !r.unlocked_at);
      if (lastActive) {
        // TZ-safe day math on YYYY-MM-DD string parts (avoid `new Date(iso)` UTC parsing).
        const ymd = String(lastActive.period_end).slice(0, 10);
        const [y, m, d] = ymd.split('-').map(Number);
        const next = new Date(y, m - 1, d + 1);
        const pad = (n) => String(n).padStart(2, '0');
        setStart(`${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`);
      }
    }
  };

  useEffect(() => { loadRuns(); }, []);

  // Debounced preview when both dates set
  useEffect(() => {
    if (!start || !end) { setPreview(null); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/payroll/preview', { params: { start, end } });
        setPreview(data);
      } catch (e) {
        setPreview(null);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [start, end]);

  const runPayroll = async () => {
    if (!preview || preview.total_hours === 0) {
      alert('No timesheet entries in this range.');
      return;
    }
    const msg = `You're about to lock ${preview.entry_ids.length} entries from ${fmtDate(start)} – ${fmtDate(end)}. Total: ${fmtMoney(preview.total_gross)}. This will be saved to history. Continue?`;
    if (!window.confirm(msg)) return;
    setBusy(true);
    try {
      await api.post('/payroll/runs', { start, end, notes: notes || null });
      setNotes('');
      setStart('');
      setPeriodSel('');
      setPreview(null);
      await loadRuns();
      alert('Payroll saved to history.');
    } catch (err) {
      const m = err?.response?.data?.error || 'Failed to run payroll.';
      alert(m);
    } finally { setBusy(false); }
  };

  const unlockRun = async (run) => {
    if (!window.confirm(`Unlock payroll from ${fmtDate(run.period_start)}–${fmtDate(run.period_end)}? Underlying entries become editable again. Snapshot is preserved.`)) return;
    setBusy(true);
    try {
      await api.delete(`/payroll/runs/${run.id}`);
      await loadRuns();
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to unlock.');
    } finally { setBusy(false); }
  };

  return (
    <PageContainer>
      <PageTitle>Payroll</PageTitle>
      <Grid>
        {/* LEFT: run a new payroll */}
        <Card>
          <h3 style={{ marginTop: 0 }}>Run a new payroll</h3>
          <DateRow>
            <div>
              <label htmlFor="payroll-period">Pay period (from schedule)</label>
              <Select id="payroll-period" value={periodSel} onChange={onSelectPeriod}>
                <option value="">— Custom dates —</option>
                {PAY_SCHEDULE.map((p) => (
                  <option key={p.start} value={p.start}>
                    {fmtUS(p.start)} – {fmtUS(p.end)} · payday {fmtUS(p.payday)}
                  </option>
                ))}
              </Select>
            </div>
          </DateRow>
          <DateRow>
            <div>
              <label htmlFor="payroll-start">Start</label>
              <Input id="payroll-start" type="date" value={start}
                onChange={(e) => { setStart(e.target.value); setPeriodSel(''); }} />
            </div>
            <div>
              <label htmlFor="payroll-end">End</label>
              <Input id="payroll-end" type="date" value={end}
                onChange={(e) => { setEnd(e.target.value); setPeriodSel(''); }} />
            </div>
          </DateRow>

          {preview && (
            <Table>
              <thead>
                <tr>
                  <Th>Worker</Th>
                  <Th style={{ textAlign: 'right' }}>Hours</Th>
                  <Th style={{ textAlign: 'right' }}>Rate</Th>
                  <Th style={{ textAlign: 'right' }}>Gross</Th>
                </tr>
              </thead>
              <tbody>
                {preview.workers.map(w => (
                  <tr key={w.worker}>
                    <Td>{w.name}</Td>
                    <Td style={{ textAlign: 'right' }}>{w.hours}</Td>
                    <Td style={{ textAlign: 'right' }}>{fmtMoney(w.rate)}</Td>
                    <Td style={{ textAlign: 'right' }}>{fmtMoney(w.gross)}</Td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid #0f4c81', fontWeight: 700 }}>
                  <Td>Total</Td>
                  <Td style={{ textAlign: 'right' }}>{preview.total_hours}</Td>
                  <Td></Td>
                  <Td style={{ textAlign: 'right' }}>{fmtMoney(preview.total_gross)}</Td>
                </tr>
              </tbody>
            </Table>
          )}

          <TextArea
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            style={{ marginTop: 12 }}
          />
          <Button onClick={runPayroll} disabled={busy || !preview || preview.total_hours === 0} style={{ marginTop: 12 }}>
            <FiPlay /> Run Payroll
          </Button>
        </Card>

        {/* RIGHT: history */}
        <Card>
          <h3 style={{ marginTop: 0 }}>History</h3>
          {runs.length === 0 && <p style={{ color: '#6b7280' }}>No runs yet.</p>}
          {runs.map(run => {
            const isOpen = expanded[run.id];
            const snapshot = typeof run.snapshot === 'string' ? JSON.parse(run.snapshot) : run.snapshot;
            return (
              <HistoryRow key={run.id} $unlocked={Boolean(run.unlocked_at)}>
                <HistoryHeader onClick={() => setExpanded(s => ({ ...s, [run.id]: !s[run.id] }))}>
                  <strong>{fmtDate(run.period_start)} – {fmtDate(run.period_end)}</strong>
                  <span>{fmtMoney(run.total_gross)}</span>
                  <span style={{ color: '#6b7280', fontSize: '.85rem', marginLeft: 'auto' }}>
                    {run.unlocked_at ? `unlocked by ${run.unlocked_by}` : `${run.run_by} · ${fmtDate(run.run_at)}`}
                  </span>
                  {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                </HistoryHeader>
                {isOpen && snapshot && (
                  <Table style={{ marginTop: 12 }}>
                    <tbody>
                      {(snapshot.workers || []).map(w => (
                        <tr key={w.worker}>
                          <Td>{w.name}</Td>
                          <Td style={{ textAlign: 'right' }}>{w.hours} h</Td>
                          <Td style={{ textAlign: 'right' }}>{fmtMoney(w.gross)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
                {isAdmin && !run.unlocked_at && (
                  <ButtonSecondary onClick={() => unlockRun(run)} style={{ marginTop: 8 }} disabled={busy}>
                    <FiUnlock /> Unlock
                  </ButtonSecondary>
                )}
              </HistoryRow>
            );
          })}
        </Card>
      </Grid>
    </PageContainer>
  );
};

export default Payroll;
