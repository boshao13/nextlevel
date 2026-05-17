import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const rootEl = document.getElementById('root');
const tree = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Prerendered routes ship with markup already inside #root — hydrate it.
// Cold-mount path (dev server, SPA navigation, or any route not in the
// prerender allow-list) falls back to a fresh client-side render.
if (rootEl.hasChildNodes()) {
  hydrateRoot(rootEl, tree);
} else {
  createRoot(rootEl).render(tree);
}
