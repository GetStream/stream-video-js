import { Props } from './ControlButton';

import { Mic } from '../Icons';
import Panel from '../SettingsMenu';

export const KichinSink: Props = {
  label: 'mic',
  onClick: () => console.log('clicked'),
  prefix: <Mic />,
  panel: (
    <Panel title="Settings" icon={<Mic />}>
      Child
    </Panel>
  ),
};

export const Disabled: Props = {
  label: 'mic',
  onClick: () => console.log('clicked'),
  prefix: <Mic />,
  panel: (
    <Panel title="Settings" icon={<Mic />}>
      Child
    </Panel>
  ),
};
