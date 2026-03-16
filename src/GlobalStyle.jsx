import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  :root {
    --primary:       #0f4c81;
    --primary-dark:  #0a3356;
    --primary-light: #1a6ab5;
    --accent:        #f0a500;
    --accent-light:  #ffc940;
    --white:         #ffffff;
    --bg:            #f8fafd;
    --text:          #1a1a2e;
    --text-mid:      #555;
    --text-light:    #888;
    --border:        rgba(15, 76, 129, 0.15);
    --shadow-sm:     0 2px 8px rgba(0, 0, 0, 0.06);
    --shadow-md:     0 8px 30px rgba(0, 0, 0, 0.10);
    --shadow-lg:     0 20px 60px rgba(0, 0, 0, 0.18);
    --radius-sm:     8px;
    --radius-md:     16px;
    --radius-lg:     28px;
    --radius-full:   9999px;
    --transition:    0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    scroll-behavior: smooth;
    font-size: 16px;
  }

  body {
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: var(--text);
    background-color: var(--white);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;

    @media (max-width: 900px) {
      padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px));
    }
  }

  img, video {
    max-width: 100%;
    display: block;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  /* Hidden SEO h1 */
  body > h1 {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }

  /* ── Scroll-reveal utility classes ──────────────────────────────── */
  .reveal {
    opacity: 0;
    transform: translateY(32px);
    transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
                transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .reveal-left {
    opacity: 0;
    transform: translateX(-40px);
    transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
                transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .reveal-left.visible {
    opacity: 1;
    transform: translateX(0);
  }

  .reveal-right {
    opacity: 0;
    transform: translateX(40px);
    transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
                transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .reveal-right.visible {
    opacity: 1;
    transform: translateX(0);
  }

  .reveal-scale {
    opacity: 0;
    transform: scale(0.92);
    transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
                transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .reveal-scale.visible {
    opacity: 1;
    transform: scale(1);
  }

  /* Stagger children delays */
  .stagger > *:nth-child(1) { transition-delay: 0s; }
  .stagger > *:nth-child(2) { transition-delay: 0.1s; }
  .stagger > *:nth-child(3) { transition-delay: 0.2s; }
  .stagger > *:nth-child(4) { transition-delay: 0.3s; }
  .stagger > *:nth-child(5) { transition-delay: 0.4s; }
  .stagger > *:nth-child(6) { transition-delay: 0.5s; }
  .stagger > *:nth-child(7) { transition-delay: 0.6s; }
  .stagger > *:nth-child(8) { transition-delay: 0.7s; }
`;

export default GlobalStyle;
