import {
  StreamVideoClient,
  StreamSfuClient,
  CallMeta,
} from '@stream-io/video-client';
import {
  CallState,
  Participant,
} from '@stream-io/video-client/src/gen/video/sfu/models/models';
import { MediaStream } from 'react-native-webrtc';
import { Call } from '../modules/Call';
import createStoreContext from './createStoreContext';

interface AppGlobalStore {
  meetingCallID: string;
  ringingCallID: string;
  username: string;
  token: string;
  videoClient: StreamVideoClient | undefined;
  sfuClient: StreamSfuClient | undefined;
  call: Call | undefined;
  activeCall: CallMeta.Call | undefined;
  localMediaStream: MediaStream | undefined;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  cameraBackFacingMode: boolean;
  loopbackMyVideo: boolean;
  callState: CallState | undefined;
  participants: Participant[];
}

export const {
  Provider: AppGlobalContextProvider,
  useStoreValue: useAppGlobalStoreValue,
  useStoreSetState: useAppGlobalStoreSetState,
} = createStoreContext<AppGlobalStore>(
  {
    meetingCallID: '',
    ringingCallID: '',
    username: '',
    token: '',
    videoClient: undefined,
    sfuClient: undefined,
    localMediaStream: undefined,
    call: undefined,
    activeCall: undefined,
    loopbackMyVideo: false,
    callState: undefined,
    participants: [],
    isAudioMuted: false,
    isVideoMuted: false,
    cameraBackFacingMode: false,
  },
  ['meetingCallID', 'ringingCallID', 'username', 'token'],
);
