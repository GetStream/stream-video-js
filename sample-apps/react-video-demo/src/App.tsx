import { FC, useState, useMemo } from 'react';
import {
  StreamMeeting,
  StreamVideo,
  useCreateStreamVideoClient,
<<<<<<< HEAD
  MediaDevicesProvider,
=======
>>>>>>> d4aaab4 (feat: app index)
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
<<<<<<< HEAD
  const [isCallActive, setIsCallActive] = useState(true);
=======
  const [isCallActive, setIsCallActive] = useState(false);
>>>>>>> d4aaab4 (feat: app index)
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

const App: FC = () => {
  const logo = '/images/icons/stream-logo.svg';

  const location = window?.document?.location;

<<<<<<< HEAD
  const callId = '123-abc'; //new URL(location.href).searchParams.get('id') || uuidv4();
=======
  const callId = new URL(location.href).searchParams.get('id') || uuidv4();
>>>>>>> d4aaab4 (feat: app index)

  return <Init {...config} logo={logo} callId={callId} />;
};

export default App;
