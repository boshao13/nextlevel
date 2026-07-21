'use client';

import React, { useState } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { ServerStyleSheet, StyleSheetManager } from 'styled-components';

/**
 * Collects styled-components CSS generated during the server render and
 * injects it into the streamed <head>, so every page arrives fully styled
 * before any JS runs (replaces the prerender CSSOM-snapshot hack in
 * scripts/prerender.js). Pairs with compiler.styledComponents.
 */
export default function StyledComponentsRegistry({ children }) {
  // Lazy-init one sheet per request on the server.
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement();
    styledComponentsStyleSheet.instance.clearTag();
    return <>{styles}</>;
  });

  // In the browser, styled-components manages its own stylesheet.
  if (typeof window !== 'undefined') return <>{children}</>;

  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>
      {children}
    </StyleSheetManager>
  );
}
