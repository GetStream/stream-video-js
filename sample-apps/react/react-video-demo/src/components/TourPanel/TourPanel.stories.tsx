import { TourPanel } from './TourPanel';

import * as data from './TourPanel.data';

export default {
  component: TourPanel,
  subcomponents: {},
  title: 'TourPanel',
};

export const KichinSink = (props: any) => <TourPanel {...props}></TourPanel>;

KichinSink.args = {
  ...data.KichinSink,
};
