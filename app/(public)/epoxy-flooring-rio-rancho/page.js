import LocationPage from '../../../src/LocationPage';
import { RIO_RANCHO } from '../../../src/locations';
import { locationMetadata, locationSchema } from '../../../src/locationSeo';
import { jsonLdString } from '../../../src/structuredData';

export const metadata = locationMetadata(RIO_RANCHO);

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(locationSchema(RIO_RANCHO)) }} />
      <LocationPage city={RIO_RANCHO} />
    </>
  );
}
