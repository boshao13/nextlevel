import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  :root {
    /* ── Legacy tokens (admin CRM + not-yet-reskinned pages consume these — leave) ── */
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

    /* ── Dark-showroom system (public site reskin) ─────────────────────
       Breakpoints for new code (not vars — CSS can't): 600 / 900 / 1100px */

    /* Surfaces — charcoal base, graphite elevations */
    --bg0:         #0c0e11;
    --bg1:         #12151a;
    --surface:     #181c22;
    --surface-2:   #1f242c;
    --line:        rgba(255, 255, 255, 0.08);
    --line-strong: rgba(255, 255, 255, 0.16);

    /* Text on dark — tuned for WCAG AA */
    --text-hi:   #f4f6f8;
    --text-body: #c5cdd6;
    --text-dim:  #97a1ac;

    /* Resin amber (brand accent) + metallic blue (brand navy, lifted for dark) */
    --resin:      #f0a500;
    --resin-hot:  #ffc940;
    --resin-deep: #b97e00;
    --resin-grad: linear-gradient(135deg, #ffc940 0%, #f0a500 48%, #c98a00 100%);
    --steel:      #6aa5d8;
    --navy:       #0f4c81;

    /* Depth on dark */
    --shadow-dk-sm: 0 2px 10px rgba(0, 0, 0, 0.45);
    --shadow-dk-md: 0 12px 36px rgba(0, 0, 0, 0.5);
    --shadow-dk-lg: 0 28px 80px rgba(0, 0, 0, 0.6);
    --glow-resin:   0 0 28px rgba(240, 165, 0, 0.22);

    /* Type scale */
    --fs-hero:    clamp(2.7rem, 6.5vw, 4.8rem);
    --fs-h2:      clamp(2rem, 4.2vw, 3.1rem);
    --fs-h3:      clamp(1.2rem, 2vw, 1.5rem);
    --fs-lead:    clamp(1.05rem, 1.5vw, 1.25rem);
    --fs-body:    1rem;
    --fs-small:   0.875rem;
    --fs-eyebrow: 0.8rem;

    /* Spacing scale */
    --sp-1: 4px;
    --sp-2: 8px;
    --sp-3: 16px;
    --sp-4: 24px;
    --sp-5: 32px;
    --sp-6: 48px;
    --sp-7: 64px;
    --sp-8: 96px;
    --section-pad: clamp(72px, 10vw, 136px);
    --content-max: 1180px;

    /* Motion */
    --ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
    --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
    --dur-fast:    0.18s;
    --dur-med:     0.45s;
    --dur-slow:    0.8s;
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

  ::selection {
    background: rgba(240, 165, 0, 0.85);
    color: #14110a;
  }

  :focus-visible {
    outline: 2px solid var(--resin);
    outline-offset: 3px;
    border-radius: 2px;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
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

  /* ── Reduced motion: everything lands instantly, nothing loops ──── */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
    html {
      scroll-behavior: auto;
    }
    .reveal, .reveal-left, .reveal-right, .reveal-scale {
      opacity: 1;
      transform: none;
    }
  }
`;

export default GlobalStyle;
