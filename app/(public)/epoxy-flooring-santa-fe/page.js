import LocationPage from '../../../src/LocationPage';
import { SANTA_FE } from '../../../src/locations';
import { locationMetadata, locationSchema } from '../../../src/locationSeo';
import { jsonLdString } from '../../../src/structuredData';

export const metadata = locationMetadata(SANTA_FE);

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(locationSchema(SANTA_FE)) }} />
      <LocationPage city={SANTA_FE} />
    </>
  );
}
