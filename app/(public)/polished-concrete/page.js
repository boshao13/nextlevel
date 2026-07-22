import PolishedConcreteDivision from '../../../src/PolishedConcreteDivision';
import { pageMetadata } from '../../../src/seo';

export const metadata = {
  ...pageMetadata({
    title: 'Polished Concrete Floors — Next Level Polished Concrete (Our Sister Company)',
    description: 'Want polished, dyed, stained, or grind-and-seal concrete instead of an epoxy coating? Our sister company, Next Level Polished Concrete, delivers extremely high-quality polished concrete across Albuquerque, Santa Fe & Rio Rancho NM.',
    ogTitle: 'Polished Concrete Floors — Next Level Polished Concrete',
    ogDescription: 'Our sister company delivers polished, dyed, stained & grind-and-seal concrete across New Mexico.',
    path: '/polished-concrete',
  }),
  keywords: 'polished concrete Albuquerque, dyed concrete Santa Fe, stained concrete Rio Rancho, grind and seal NM, Next Level Polished Concrete',
};

export default function PolishedConcretePage() {
  return <PolishedConcreteDivision />;
}
