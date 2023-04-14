import { LobbyView } from './LobbyView';

import * as data from './LobbyView.data';

export default {
  component: LobbyView,
  subcomponents: {},
  title: 'Call/LobbyView',
};

export const KichinSink = (props: any) => <LobbyView {...props}></LobbyView>;

KichinSink.args = {
  ...data.KichinSink,
};
