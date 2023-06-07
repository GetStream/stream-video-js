import {} from 'geojson';

import { Props } from './LatencyMap';
import { serverMarkerFeatures } from '../../../data/servers';

export const KichinSink: Props = {
  sourceData: serverMarkerFeatures,
};
