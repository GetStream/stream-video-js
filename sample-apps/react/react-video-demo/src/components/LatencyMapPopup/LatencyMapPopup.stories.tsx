import { LatencyMapPopup } from './LatencyMapPopup';

import * as data from './LatencyMapPopup.data';

export default {
  component: LatencyMapPopup,
  subcomponents: {},
  title: 'Map/LatencyMapPopup',
};

export const KichinSink = (props: any) => (
  <LatencyMapPopup {...props}></LatencyMapPopup>
);

KichinSink.args = {
  ...data.KichinSink,
};
