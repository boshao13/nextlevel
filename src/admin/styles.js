import styled, { css } from 'styled-components';

export const PageContainer = styled.div`
  width: 100%;
  padding: 32px;
  background: white;
`;

export const PageTitle = styled.h1`
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 24px;
`;

export const Card = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04);
  padding: 24px;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

export const Th = styled.th`
  text-align: left;
  padding: 12px 16px;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #666;
  border-bottom: 2px solid #eee;
  font-weight: 700;
`;

export const Td = styled.td`
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.9rem;
  color: var(--text);
`;

export const Button = styled.button`
  padding: 10px 20px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  font-family: inherit;
  transition: background 0.2s, transform 0.2s;

  &:hover {
    background: var(--primary-dark);
    transform: translateY(-1px);
  }
`;

export const ButtonSecondary = styled.button`
  padding: 10px 20px;
  background: transparent;
  color: var(--text);
  border: 1.5px solid #ddd;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  font-family: inherit;
  transition: border-color 0.2s, color 0.2s, transform 0.2s;

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
    transform: translateY(-1px);
  }
`;

const statusColors = {
  new: { bg: '#e3f2fd', color: '#1565c0' },
  draft: { bg: '#e3f2fd', color: '#1565c0' },
  contacted: { bg: '#fff3e0', color: '#e65100' },
  sent: { bg: '#fff3e0', color: '#e65100' },
  quoted: { bg: '#e8f5e9', color: '#2e7d32' },
  accepted: { bg: '#e8f5e9', color: '#2e7d32' },
  scheduled: { bg: '#fce4ec', color: '#c62828' },
  in_progress: { bg: '#fce4ec', color: '#c62828' },
  completed: { bg: '#e8f5e9', color: '#2e7d32' },
  paid: { bg: '#e8f5e9', color: '#2e7d32' },
  closed: { bg: '#f5f5f5', color: '#616161' },
  declined: { bg: '#f5f5f5', color: '#616161' },
  cancelled: { bg: '#f5f5f5', color: '#616161' },
  overdue: { bg: '#f5f5f5', color: '#616161' },
};

export const StatusBadge = styled.span`
  display: inline-block;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  ${({ $status }) => {
    const s = statusColors[$status] || statusColors.new;
    return css`
      background: ${s.bg};
      color: ${s.color};
    `;
  }}
`;

export const Input = styled.input`
  width: 100%;
  padding: 10px 14px;
  font-size: 0.9rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;

  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(15, 76, 129, 0.1);
  }
`;

export const Select = styled.select`
  width: 100%;
  padding: 10px 14px;
  font-size: 0.9rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 36px;

  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(15, 76, 129, 0.1);
  }
`;

export const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 14px;
  font-size: 0.9rem;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  resize: vertical;
  min-height: 100px;

  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(15, 76, 129, 0.1);
  }
`;

export const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

export const Modal = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
`;

export const ModalTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 20px;
`;

export const SummaryCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04);
`;

export const SummaryLabel = styled.div`
  font-size: 0.78rem;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

export const SummaryValue = styled.div`
  font-size: 2rem;
  font-weight: 800;
  color: var(--text);
`;

export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
`;

export const ActionButton = styled.button`
  padding: 6px 14px;
  font-size: 0.8rem;
  border-radius: 6px;
  background: var(--primary);
  color: white;
  border: none;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s, transform 0.2s;

  &:hover {
    background: var(--primary-dark);
    transform: translateY(-1px);
  }
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 0.95rem;
`;

export const ClickableRow = styled.tr`
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #f8fafd;
  }
`;
