import { SettingsPanel } from './SettingsPanel';

import * as data from './SettingsPanel.data';

export default {
  component: SettingsPanel,
  subcomponents: {},
  title: 'SettingsPanel',
};

export const KichinSink = (props: any) => (
  <SettingsPanel {...props}></SettingsPanel>
);

KichinSink.args = {
  ...data.KichinSink,
};
