import { InvitePanel } from './InvitePanel';

import * as data from './InvitePanel.data';

export default {
  component: InvitePanel,
  subcomponents: {},
  title: 'InvitePanel',
};

export const KichinSink = (props: any) => (
  <InvitePanel {...props}></InvitePanel>
);

KichinSink.args = {
  ...data.KichinSink,
};
