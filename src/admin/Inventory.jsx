// src/admin/Inventory.jsx
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import api from './api';
import {
  PageContainer, PageTitle, Card, Table, Th, Td,
  Input, Button, EmptyState,
} from './styles';
import { isHalfStep } from './halfStep';

/* Add-item form: a row on desktop, a clean vertical stack on phones so the
   item field is full-width and legible instead of a crushed table cell. */
const AddForm = styled.form`
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #666;

  &.grow { flex: 1 1 240px; min-width: 0; }
  &.amount { flex: 0 0 140px; }

  @media (max-width: 640px) {
    &.amount { flex: 1 1 auto; }
  }
`;

const AddBtn = styled(Button)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 44px;
  white-space: nowrap;

  @media (max-width: 640px) {
    width: 100%;
    height: 48px;
  }
`;

const Notice = styled.p`
  color: ${({ $error }) => ($error ? '#c62828' : '#2e7d32')};
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: 12px;
`;

const TableScroll = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-top: 24px;
`;

const ItemsTable = styled(Table)`
  min-width: 420px; /* keep edit inputs usable; scrolls instead of crushing */
`;

const AmountInput = styled(Input)`
  text-align: right;
`;

const NegativeAmount = styled.span`
  color: #c62828;
  font-weight: 600;
`;

const ActionCell = styled(Td)`
  white-space: nowrap;
  text-align: right;
`;

const IconBtn = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #4a5468;
  border-radius: 6px;

  &:hover { background: #f0f4f9; color: #0f4c81; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

const errMsg = (err, fallback) =>
  err?.response?.data?.error || fallback;

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null); // { error: bool, text: string }

  const load = async () => {
    try {
      const { data } = await api.get('/inventory');
      setItems(data);
    } catch (err) {
      setNotice({ error: true, text: errMsg(err, 'Could not load inventory. Please refresh.') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setNotice(null);
    const amt = Number(newAmount);
    if (!newName.trim()) {
      setNotice({ error: true, text: 'Enter an item name.' });
      return;
    }
    if (!isHalfStep(amt)) {
      setNotice({ error: true, text: 'Amount must be 0 or higher, in steps of 0.5.' });
      return;
    }
    setBusy(true);
    try {
      await api.post('/inventory', { name: newName.trim(), amount: amt });
      setNewName('');
      setNewAmount('');
      setNotice({ error: false, text: 'Item added.' });
      await load();
    } catch (err) {
      setNotice({ error: true, text: errMsg(err, 'Could not add item. Please try again.') });
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (item) => {
    setNotice(null);
    setEditingId(item.id);
    setEditName(item.name);
    setEditAmount(String(item.amount));
  };

  const cancelEdit = () => { setEditingId(null); };

  const saveEdit = async (id) => {
    setNotice(null);
    const amt = Number(editAmount);
    if (!editName.trim()) {
      setNotice({ error: true, text: 'Item name cannot be empty.' });
      return;
    }
    if (!isHalfStep(amt)) {
      setNotice({ error: true, text: 'Amount must be 0 or higher, in steps of 0.5.' });
      return;
    }
    setBusy(true);
    try {
      await api.put(`/inventory/${id}`, { name: editName.trim(), amount: amt });
      setEditingId(null);
      await load();
    } catch (err) {
      setNotice({ error: true, text: errMsg(err, 'Could not save changes. Please try again.') });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from the list? Past usage entries stay intact.`)) return;
    setNotice(null);
    setBusy(true);
    try {
      await api.delete(`/inventory/${id}`);
      await load();
    } catch (err) {
      setNotice({ error: true, text: errMsg(err, 'Could not remove item. Please try again.') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageContainer>
      <PageTitle>Inventory</PageTitle>
      <Card>
        <AddForm onSubmit={handleAdd}>
          <Field className="grow">
            Item
            <Input
              placeholder="e.g. Polyaspartic Topcoat"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </Field>
          <Field className="amount">
            Amount
            <AmountInput
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              placeholder="0"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
            />
          </Field>
          <AddBtn type="submit" disabled={busy}>
            <FiPlus /> Add
          </AddBtn>
        </AddForm>

        {notice && <Notice $error={notice.error}>{notice.text}</Notice>}

        {!loading && items.length === 0 ? (
          <EmptyState>No items yet. Add your first one above.</EmptyState>
        ) : (
          <TableScroll>
            <ItemsTable>
              <thead>
                <tr>
                  <Th>Item</Th>
                  <Th style={{ textAlign: 'right' }}>Amount</Th>
                  <Th style={{ width: 110 }} />
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const editing = editingId === it.id;
                  const amt = Number(it.amount);
                  return (
                    <tr key={it.id}>
                      <Td>
                        {editing
                          ? <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                          : it.name}
                      </Td>
                      <Td style={{ textAlign: 'right' }}>
                        {editing
                          ? <AmountInput type="number" inputMode="decimal" step="0.5" min="0" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
                          : (amt < 0 ? <NegativeAmount>{amt}</NegativeAmount> : amt)}
                      </Td>
                      <ActionCell>
                        {editing ? (
                          <>
                            <IconBtn onClick={() => saveEdit(it.id)} disabled={busy} title="Save"><FiCheck /></IconBtn>
                            <IconBtn onClick={cancelEdit} title="Cancel"><FiX /></IconBtn>
                          </>
                        ) : (
                          <>
                            <IconBtn onClick={() => startEdit(it)} title="Edit"><FiEdit2 /></IconBtn>
                            <IconBtn onClick={() => handleDelete(it.id, it.name)} title="Remove"><FiTrash2 /></IconBtn>
                          </>
                        )}
                      </ActionCell>
                    </tr>
                  );
                })}
              </tbody>
            </ItemsTable>
          </TableScroll>
        )}
      </Card>
    </PageContainer>
  );
};

export default Inventory;
