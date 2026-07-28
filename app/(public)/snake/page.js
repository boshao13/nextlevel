import SnakeClientOnly from '../../../src/SnakeClientOnly';

// Easter egg — keep it out of the index entirely (it previously inherited the
// root layout's title, duplicating the home page's title in the SERPs while
// pulling 940 impressions at position 16 that belong on real pages).
export const metadata = {
  title: 'Snake — Next Level Epoxy',
  robots: { index: false, follow: true },
};

export default function SnakePage() {
  return <SnakeClientOnly />;
}
