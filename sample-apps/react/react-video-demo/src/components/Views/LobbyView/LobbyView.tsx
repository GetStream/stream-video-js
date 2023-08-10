import { FC, useEffect, useState } from 'react';
import { FeatureCollection, Geometry } from 'geojson';

import { User } from '@stream-io/video-react-sdk';

import LobbyPanel from '../../LobbyPanel';
import Header from '../../Header';

import { MediaPermissionsError, requestMediaPermissions } from 'mic-check';

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
  fastestEdge?: {
    id: string;
    latency: number;
  };
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

  const [permissionsEnabled, setPermissionsEnabled] = useState<boolean>(true);

  useEffect(() => {
    requestMediaPermissions().catch((err: MediaPermissionsError) => {
      setPermissionsEnabled(false);
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingSentence((currentSentence) => {
        const nextIndex =
          (loadingSentences.indexOf(currentSentence) + 1) %
          loadingSentences.length;
        return loadingSentences[nextIndex];
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <LobbyLayout
      edges={edges}
      header={<Header logo={logo} callId={callId} isCallActive={false} />}
    >
      {isjoiningCall ? (
        <div className={styles.loadingPanel}>
          <img
            className={styles.image}
            src={`${import.meta.env.BASE_URL}images/loading-animation.gif`}
          />

          <p className={styles.loadingSentence}>{loadingSentence}</p>
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
          permissionsEnabled={permissionsEnabled}
        />
      )}
    </LobbyLayout>
  );
};
