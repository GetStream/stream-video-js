import { FC, useEffect, useState } from 'react';
import { FeatureCollection, Geometry } from 'geojson';

import LobbyPanel from '../../LobbyPanel';
import Header from '../../Header';
import Panel from '../../Panel';
import { Loading } from '../../Icons';

import LobbyLayout from '../../Layout/LobbyLayout';

import styles from './LobbyView.module.css';

// create 5 different loading sentences to show when joining a call

const loadingSentences = [
  'Joining call ...',
  'Looking for the fastest route ...',
  'Loading call ...',
  'Connecting ...',
  'Starting call ...',
];

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
  // pick the next sentence after 1 second and display it in the panel as the title prop
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
        <Panel className={styles.loadingPanel} title={loadingSentence}>
          <Loading className={styles.loading} />
        </Panel>
      ) : (
        <LobbyPanel
          className={styles.lobbyPanel}
          joinCall={joinCall}
          logo={logo}
          call={call}
          fastestEdge={fastestEdge}
          isJoiningCall={Boolean(callId)}
        />
      )}
    </LobbyLayout>
  );
};
