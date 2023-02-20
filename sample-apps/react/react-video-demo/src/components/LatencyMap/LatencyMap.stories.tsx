import { LatencyMap } from './LatencyMap';

import * as data from './LatencyMap.data';

export default {
  component: LatencyMap,
  subcomponents: {},
  title: 'Map/LatencyMap',
};

export const KichinSink = (props: any) => <LatencyMap {...props}></LatencyMap>;

KichinSink.args = {
  ...data.KichinSink,
};
