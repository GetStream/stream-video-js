import { ParticipantsPanel } from './ParticipantsPanel';

import * as data from './ParticipantsPanel.data';

export default {
  component: ParticipantsPanel,
  subcomponents: {},
  title: 'Panel/ParticipantsPanel',
};

export const KichinSink = (props: any) => {
  return <ParticipantsPanel {...props} />;
};
