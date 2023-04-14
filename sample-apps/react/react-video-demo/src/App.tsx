import { FC, useState, useCallback, useEffect } from 'react';

import { v1 as uuidv1 } from 'uuid';
import {
  StreamVideo,
  useCreateStreamVideoClient,
  MediaDevicesProvider,
} from '@stream-io/video-react-sdk';
import { User } from '@stream-io/video-client';
import { FeatureCollection, Geometry } from 'geojson';

import LobbyView from './components/Views/LobbyView';
import MeetingView from './components/Views/MeetingView';
import EndCallView from './components/Views/EndCallView';

import { TourProvider, useTourContext } from './contexts/TourContext';
import { ModalProvider } from './contexts/ModalContext';
import { NotificationProvider } from './contexts/NotificationsContext';

import { createGeoJsonFeatures } from './utils/useCreateGeoJsonFeatures';
import { useCreateStreamChatClient } from './hooks/useChatClient';

import { tour } from '../data/tour';

import './App.css';

export type Props = {
  logo: string;
  user: User;
  token: string;
  apiKey: string;
  incomingCallId?: string | null;
};

const config = {
  apiKey: import.meta.env.VITE_STREAM_KEY,
  user: {
    id: import.meta.env.VITE_VIDEO_USER_ID,
    name: import.meta.env.VITE_VIDEO_USER_NAME,
    role: 'admin',
    teams: ['team-1', 'team-2'],
    image: '',
    customJson: new Uint8Array(),
  },
  token: import.meta.env.VITE_VIDEO_USER_TOKEN,
};

const Init: FC<Props> = ({ incomingCallId, logo, user, token, apiKey }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callHasEnded, setCallHasEnded] = useState(false);
  const [callId, setCallId] = useState<string>();
  const [edges, setEdges] = useState<FeatureCollection<Geometry>>();
  const [fastestEdge, setFastestEdge] = useState<any>();
  const [isjoiningCall, setIsJoiningCall] = useState(false);

  const callType: string = 'default';

  const { setSteps } = useTourContext();

  const client = useCreateStreamVideoClient({
    apiKey,
    tokenOrProvider: token,
    user,
  });

  const chatClient = useCreateStreamChatClient({
    apiKey,
    tokenOrProvider: token,
    userData: user,
  });

  useEffect(() => {
    if (incomingCallId && incomingCallId !== null) {
      setCallId(incomingCallId);
    }
  }, [incomingCallId]);

  useEffect(() => {
    setSteps(tour);
  }, []);

  useEffect(() => {
    async function fetchEdges() {
      const response: any = await client.edges();
      const fastedEdges = response.edges.sort(
        (a: any, b: any) => a.latency - b.latency,
      );
      setFastestEdge(fastedEdges[0]);

      const features = createGeoJsonFeatures(response.edges);
      setEdges(features);
    }
    fetchEdges();
  }, []);

  const joinMeeting = useCallback(async () => {
    const id = callId || uuidv1();
    setIsJoiningCall(true);
    try {
      const call = await client.call(callType, id);
      await call.join({ create: true });

      setCallId(id);
      setIsCallActive(true);
      setIsJoiningCall(false);
    } catch (e) {
      console.error(e);
    }
  }, [callId]);

  if (callHasEnded) {
    return <EndCallView />;
  }

  return (
    <StreamVideo client={client}>
      <ModalProvider>
        {isCallActive && callId && client ? (
          <NotificationProvider>
            <TourProvider>
              <MeetingView
                logo={logo}
                callId={callId}
                callType={callType}
                isCallActive={isCallActive}
                setCallHasEnded={setCallHasEnded}
                chatClient={chatClient}
              />
            </TourProvider>
          </NotificationProvider>
        ) : (
          <MediaDevicesProvider initialVideoEnabled={true}>
            <LobbyView
              logo={logo}
              avatar={user.image}
              callId={callId || ''}
              edges={edges}
              fastestEdge={fastestEdge}
              isjoiningCall={isjoiningCall}
              joinCall={joinMeeting}
            />
          </MediaDevicesProvider>
        )}
      </ModalProvider>
    </StreamVideo>
  );
};

const App: FC = () => {
  const logo = '/images/icons/stream-logo.svg';

  const location = window?.document?.location;
  const callId = new URL(location.href).searchParams.get('id');

  return <Init {...config} logo={logo} incomingCallId={callId} />;
};

export default App;
