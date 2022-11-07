import { StreamSfuClient, CallMeta } from '@stream-io/video-client';
import {
  CallState,
  Participant,
} from '@stream-io/video-client/src/gen/video/sfu/models/models';
import { MediaStream } from 'react-native-webrtc';
import { SfuCall, StreamVideoClientRN } from '../../types';
import createStoreContext from './createStoreContext';

interface AppGlobalStore {
  callID: string;
  username: string;
  token: string;
  videoClient: StreamVideoClient | undefined;
  sfuClient: StreamSfuClient | undefined;
  call: SfuCall | undefined;
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
    callID: '',
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
  ['callID', 'username', 'token'],
);
