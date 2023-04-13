import { ControlMenu } from './ControlMenu';
import { MediaDevicesProvider } from '@stream-io/video-react-sdk';

import * as data from './ControlMenu.data';

export default {
  component: ControlMenu,
  subcomponents: {},
  title: 'ControlMenu/ControlMenu',
};

export const KichinSink = (props: any) => (
  <MediaDevicesProvider>
    <ControlMenu {...props}></ControlMenu>
  </MediaDevicesProvider>
);

KichinSink.args = {
  ...data.KichinSink,
};
