import PublicChrome from '../src/PublicChrome';
import NotFound from '../src/NotFound';

export const metadata = {
  title: 'Page Not Found | Next Level Epoxy',
};

export default function NotFoundPage() {
  return (
    <PublicChrome>
      <NotFound />
    </PublicChrome>
  );
}
