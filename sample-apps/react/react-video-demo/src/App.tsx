import { useCallback, useEffect, useState } from 'react';
import { v1 as uuidv1 } from 'uuid';

import {
  adjectives,
  Config,
  uniqueNamesGenerator,
} from 'unique-names-generator';

import {
  Call,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useHasBrowserPermissions,
  usePersistedDevicePreferences,
} from '@stream-io/video-react-sdk';

import LobbyView from './components/Views/LobbyView';
import MeetingView from './components/Views/MeetingView';
import EndCallView from './components/Views/EndCallView';

import { TourProvider, useTourContext } from './contexts/TourContext';
import { ModalProvider } from './contexts/ModalContext';
import { NotificationProvider } from './contexts/NotificationsContext';
import { PanelProvider } from './contexts/PanelContext';
import { getURLCredentials } from './utils/getURLCredentials';

import { UserContextProvider, useUserContext } from './contexts/UserContext';
import { useCreateStreamChatClient } from './hooks/useChatClient';
import { useEdges } from './hooks/useEdges';

import { tour } from '../data/tour';

import './App.css';

const config: Config = {
  dictionaries: [adjectives],
  separator: '-',
  style: 'lowerCase',
};

const Init = () => {
  const { id: incomingCallId, type, log_level } = getURLCredentials();
  const { apiKey, token, tokenProvider, user } = useUserContext();
  const [isCallActive, setIsCallActive] = useState(false);
  const [callHasEnded, setCallHasEnded] = useState(false);

  const [hasBrowserMediaPermissions, setHasBrowserMediaPermissions] =
    useState<boolean>(false);

  const [isjoiningCall, setIsJoiningCall] = useState(false);
  const { setSteps } = useTourContext();

  const [client, setClient] = useState<StreamVideoClient>();

  const { edges, fastestEdge } = useEdges(client);

  const hasBrowserPermissionVideoInput = useHasBrowserPermissions(
    'camera' as PermissionName,
  );
  const hasBrowserPermissionMicrophoneInput = useHasBrowserPermissions(
    'microphone' as PermissionName,
  );

  // FIXME OL: restore browser permissions UI
  useEffect(() => {
    if (hasBrowserPermissionVideoInput && hasBrowserPermissionMicrophoneInput) {
      setHasBrowserMediaPermissions(true);
    }
  }, [hasBrowserPermissionVideoInput, hasBrowserPermissionMicrophoneInput]);

  useEffect(() => {
    const _client = new StreamVideoClient({
      apiKey,
      user,
      token,
      tokenProvider,
      options: {
        logLevel:
          log_level || import.meta.env.MODE === 'production' ? 'warn' : 'debug',
      },
    });
    setClient(_client);

    // @ts-ignore - for debugging
    window.client = _client;

    return () => {
      _client.disconnectUser();
      setClient(undefined);
      // @ts-ignore - for debugging
      window.client = undefined;
    };
  }, [apiKey, log_level, token, tokenProvider, user]);

  const { chatClient, connectionError: chatConnectionError } =
    useCreateStreamChatClient({
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
    if (!client) return;
    const call = client.call(callType, callId);
    setActiveCall(call);

    // @ts-ignore - for debugging
    window.call = call;

    return () => {
      call.leave();
      setActiveCall(undefined);
      // @ts-ignore - for debugging
      window.call = undefined;
    };
  }, [callId, callType, client]);

  useEffect(() => {
    const appleItunesAppMeta = document
      .getElementsByTagName('meta')
      .namedItem('apple-itunes-app');
    if (appleItunesAppMeta) {
      appleItunesAppMeta.setAttribute(
        'content',
        `app-id=1644313060, app-argument=${window.location.href
          .replace('http://', 'streamvideo://')
          .replace('https://', 'streamvideo://')}`,
      );
    }
  }, []);

  useEffect(() => {
    setSteps(tour);
  }, []);

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

  return (
    <StreamVideo client={client}>
      <StreamCall call={activeCall}>
        <ModalProvider>
          {isCallActive && callId && client ? (
            <NotificationProvider>
              <PanelProvider>
                <TourProvider>
                  {activeCall && (
                    <MeetingView
                      call={activeCall}
                      isCallActive={isCallActive}
                      setCallHasEnded={setCallHasEnded}
                      chatClient={chatClient}
                      chatConnectionError={chatConnectionError}
                    />
                  )}
                </TourProvider>
              </PanelProvider>
            </NotificationProvider>
          ) : (
            <LobbyView
              user={user}
              callId={callId || ''}
              edges={edges}
              fastestEdge={fastestEdge}
              isjoiningCall={isjoiningCall}
              joinCall={joinMeeting}
            />
          )}
        </ModalProvider>
        <DevicePreferences />
      </StreamCall>
    </StreamVideo>
  );
};

const App = () => {
  return (
    <UserContextProvider>
      <Init />
    </UserContextProvider>
  );
};

export default App;

const DevicePreferences = () => {
  usePersistedDevicePreferences('@react-video-demo/device-preferences');
  return null;
};
