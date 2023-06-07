import { JoinContainer } from './JoinContainer';

import * as data from './JoinContainer.data';

export default {
  component: JoinContainer,
  subcomponents: {},
  title: 'JoinContainer',
};

export const KichinSink = (props: any) => (
  <JoinContainer {...props}></JoinContainer>
);

KichinSink.args = {
  ...data.KichinSink,
};
