import LocationPage from '../../../src/LocationPage';
import { ALBUQUERQUE } from '../../../src/locations';
import { locationMetadata, locationSchema } from '../../../src/locationSeo';
import { jsonLdString } from '../../../src/structuredData';

export const metadata = locationMetadata(ALBUQUERQUE);

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(locationSchema(ALBUQUERQUE)) }} />
      <LocationPage city={ALBUQUERQUE} />
    </>
  );
}
