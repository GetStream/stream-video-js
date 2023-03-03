import { FC } from 'react';

import {
  useActiveCall,
  useLocalParticipant,
} from '@stream-io/video-react-bindings';

import LobbyPanel from '../../LobbyPanel';
import Header from '../../Header';

import LobbyLayout from '../../Layout/LobbyLayout';

import styles from './LobbyView.module.css';

export type Props = {
  logo: string;
  avatar: string;
  joinCall(): void;
  callId: string;
  isCallActive: boolean;
};

export type Lobby = {
  call?: any;
  loading?: boolean;
};

export const Lobby: FC<Props & Lobby> = ({
  logo,
  avatar,
  joinCall,
  call,
  callId,
  isCallActive,
}) => {
  const localParticipant: any = useLocalParticipant();

  return (
    <LobbyLayout
      header={
        <Header logo={logo} callId={callId} isCallActive={isCallActive} />
      }
    >
      <LobbyPanel
        className={styles.lobbyPanel}
        joinCall={joinCall}
        logo={logo}
        avatar={avatar}
        call={call}
        localParticipant={localParticipant}
      />
    </LobbyLayout>
  );
};

export const LobbyView: FC<Props> = (props) => {
  const activeCall: any = useActiveCall();

  if (!activeCall || !activeCall?.data.call?.callCid)
    return <Lobby {...props} loading={true} />;

  return <Lobby call={activeCall} loading={false} {...props} />;
};
