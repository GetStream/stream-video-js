import { useCallback, useEffect, useState } from 'react';
import { v1 as uuidv1 } from 'uuid';

import {
  adjectives,
  Config,
  uniqueNamesGenerator,
} from 'unique-names-generator';

import {
  Call,
  CallingState,
  GetEdgesResponse,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
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
import {
  DeviceSettingsCaptor,
  getStoredDeviceSettings,
  LocalDeviceSettings,
} from './utils/useDeviceStorage';

import { UserContextProvider, useUserContext } from './contexts/UserContext';
import { useCreateStreamChatClient } from './hooks/useChatClient';
import { getURLCredentials } from './utils/getURLCredentials';

import { tour } from '../data/tour';

import './App.css';

// This could be exported. No need to prop-drill a constant.
const logo = `${import.meta.env.BASE_URL}images/icons/stream-logo.svg`;

const config: Config = {
  dictionaries: [adjectives],
  separator: '-',
  style: 'lowerCase',
};

const Init = () => {
  const { id: incomingCallId, type } = getURLCredentials();
  const { apiKey, token, tokenProvider, user } = useUserContext();
  const [isCallActive, setIsCallActive] = useState(false);
  const [callHasEnded, setCallHasEnded] = useState(false);
  const [storedDeviceSettings, setStoredDeviceSettings] =
    useState<LocalDeviceSettings>();
  const [edges, setEdges] = useState<FeatureCollection<Geometry>>();
  const [fastestEdge] = useState<{
    id: string;
    latency: number;
  }>();
  const [isjoiningCall, setIsJoiningCall] = useState(false);
  const { setSteps } = useTourContext();

  const [client, setClient] = useState<StreamVideoClient>();

  useEffect(() => {
    const _client = new StreamVideoClient({
      apiKey,
      user,
      token,
      tokenProvider,
    });
    setClient(_client);

    return () => {
      _client?.disconnectUser();
    };
  }, []);

  const chatClient = useCreateStreamChatClient({
    apiKey,
    tokenOrProvider: token ?? tokenProvider,
    userData: {
      id: user.id || '!anon',
      name: user.name,
      image: user.image,
    },
  });

  const callType: string = type ?? 'default';
  const [callId] = useState(() => {
    if (incomingCallId) return incomingCallId;
    const id = `${uniqueNamesGenerator(config)}-${uuidv1().split('-')[0]}`;
    window.location.search = `?id=${id}`;
    return id;
  });
  const [activeCall, setActiveCall] = useState<Call>();

  useEffect(() => {
    const call = client?.call(callType, callId);
    setActiveCall(call);

    return () => {
      if (call?.state?.callingState !== CallingState.LEFT) {
        call?.leave();
      }
      setActiveCall(undefined);
    };
  }, [client]);

  useEffect(() => {
    setSteps(tour);
  }, []);

  useEffect(() => {
    const getSettings = async () => {
      const settings = await getStoredDeviceSettings();
      setStoredDeviceSettings(settings);
    };

    getSettings();
  }, []);

  useEffect(() => {
    async function fetchEdges() {
      if (!client) return;
      const response: GetEdgesResponse = await client.edges();
      const features = createGeoJsonFeatures(response.edges);
      setEdges(features);
    }

    fetchEdges();
  }, [client]);

  const joinMeeting = useCallback(async () => {
    setIsJoiningCall(true);
    try {
      await activeCall?.join({ create: true });

      setIsCallActive(true);
      setIsJoiningCall(false);
    } catch (e) {
      console.error(e);
    }
  }, [activeCall]);

  if (callHasEnded) {
    return <EndCallView callId={callId} />;
  }

  if (!client || !activeCall) {
    return null;
  }

  if (storedDeviceSettings) {
    return (
      <StreamVideo client={client}>
        <StreamCall
          call={activeCall}
          mediaDevicesProviderProps={{
            initialVideoEnabled: !storedDeviceSettings?.isVideoMute,
            initialAudioEnabled: !storedDeviceSettings?.isAudioMute,
            initialAudioInputDeviceId:
              storedDeviceSettings?.selectedAudioInputDeviceId,
            initialVideoInputDeviceId:
              storedDeviceSettings?.selectedVideoDeviceId,
            initialAudioOutputDeviceId:
              storedDeviceSettings?.selectedAudioOutputDeviceId,
          }}
        >
          <ModalProvider>
            {isCallActive && callId && client ? (
              <NotificationProvider>
                <PanelProvider>
                  <TourProvider>
                    {activeCall && (
                      <MeetingView
                        logo={logo}
                        call={activeCall}
                        callId={callId}
                        callType={callType}
                        isCallActive={isCallActive}
                        setCallHasEnded={setCallHasEnded}
                        chatClient={chatClient}
                      />
                    )}
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
          <DeviceSettingsCaptor />
        </StreamCall>
      </StreamVideo>
    );
  }

  return null;
};

const App = () => {
  return (
    <UserContextProvider>
      <Init />
    </UserContextProvider>
  );
};

export default App;
