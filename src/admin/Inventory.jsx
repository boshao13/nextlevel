// src/admin/Inventory.jsx
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import api from './api';
import {
  PageContainer, PageTitle, Card, Table, Th, Td,
  Input, Button,
} from './styles';
import { isHalfStep } from './halfStep';

const AmountInput = styled(Input)`
  max-width: 110px;
  text-align: right;
`;

const NegativeAmount = styled.span`
  color: #c62828;
  font-weight: 600;
`;

const ActionCell = styled(Td)`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

const IconBtn = styled.button`
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: #4a5468;
  border-radius: 6px;

  &:hover { background: #f0f4f9; color: #0f4c81; }
`;

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await api.get('/api/inventory');
    setItems(data);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const amt = Number(newAmount);
    if (!newName.trim() || !isHalfStep(amt)) {
      alert('Name required; amount must be a non-negative multiple of 0.5');
      return;
    }
    setBusy(true);
    try {
      await api.post('/api/inventory', { name: newName.trim(), amount: amt });
      setNewName(''); setNewAmount('');
      await load();
    } finally { setBusy(false); }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditAmount(String(item.amount));
  };

  const cancelEdit = () => { setEditingId(null); };

  const saveEdit = async (id) => {
    const amt = Number(editAmount);
    if (!editName.trim() || !isHalfStep(amt)) {
      alert('Name required; amount must be a non-negative multiple of 0.5');
      return;
    }
    setBusy(true);
    try {
      await api.put(`/api/inventory/${id}`, { name: editName.trim(), amount: amt });
      setEditingId(null);
      await load();
    } finally { setBusy(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from the list? Past usage entries stay intact.`)) return;
    setBusy(true);
    try {
      await api.delete(`/api/inventory/${id}`);
      await load();
    } finally { setBusy(false); }
  };

  return (
    <PageContainer>
      <PageTitle>Inventory</PageTitle>
      <Card>
        <Table>
          <thead>
            <tr><Th>Item</Th><Th style={{ textAlign: 'right' }}>Amount</Th><Th style={{ width: 130 }}></Th></tr>
          </thead>
          <tbody>
            <tr>
              <Td>
                <Input
                  placeholder="e.g. Polyaspartic Topcoat"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </Td>
              <Td style={{ textAlign: 'right' }}>
                <AmountInput
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="0"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                />
              </Td>
              <ActionCell>
                <Button onClick={handleAdd} disabled={busy}>
                  <FiPlus /> Add
                </Button>
              </ActionCell>
            </tr>
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
                      ? <AmountInput type="number" step="0.5" min="0" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
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
        </Table>
      </Card>
    </PageContainer>
  );
};

export default Inventory;
