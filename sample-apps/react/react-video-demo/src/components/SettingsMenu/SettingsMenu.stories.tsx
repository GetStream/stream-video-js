import { SettingsMenu } from './SettingsMenu';

import * as data from './SettingsMenu.data';

export default {
  component: SettingsMenu,
  subcomponents: {},
  title: 'SettingsMenu',
};

export const KichinSink = (props: any) => (
  <SettingsMenu {...props}></SettingsMenu>
);

KichinSink.args = {
  ...data.KichinSink,
};
