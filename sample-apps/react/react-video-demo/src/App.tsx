import { FC, useCallback, useEffect, useState } from 'react';
import { v1 as uuidv1 } from 'uuid';

import {
  adjectives,
  Config,
  uniqueNamesGenerator,
} from 'unique-names-generator';

import {
  GetEdgesResponse,
  MediaDevicesProvider,
  StreamCallProvider,
  StreamVideo,
  useCreateStreamVideoClient,
  User,
} from '@stream-io/video-react-sdk';
import { FeatureCollection, Geometry } from 'geojson';

import LobbyView from './components/Views/LobbyView';
import MeetingView from './components/Views/MeetingView';
import EndCallView from './components/Views/EndCallView';

import { TourProvider, useTourContext } from './contexts/TourContext';
import { ModalProvider } from './contexts/ModalContext';
import { NotificationProvider } from './contexts/NotificationsContext';
import { PanelProvider } from './contexts/PanelContext';

import { createGeoJsonFeatures } from './utils/useCreateGeoJsonFeatures';
import { generateUser } from './utils/useGenerateUser';
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

const config: Config = {
  dictionaries: [adjectives],
  separator: '-',
  style: 'lowerCase',
};

const Init: FC<Props> = ({ incomingCallId, logo, user, token, apiKey }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [callHasEnded, setCallHasEnded] = useState(false);
  const [edges, setEdges] = useState<FeatureCollection<Geometry>>();
  const [fastestEdge, setFastestEdge] = useState<{
    id: string;
    latency: number;
  }>();
  const [isjoiningCall, setIsJoiningCall] = useState(false);

  const { setSteps } = useTourContext();

  const client = useCreateStreamVideoClient({
    apiKey,
    tokenOrProvider: token,
    user,
  });

  const chatClient = useCreateStreamChatClient({
    apiKey,
    tokenOrProvider: token,
    userData: {
      id: user.id,
      name: user.name,
      image: user.image,
    },
  });

  const callType: string = 'default';
  const [callId] = useState(() => {
    if (incomingCallId) return incomingCallId;
    const id = `${uniqueNamesGenerator(config)}-${uuidv1().split('-')[0]}`;
    window.location.search = `?id=${id}`;
    return id;
  });
  const [activeCall] = useState(() => client.call(callType, callId));

  useEffect(() => {
    setSteps(tour);
  }, []);

  useEffect(() => {
    let markerTimer: ReturnType<typeof setTimeout>;

    async function fetchEdges() {
      const response: GetEdgesResponse = await client.edges();

      if (!edges) {
        const features = createGeoJsonFeatures(response.edges);
        setEdges(features);
      }
    }

    fetchEdges();

    return () => {
      clearTimeout(markerTimer);
    };
  }, [edges, isCallActive]);

  const joinMeeting = useCallback(async () => {
    setIsJoiningCall(true);
    try {
      await activeCall.join({ create: true });

      setIsCallActive(true);
      setIsJoiningCall(false);
    } catch (e) {
      console.error(e);
    }
  }, [activeCall]);

  if (callHasEnded) {
    return <EndCallView />;
  }

  return (
    <StreamVideo client={client}>
      <StreamCallProvider call={activeCall}>
        <MediaDevicesProvider initialVideoEnabled={true}>
          <ModalProvider>
            {isCallActive && callId && client ? (
              <NotificationProvider>
                <PanelProvider>
                  <TourProvider>
                    <MeetingView
                      logo={logo}
                      call={activeCall}
                      callId={callId}
                      callType={callType}
                      isCallActive={isCallActive}
                      setCallHasEnded={setCallHasEnded}
                      chatClient={chatClient}
                    />
                  </TourProvider>
                </PanelProvider>
              </NotificationProvider>
            ) : (
              <LobbyView
                logo={logo}
                user={user}
                callId={callId || ''}
                edges={edges}
                fastestEdge={fastestEdge}
                isjoiningCall={isjoiningCall}
                joinCall={joinMeeting}
              />
            )}
          </ModalProvider>
        </MediaDevicesProvider>
      </StreamCallProvider>
    </StreamVideo>
  );
};

const App: FC = () => {
  const logo = `${import.meta.env.BASE_URL}images/icons/stream-logo.svg`;
  const [user, setUser] = useState<User>();
  const [token, setToken] = useState<string>();

  const location = window?.document?.location;
  const callId = new URL(location.href).searchParams.get('id');

  useEffect(() => {
    async function fetchUser() {
      const response = await generateUser(
        callId ? 'user' : 'admin',
        '@stream-io/video-demo',
      );
      setUser(response.user);
      setToken(response.token);
    }
    fetchUser();
  }, []);

  if (user && token) {
    return (
      <Init
        apiKey={import.meta.env.VITE_STREAM_KEY}
        user={user}
        token={token}
        logo={logo}
        incomingCallId={callId}
      />
    );
  }

  return null;
};

export default App;
