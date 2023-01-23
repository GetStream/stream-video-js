import { PropsWithChildren, useEffect, useState } from 'react';
import { BehaviorSubject } from 'rxjs';
import {
  Channel,
  Chat,
  useChannelActionContext,
  useChatContext,
  Window,
  ChannelHeader,
  VirtualizedMessageList,
  MessageInput,
} from 'stream-chat-react';

import {
  StreamVideo,
  useCreateStreamVideoClient,
  StreamMeeting,
  Stage,
  DeviceSettings,
  CallControls,
} from '@stream-io/video-react-sdk';
import {
  useActiveCall,
  useConnectedUser,
} from '@stream-io/video-react-bindings';

import 'stream-chat-react/dist/css/v2/index.css';
import '@stream-io/video-styling/dist/css/styles.css';

import {
  Outlet,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

// import { useChatClient, useObservableValue } from './hooks/index';
import { selectedUserSubject } from './main';
import { useChatClient, useObservableValue } from './hooks';
// import { userFromToken } from './utils';
import users from '../data/users.json';
import { callId as getCallId } from './utils';
// import { UserResponse } from 'stream-chat';

const apiKey = import.meta.env.VITE_STREAM_KEY as string;
const coordinatorRpcUrl = import.meta.env.VITE_VIDEO_COORDINATOR_RPC_ENDPOINT;
const coordinatorWsUrl = import.meta.env.VITE_VIDEO_COORDINATOR_WS_URL;

type User = typeof users[number];

export const MeetingUI = () => {
  const activeCall = useActiveCall();
  const navigate = useNavigate();

  if (!activeCall) return <div>Loading...</div>;

  const { type, id } = activeCall.data.call ?? {};

  return (
    <div className="str-video__call">
      <div className="str-video__call__header">
        <h4 className="str-video__call__header-title">
          {type}:{id}
        </h4>
        <DeviceSettings activeCall={activeCall} />
      </div>
      <Stage call={activeCall} />
      <CallControls call={activeCall} onLeave={() => navigate('/call-lobby')} />
    </div>
  );
};

const Header = () => {
  const user = useObservableValue(selectedUserSubject);
  const navigate = useNavigate();
  return (
    <div className="w-full p-4 bg-zinc-600 text-zinc-50 flex justify-between">
      <span>Stream Zoom clone</span>

      {user && (
        <div className="flex gap-1">
          <span>Signed in as: {user?.name}</span>
          <button
            onClick={() => {
              selectedUserSubject.next(null);
              sessionStorage.removeItem('zc:uid');
              navigate('/user-selection');
            }}
          >
            (leave)
          </button>
        </div>
      )}
    </div>
  );
};

const ChatVideoWrapper = ({
  children,
  user,
}: PropsWithChildren<{ user: User }>) => {
  const { token, ...userData } = user;

  const chatClient = useChatClient({
    apiKey,
    userData,
    tokenOrProvider: token,
  });

  const videoClient = useCreateStreamVideoClient({
    coordinatorRpcUrl,
    coordinatorWsUrl,
    apiKey,
    token,
    user: {
      id: userData.id,
      imageUrl: userData.image,
      name: userData.name,
      role: '',
      teams: [],
      customJson: new Uint8Array(),
    },
  });

  if (!chatClient || !videoClient) return null;

  return (
    <Chat client={chatClient}>
      <StreamVideo client={videoClient}>{children}</StreamVideo>
    </Chat>
  );
};

const ChatSidebar = () => {
  const { callId } = useParams();
  const { client, setActiveChannel } = useChatContext();

  useEffect(() => {
    const c = client.channel('team', callId);

    setActiveChannel(c);
  }, [callId]);

  return (
    <div className="flex w-4/12">
      <Channel>
        <Window>
          <ChannelHeader />
          <VirtualizedMessageList />
          <MessageInput focus />
        </Window>
      </Channel>
    </div>
  );
};

export const UserList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const next = decodeURIComponent(searchParams.get('next') ?? '');
  return (
    <div className="justify-center flex w-full h-full">
      <div className="flex flex-col justify-center">
        <h3 className="text-center text-xl">Choose your user:</h3>
        <ul className="self-center justify-self-center w-96 bg-zinc-600 p-4 rounded-xl text-zinc-50">
          {users.map((u) => (
            <li className="p-1 flex flex-col" key={u.id}>
              <button
                className="flex justify-between items-center"
                onClick={() => {
                  selectedUserSubject.next(u);
                  sessionStorage.setItem('zc:uid', u.id);
                  navigate(next.length ? next : '/call-lobby');
                }}
                // href={`${window.location.origin}?ut=${u.token}&uid=${u.id}`}
              >
                <div className="flex items-center gap-2">
                  {/* <Avatar user={u} image={u.image} name={u.name} /> */}
                  <img
                    src={u.image}
                    alt={u.name}
                    className="h-10 w-10 rounded-full object-contain border- border-2"
                  />
                  <span>{u.name}</span>
                </div>
                <span>{'►'}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const CreateCall = () => {
  // create and redirect to /call/<id>?join=<true|false>
  const navigate = useNavigate();
  const { client } = useChatContext();

  const clickHandler = async () => {
    const callId = getCallId();
    const channel = client.channel(
      'team',
      callId,
      // TODO: hacky workaround for permission problems
      { members: users.map((u) => u.id) },
    );
    await channel.create();
    navigate(`/call-lobby/${callId}`);
  };

  return (
    <div className="w-full h-full flex justify-center items-center">
      <Preview />
      <button
        onClick={clickHandler}
        className="p-4 bg-cyan-600 text-lg text-white rounded-full"
      >
        CREATE CALL
      </button>
    </div>
  );
};

const Preview = () => {
  const [mediaStream, setMediaStream] = useState<MediaStream | undefined>();
  const [audioMuted, setAudioMuted] = useState();

  // useEffect(() => {
  //   navigator.mediaDevices.getUserMedia({ video: true }).then((ms) => {
  //     setMediaStream(ms);
  //   });
  // });

  return <div className="flex w-full"></div>;
};

// cam preview - initial<audio/video> muted...
export const CallLobby = () => {
  const { callId } = useParams();

  // TODO: const { user: User } = useLoaderData();
  const user = selectedUserSubject.getValue();

  return (
    <ChatVideoWrapper user={user!}>
      {!callId && <CreateCall />}
      {callId && <JoinCall callId={callId} />}
    </ChatVideoWrapper>
  );
};

const JoinCall = ({ callId }: { callId: string }) => {
  // const user = useConnectedUser();
  const user = selectedUserSubject.getValue();

  return (
    <div className="flex w-full h-full">
      {/* <Preview /> */}
      <StreamMeeting
        currentUser={user?.id as string}
        callType={'default'}
        callId={callId}
      >
        <MeetingUI />
      </StreamMeeting>

      <ChatSidebar />
    </div>
  );
};

export const Root = () => {
  return (
    <div className="h-full w-full flex flex-col bg-zinc-50">
      <Header />
      <Outlet />
    </div>
  );
};
