import { FC, useEffect, useState } from 'react';
import { FeatureCollection, Geometry } from 'geojson';

import { User } from '@stream-io/video-client';

import LobbyPanel from '../../LobbyPanel';
import Header from '../../Header';
import { StreamMark } from '../../Icons';

import LobbyLayout from '../../Layout/LobbyLayout';

import styles from './LobbyView.module.css';

const loadingSentences = [
  'Joining call ...',
  'Looking for the fastest route ...',
  'Loading call ...',
  'Connecting ...',
  'Starting call ...',
];

export type Props = {
  logo: string;
  user: User;
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
  user,
}) => {
  const [loadingSentence, setLoadingSentence] = useState(loadingSentences[0]);
  useEffect(() => {
    const interval = setInterval(() => {
      const nextSentence =
        loadingSentences[
          (loadingSentences.indexOf(loadingSentence) + 1) %
            loadingSentences.length
        ];
      setLoadingSentence(nextSentence);
    }, 1000);
    return () => clearInterval(interval);
  }, [loadingSentence]);

  return (
    <LobbyLayout
      edges={edges}
      header={<Header logo={logo} callId={callId} isCallActive={false} />}
    >
      {isjoiningCall ? (
        <div className={styles.loadingPanel}>
          <StreamMark className={styles.loading} />
          <p>{loadingSentence}</p>
        </div>
      ) : (
        <LobbyPanel
          className={styles.lobbyPanel}
          joinCall={joinCall}
          logo={logo}
          call={call}
          user={user}
          fastestEdge={fastestEdge}
          isJoiningCall={Boolean(callId)}
        />
      )}
    </LobbyLayout>
  );
};
