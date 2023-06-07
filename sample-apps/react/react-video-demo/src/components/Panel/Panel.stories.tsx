import { Panel } from './Panel';

import * as data from './Panel.data';

export default {
  component: Panel,
  subcomponents: {},
  title: 'Panel',
};

export const KichinSink = (props: any) => <Panel {...props}></Panel>;

KichinSink.args = {
  ...data.KichinSink,
};
