import { ControlButton } from './ControlButton';

import * as data from './ControlButton.data';

export default {
  component: ControlButton,
  subcomponents: {},
  title: 'ControlMenu/ControlButton',
};

export const KichinSink = (props: any) => (
  <ControlButton {...props}></ControlButton>
);

KichinSink.args = {
  ...data.KichinSink,
};

export const Disabled = (props: any) => (
  <ControlButton {...props}></ControlButton>
);

Disabled.args = {
  ...data.Disabled,
};
