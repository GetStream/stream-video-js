import { Feedback } from './Feedback';

import * as data from './Feedback.data';

export default {
  component: Feedback,
  subcomponents: {},
  title: 'Feedback',
};

export const KichinSink = (props: any) => {
  return <Feedback {...props} />;
};

KichinSink.args = {
  ...data.KichinSink,
};
