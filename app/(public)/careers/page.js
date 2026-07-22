import Careers from '../../../src/Careers';
import { pageMetadata } from '../../../src/seo';

export const metadata = pageMetadata({
  title: 'Careers at Next Level Epoxy | Hiring Floor Installers in Albuquerque NM',
  description: "Join the Next Level Epoxy team — we're hiring floor installers and crew in Albuquerque & Santa Fe, NM. Apply online for current openings.",
  ogTitle: 'Careers at Next Level Epoxy | Hiring in Albuquerque NM',
  ogDescription: 'Join the Next Level Epoxy team — floor installer and crew roles in Albuquerque & Santa Fe, NM.',
  path: '/careers',
});

export default function CareersPage() {
  return <Careers />;
}
