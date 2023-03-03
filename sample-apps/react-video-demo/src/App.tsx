import { FC, useState, useMemo } from 'react';
import {
  StreamMeeting,
  StreamVideo,
  useCreateStreamVideoClient,
  MediaDevicesProvider,
} from '@stream-io/video-react-sdk';

import { v4 as uuidv4 } from 'uuid';

import { UserType } from './types/chat';

import LobbyView from './components/Views/LobbyView';
import MeetingView from './components/Views/MeetingView';

import './App.css';

export type Props = {
  callId: string;
  logo: string;
  user: UserType;
  token: string;
  apiKey: string;
  coordinatorRpcUrl: string;
  coordinatorWsUrl: string;
};

const config = {
  apiKey: 'us83cfwuhy8n',
  user: {
    id: 'marcelo',
    name: 'Niels',
    role: 'admin',
    teams: ['team-1', 'team-2'],
    imageUrl: 'https://randomuser.me/api/portraits/men/57.jpg',
    customJson: new Uint8Array(),
  },
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoibWFyY2VsbyJ9.Nhth6nZUqQ6mSz05VAnGGJNRQewpQfqK9reYMYq67NM',
  coordinatorWsUrl:
    'wss://wss-video-coordinator.oregon-v1.stream-io-video.com/rpc/stream.video.coordinator.client_v1_rpc.Websocket/Connect',

  coordinatorRpcUrl:
    'https://rpc-video-coordinator.oregon-v1.stream-io-video.com/rpc',
};

const Init: FC<Props> = ({
  callId,
  logo,
  user,
  token,
  coordinatorRpcUrl,
  coordinatorWsUrl,
  apiKey,
}) => {
  const [isCallActive, setIsCallActive] = useState(true);
  const call: {
    callId: string;
    currentUser: any;
    callType: string;
    input: { members: any; createdBy: any };
    autoJoin: boolean;
  } = useMemo(() => {
    return {
      callId: callId,
      callType: 'default',
      input: {
        members: [
          {
            userId: user.id,
            role: user.role,
            customJson: user.customJson,
          },
        ],
        createdBy: user.id,
      },

      currentUser: user,
      autoJoin: true,
    };
  }, [user, callId]);

  const videoStream = useCreateStreamVideoClient({
    coordinatorRpcUrl,
    coordinatorWsUrl,
    apiKey,
    token,
    user,
  });

  return (
    <>
      {isCallActive ? (
        <StreamVideo client={videoStream}>
          <StreamMeeting
            callId={call.callId}
            callType={call.callType}
            input={call.input}
            currentUser={call.currentUser}
          >
            <MeetingView
              logo={logo}
              callId={callId}
              isCallActive={isCallActive}
            />
          </StreamMeeting>
        </StreamVideo>
      ) : (
        <StreamVideo client={videoStream}>
          <MediaDevicesProvider>
            <LobbyView
              logo={logo}
              avatar={user.imageUrl}
              callId={callId}
              isCallActive={isCallActive}
              joinCall={() => {
                setIsCallActive(true);
              }}
            />
          </MediaDevicesProvider>
        </StreamVideo>
      )}
    </>
  );
};

const App: FC<any> = () => {
  const logo = '/images/icons/stream-logo.svg';

  const location = window?.document?.location;

  const callId = '123-abc'; //new URL(location.href).searchParams.get('id') || uuidv4();

  return <Init {...config} logo={logo} callId={callId} />;
};

export default App;
