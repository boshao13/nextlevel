// src/admin/FieldOverlay.jsx
// Absolute-positioned overlay rendered into each PdfPreview page wrapper.
//
// Field state (managed by parent via `value` / `onChange`):
//   [{ id?: number, tempId?: string, page: number, field_type, x, y, w, h, required, label?, sort_order }]
// Where x,y,w,h are normalized 0..1 against the page's pixel dimensions.
//
// Renders one ReactDOM.createPortal per page into that page's wrap div.
// `placingType` (when truthy) wires a one-shot click handler on each page wrap
// that drops a default-sized field box of that type at the click position.

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { FiX } from 'react-icons/fi';

const COLORS = {
  signature: '#fbbf24',  // amber
  initials:  '#f97316',  // orange
  date:      '#10b981',  // green
  text:      '#3b82f6',  // blue
};

const Box = styled.div`
  position: absolute;
  border: 2px dashed ${({ $color }) => $color};
  background: ${({ $color }) => $color}33;
  color: #1f2937;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .04em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  user-select: none;

  &::after {
    content: '';
    position: absolute;
    bottom: -4px; right: -4px;
    width: 12px; height: 12px;
    background: ${({ $color }) => $color};
    border: 2px solid white;
    border-radius: 2px;
    cursor: nwse-resize;
  }
`;

const RemoveBtn = styled.button`
  position: absolute;
  top: -10px; right: -10px;
  width: 20px; height: 20px;
  border-radius: 50%;
  background: white;
  border: 1.5px solid #c62828;
  color: #c62828;
  font-weight: 700;
  cursor: pointer;
  font-size: 12px;
  line-height: 0;
  display: flex; align-items: center; justify-content: center;
  padding: 0;
`;

let _tempCounter = 0;
const nextTempId = () => `tmp-${++_tempCounter}`;

export function newField(type, page, x, y) {
  return {
    tempId: nextTempId(),
    page,
    field_type: type,
    x,
    y,
    w: 0.22,
    h: 0.06,
    required: 1,
    label: null,
    sort_order: 0,
  };
}

const PageOverlay = ({ pageWrap, fields, page, onChange }) => {
  const [dragging, setDragging] = useState(null);
  const pageW = Number(pageWrap.dataset.widthPx);
  const pageH = Number(pageWrap.dataset.heightPx);

  useEffect(() => {
    const up = () => setDragging(null);
    const move = (e) => {
      if (!dragging) return;
      const dxPx = e.clientX - dragging.startMouseX;
      const dyPx = e.clientY - dragging.startMouseY;
      const dxN = dxPx / pageW;
      const dyN = dyPx / pageH;
      onChange((prev) => prev.map((f) => {
        const key = f.id ?? f.tempId;
        if (key !== dragging.key) return f;
        if (dragging.mode === 'move') {
          return {
            ...f,
            x: Math.max(0, Math.min(1 - f.w, dragging.startX + dxN)),
            y: Math.max(0, Math.min(1 - f.h, dragging.startY + dyN)),
          };
        }
        return {
          ...f,
          w: Math.max(0.04, Math.min(1 - f.x, dragging.startW + dxN)),
          h: Math.max(0.02, Math.min(1 - f.y, dragging.startH + dyN)),
        };
      }));
    };
    window.addEventListener('mouseup', up);
    window.addEventListener('mousemove', move);
    return () => {
      window.removeEventListener('mouseup', up);
      window.removeEventListener('mousemove', move);
    };
  }, [dragging, onChange, pageW, pageH]);

  const startDrag = (e, f, mode) => {
    e.stopPropagation();
    const key = f.id ?? f.tempId;
    setDragging({
      key, mode,
      startMouseX: e.clientX, startMouseY: e.clientY,
      startX: f.x, startY: f.y, startW: f.w, startH: f.h,
    });
  };

  const remove = (f) => {
    const key = f.id ?? f.tempId;
    onChange((prev) => prev.filter((x) => (x.id ?? x.tempId) !== key));
  };

  const pageFields = fields.filter((f) => f.page === page);

  return ReactDOM.createPortal(
    <>
      {pageFields.map((f) => {
        const key = f.id ?? f.tempId;
        const color = COLORS[f.field_type];
        return (
          <Box
            key={key}
            $color={color}
            style={{
              left:   `${f.x * 100}%`,
              top:    `${f.y * 100}%`,
              width:  `${f.w * 100}%`,
              height: `${f.h * 100}%`,
            }}
            onMouseDown={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const isHandle = (e.clientX > rect.right - 14) && (e.clientY > rect.bottom - 14);
              startDrag(e, f, isHandle ? 'resize' : 'move');
            }}
          >
            <span>{f.field_type}</span>
            <RemoveBtn onClick={(e) => { e.stopPropagation(); remove(f); }}>
              <FiX size={11} />
            </RemoveBtn>
          </Box>
        );
      })}
    </>,
    pageWrap
  );
};

const FieldOverlay = ({ pages, value, onChange, placingType, onPlaced }) => {
  useEffect(() => {
    if (!placingType) return;
    const handlers = [];
    pages.forEach((p) => {
      const handler = (e) => {
        // Don't trigger on clicks on existing field boxes (they handle themselves).
        if (e.target && e.target !== p.wrap && !e.target.closest('canvas')) return;
        const rect = p.wrap.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = (e.clientY - rect.top) / rect.height;
        const f = newField(
          placingType,
          p.num,
          Math.max(0, Math.min(0.78, nx - 0.11)),
          Math.max(0, Math.min(0.94, ny - 0.03)),
        );
        onChange((prev) => [...prev, f]);
        onPlaced();
      };
      p.wrap.addEventListener('click', handler);
      handlers.push({ wrap: p.wrap, handler });
    });
    return () => handlers.forEach(({ wrap, handler }) => wrap.removeEventListener('click', handler));
  }, [pages, placingType, onChange, onPlaced]);

  return (
    <>
      {pages.map((p) => (
        <PageOverlay key={p.num} pageWrap={p.wrap} fields={value} page={p.num} onChange={onChange} />
      ))}
    </>
  );
};

export default FieldOverlay;
