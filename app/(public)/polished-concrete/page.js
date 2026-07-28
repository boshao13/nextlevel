import PolishedConcreteDivision from '../../../src/PolishedConcreteDivision';
import { pageMetadata } from '../../../src/seo';

export const metadata = {
  ...pageMetadata({
    title: 'Polished Concrete Albuquerque NM | Next Level Polished Concrete',
    description: 'Polished, dyed, stained & grind-and-seal concrete floors in Albuquerque, Santa Fe & Rio Rancho NM from our sister company. Free quote: 505-352-4674.',
    ogTitle: 'Polished Concrete Floors — Next Level Polished Concrete',
    ogDescription: 'Our sister company delivers polished, dyed, stained & grind-and-seal concrete across New Mexico.',
    path: '/polished-concrete',
  }),
  keywords: 'polished concrete Albuquerque, dyed concrete Santa Fe, stained concrete Rio Rancho, grind and seal NM, Next Level Polished Concrete',
};

export default function PolishedConcretePage() {
  return <PolishedConcreteDivision />;
}
