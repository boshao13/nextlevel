import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

/* Shared flake-swatch modal (used by /colors and /patios).
   item: { name, sku, collection, img, inStock } */

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(5, 6, 8, 0.8);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const ModalBox = styled.div`
  background: var(--surface);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-dk-lg);
  max-width: 560px;
  width: 100%;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  position: relative;
`;

const ModalImg = styled.img`
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
`;

const ModalBody = styled.div`
  padding: 20px 24px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

const ModalInfo = styled.div``;

const ModalName = styled.h3`
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text-hi);
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ModalMeta = styled.p`
  font-size: 0.82rem;
  color: var(--text-dim);
  margin-top: 4px;
  letter-spacing: 0.02em;
`;

const ModalCta = styled.button`
  padding: 12px 24px;
  background: var(--resin-grad);
  color: #14110a;
  font-size: 0.92rem;
  font-weight: 700;
  font-family: inherit;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  white-space: nowrap;
  transition: transform var(--transition), filter var(--transition);

  &:hover {
    filter: brightness(1.07);
    transform: translateY(-2px);
  }
`;

const ModalClose = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--line-strong);
  background: rgba(12, 14, 17, 0.7);
  backdrop-filter: blur(8px);
  color: var(--text-hi);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition), border-color var(--transition);

  &:hover {
    background: var(--resin);
    border-color: var(--resin);
    color: #14110a;
  }
`;

const InStockBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 14px;
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: var(--radius-full);
  font-size: 0.72rem;
  font-weight: 700;
  color: #4ade80;
  text-transform: uppercase;
  letter-spacing: 0.06em;

  &::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #4ade80;
  }
`;

/**
 * Props:
 *  - item: { name, sku, collection, img, inStock }
 *  - onClose: () => void
 *  - onQuote: optional () => void — defaults to navigating home and
 *    scrolling to the contact form (Header listens for scrollToContact).
 */
const SwatchModal = ({ item, onClose, onQuote }) => {
  const closeRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    if (closeRef.current) closeRef.current.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const goQuote = () => {
    onClose();
    if (onQuote) {
      onQuote();
    } else {
      navigate('/', { state: { scrollToContact: true } });
    }
  };

  return (
    <Backdrop onClick={onClose}>
      <ModalBox
        role="dialog"
        aria-modal="true"
        aria-label={`${item.name} flake color`}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalClose ref={closeRef} onClick={onClose} aria-label="Close">✕</ModalClose>
        <ModalImg src={item.img} alt={`${item.name} epoxy flake blend — close-up`} />
        <ModalBody>
          <ModalInfo>
            <ModalName>
              {item.name}
              {item.inStock && <InStockBadge>In Stock</InStockBadge>}
            </ModalName>
            <ModalMeta>
              {item.collection}{item.sku ? ` · ${item.sku}` : ''}
            </ModalMeta>
          </ModalInfo>
          <ModalCta onClick={goQuote}>Get a Free Quote →</ModalCta>
        </ModalBody>
      </ModalBox>
    </Backdrop>
  );
};

export default SwatchModal;
