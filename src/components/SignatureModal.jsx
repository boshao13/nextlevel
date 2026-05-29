// src/components/SignatureModal.jsx
// Tabbed Type / Draw signature capture. Calls onAdopt({ value_text, value_image }).
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import SignaturePad from 'signature_pad';

const Backdrop = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.55);
  z-index: 9999; display: flex; align-items: center; justify-content: center;
`;

const Box = styled.div`
  background: white; border-radius: 12px; padding: 22px;
  width: min(560px, 92vw); max-height: 90vh; overflow: auto;
`;

const Tabs = styled.div`
  display: flex; gap: 6px; margin-bottom: 14px;
`;

const Tab = styled.button`
  padding: 8px 14px; border-radius: 8px;
  border: 1.5px solid ${({ active }) => active ? '#0f4c81' : '#cbd5e0'};
  background: ${({ active }) => active ? '#0f4c81' : 'white'};
  color: ${({ active }) => active ? 'white' : '#1f2937'};
  cursor: pointer; font-weight: 600;
`;

const Big = styled.input`
  width: 100%; box-sizing: border-box;
  padding: 18px; font-size: 2rem;
  font-family: 'Dancing Script', cursive;
  border: 1.5px solid #cbd5e0; border-radius: 8px; outline: none;

  &:focus { border-color: #0f4c81; }
`;

const PadWrap = styled.div`
  position: relative; border: 1.5px solid #cbd5e0; border-radius: 8px; background: white;
  canvas { display: block; width: 100%; height: 200px; }
`;

const Actions = styled.div`
  display: flex; gap: 10px; justify-content: flex-end; margin-top: 14px;
`;

const Btn = styled.button`
  padding: 10px 18px; border-radius: 999px; border: none; cursor: pointer;
  font-weight: 700; background: #0f4c81; color: white;

  &[disabled] { background: #c5d5e8; cursor: not-allowed; }
`;

const BtnGhost = styled(Btn)`
  background: white; color: #0f4c81; border: 1.5px solid #cbd5e0;
`;

const SignatureModal = ({ onAdopt, onClose, initialMode = 'type', initialText = '' }) => {
  const [mode, setMode] = useState(initialMode);
  const [typed, setTyped] = useState(initialText);
  const canvasRef = useRef(null);
  const padRef = useRef(null);

  useEffect(() => {
    if (mode !== 'draw' || !canvasRef.current) return;
    const c = canvasRef.current;
    c.width = c.clientWidth;
    c.height = c.clientHeight;
    const pad = new SignaturePad(c, {
      penColor: '#0f1830',
      backgroundColor: 'rgba(255,255,255,0)',
    });
    padRef.current = pad;
    return () => { pad.off(); padRef.current = null; };
  }, [mode]);

  const adopt = () => {
    if (mode === 'type') {
      const v = typed.trim();
      if (!v) return;
      const c = document.createElement('canvas');
      c.width = 600; c.height = 140;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#0f1830';
      ctx.font = '54px "Dancing Script", cursive';
      ctx.textBaseline = 'middle';
      ctx.fillText(v, 12, 70);
      onAdopt({ value_text: v, value_image: c.toDataURL('image/png') });
    } else {
      const pad = padRef.current;
      if (!pad || pad.isEmpty()) return;
      onAdopt({ value_text: '', value_image: pad.toDataURL('image/png') });
    }
  };

  return (
    <Backdrop onClick={onClose}>
      <Box onClick={(e) => e.stopPropagation()}>
        <Tabs>
          <Tab active={mode === 'type'} onClick={() => setMode('type')}>Type</Tab>
          <Tab active={mode === 'draw'} onClick={() => setMode('draw')}>Draw</Tab>
        </Tabs>
        {mode === 'type' && (
          <Big autoFocus value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Your name" />
        )}
        {mode === 'draw' && (
          <PadWrap>
            <canvas ref={canvasRef} />
          </PadWrap>
        )}
        <Actions>
          {mode === 'draw' && <BtnGhost onClick={() => padRef.current?.clear()}>Clear</BtnGhost>}
          <BtnGhost onClick={onClose}>Cancel</BtnGhost>
          <Btn onClick={adopt} disabled={mode === 'type' ? !typed.trim() : false}>Adopt and sign</Btn>
        </Actions>
      </Box>
    </Backdrop>
  );
};

export default SignatureModal;
