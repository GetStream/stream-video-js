import { Portal } from './Portal';

import * as data from './Portal.data';

export default {
  component: Portal,
  subcomponents: {},
  title: 'Portal',
};

export const KichinSink = (props: any) => {
  const { children, ...rest } = props;
  return (
    <>
      <Portal {...rest}>{children}</Portal>
      <div id="selector"></div>
    </>
  );
};

KichinSink.args = {
  ...data.KichinSink,
};
