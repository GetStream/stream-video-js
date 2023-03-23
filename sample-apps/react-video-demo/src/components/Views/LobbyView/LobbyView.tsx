import { FC } from 'react';
import { FeatureCollection, Geometry } from 'geojson';

import LobbyPanel from '../../LobbyPanel';
import Header from '../../Header';

import LobbyLayout from '../../Layout/LobbyLayout';

import styles from './LobbyView.module.css';

export type Props = {
  logo: string;
  avatar?: string;
  joinCall(): void;
  callId: string;
  edges?: FeatureCollection<Geometry>;
  fastestEdge: any;
  isjoiningCall: boolean;
};

export type Lobby = {
  call?: any;
  loading?: boolean;
};

export const LobbyView: FC<Props & Lobby> = ({
  logo,
  joinCall,
  call,
  callId,
  edges,
  fastestEdge,
  isjoiningCall,
}) => {
  return (
    <LobbyLayout
      edges={edges}
      header={<Header logo={logo} callId={callId} isCallActive={false} />}
    >
      {isjoiningCall ? (
        <div> Joining call ... </div>
      ) : (
        <LobbyPanel
          className={styles.lobbyPanel}
          joinCall={joinCall}
          logo={logo}
          call={call}
          fastestEdge={fastestEdge}
        />
      )}
    </LobbyLayout>
  );
};
