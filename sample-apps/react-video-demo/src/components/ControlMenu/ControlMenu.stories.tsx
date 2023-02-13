import { ControlMenu } from './ControlMenu';

import * as data from './ControlMenu.data';

export default {
  component: ControlMenu,
  subcomponents: {},
  title: 'ControlMenu/ControlMenu',
};

export const KichinSink = (props: any) => (
  <ControlMenu {...props}></ControlMenu>
);

KichinSink.args = {
  ...data.KichinSink,
};
