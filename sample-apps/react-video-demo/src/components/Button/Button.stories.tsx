import { Button } from './Button';

import * as data from './Button.data';

export default {
  component: Button,
  subcomponents: {},
  title: 'Button',
};

export const KichinSink = (props: any) => <Button {...props}></Button>;

KichinSink.args = {
  ...data.KichinSink,
};
