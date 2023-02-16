import { ControlMenuPanel } from './ControlMenuPanel';

import * as data from './ControlMenuPanel.data';

export default {
  component: ControlMenuPanel,
  subcomponents: {},
  title: 'ControlMenu/ControlMenuPanel',
};

export const KichinSink = (props: any) => (
  <ControlMenuPanel {...props}></ControlMenuPanel>
);

KichinSink.args = {
  ...data.KichinSink,
};
