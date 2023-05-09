import { LobbyPanel } from './LobbyPanel';

export default {
  component: LobbyPanel,
  subcomponents: {},
  title: 'Lobby/LobbyPanel',
};

export const KichinSink = (props: any) => {
  return <LobbyPanel {...props} />;
};
