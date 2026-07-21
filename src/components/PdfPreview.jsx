// src/components/PdfPreview.jsx
// Minimal pdfjs-dist v3 wrapper. Renders ALL pages of a PDF stacked vertically
// inside the component. Used by DocumentEditor and (later) SignDocument.
//
// Field overlays are rendered OVER each page by absolute-positioning into
// the per-page wrapper div via ReactDOM.createPortal. Each page wrap exposes
// `data-page` and `data-width-px` / `data-height-px` so overlays can compute
// normalized coords.
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf';
import 'pdfjs-dist/legacy/build/pdf.worker.entry';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  padding: 16px;
  background: #f3f4f6;
`;

const PdfPreview = ({ src, onPagesLoaded }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // isEvalSupported:false neutralizes CVE-2024-4367 (arbitrary JS via a
      // crafted FontMatrix) in pdfjs-dist 3.x. src is an object-URL string.
      const loadingTask = pdfjs.getDocument({ url: src, isEvalSupported: false });
      const pdf = await loadingTask.promise;
      if (cancelled) return;
      const newPages = [];
      if (containerRef.current) containerRef.current.innerHTML = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.4 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.display = 'block';

        const wrap = document.createElement('div');
        wrap.style.position = 'relative';
        wrap.style.background = 'white';
        wrap.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        wrap.style.width = `${viewport.width}px`;
        wrap.style.height = `${viewport.height}px`;
        wrap.dataset.page = String(i);
        wrap.dataset.widthPx = String(viewport.width);
        wrap.dataset.heightPx = String(viewport.height);
        wrap.appendChild(canvas);

        if (containerRef.current) containerRef.current.appendChild(wrap);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        newPages.push({ num: i, width: viewport.width, height: viewport.height, wrap });
      }
      if (!cancelled && onPagesLoaded) onPagesLoaded(newPages);
    })().catch((err) => console.error('PdfPreview load error:', err));

    return () => { cancelled = true; };
  }, [src]);

  return <Container ref={containerRef} />;
};

export default PdfPreview;
