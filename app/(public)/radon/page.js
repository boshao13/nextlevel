import Radon from '../../../src/Radon';
import { pageMetadata } from '../../../src/seo';

export const metadata = pageMetadata({
  title: 'Radon Mitigation & Epoxy Floor Sealing Albuquerque NM | Next Level',
  description: "Protect your home from radon with Next Level's 4-layer epoxy floor sealing system. Serving Albuquerque, Santa Fe & Rio Rancho NM. Free quote: 505-352-4674.",
  ogDescription: 'Seal foundation cracks against radon with our 4-layer epoxy system. Serving Albuquerque & Santa Fe NM.',
  path: '/radon',
});

export default function RadonPage() {
  return <Radon />;
}
