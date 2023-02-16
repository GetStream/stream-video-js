import { FC, useState, useMemo } from 'react';
import {
  StreamMeeting,
  StreamVideo,
  useCreateStreamVideoClient,
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
  apiKey: import.meta.env.VITE_VEDEIO_API_KEY,
  user: {
    id: import.meta.env.VITE_VIDEO_USER_ID,
    name: 'Niels',
    role: 'admin',
    teams: ['team-1', 'team-2'],
    imageUrl: 'https://randomuser.me/api/portraits/men/57.jpg',
    customJson: new Uint8Array(),
  },
  token: import.meta.env.VITE_VIDEO_USER_TOKEN,
  coordinatorWsUrl: import.meta.env.VITE_VIDEO_COORDINATOR_WS_URL,
  coordinatorRpcUrl: import.meta.env.VITE_VIDEO_COORDINATOR_RPC_ENDPOINT,
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
  const [isCallActive, setIsCallActive] = useState(false);
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
    <StreamVideo client={videoStream}>
      <StreamMeeting
        callId={call.callId}
        callType={call.callType}
        input={call.input}
        currentUser={call.currentUser}
      >
        {isCallActive ? (
          <MeetingView
            logo={logo}
            callId={callId}
            isCallActive={isCallActive}
          />
        ) : (
          <LobbyView
            logo={logo}
            avatar={user.imageUrl}
            isCallActive={isCallActive}
            callId={callId}
            joinCall={() => {
              setIsCallActive(true);
            }}
          />
        )}
      </StreamMeeting>
    </StreamVideo>
  );
};

const App: FC = () => {
  const logo = '/images/icons/stream-logo.svg';

  const location = window?.document?.location;

  const callId = new URL(location.href).searchParams.get('id') || uuidv4();

  return <Init {...config} logo={logo} callId={callId} />;
};

export default App;
