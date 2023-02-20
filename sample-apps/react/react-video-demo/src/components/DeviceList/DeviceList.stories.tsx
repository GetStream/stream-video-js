import { DeviceList } from './DeviceList';

import * as data from './DeviceList.data';

export default {
  component: DeviceList,
  subcomponents: {},
  title: 'ControlMenu/DeviceList',
};

export const KichinSink = (props: any) => <DeviceList {...props}></DeviceList>;

KichinSink.args = {
  ...data.KichinSink,
};
