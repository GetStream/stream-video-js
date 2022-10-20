import {MediaStream} from 'react-native-webrtc';
import {CallState, Participant} from '../gen/video/sfu/models/models';
import {Call as CallMeta} from '../gen/video/coordinator/call_v1/call';
import {Call} from '../modules/Call';
import {StreamSfuClient} from '../modules/StreamSfuClient';
import {StreamVideoClient} from '../modules/StreamVideoClient';
import createStoreContext from './createStoreContext';

interface AppGlobalStore {
  callID: string;
  username: string;
  videoClient: StreamVideoClient | undefined;
  sfuClient: StreamSfuClient | undefined;
  call: Call | undefined;
  activeCall: CallMeta | undefined;
  localMediaStream: MediaStream | undefined;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  cameraBackFacingMode: boolean;
  loopbackMyVideo: boolean;
  callState: CallState | undefined;
  participants: Participant[];
}

export const {Provider: AppGlobalContextProvider, useStore: useAppGlobalStore} =
  createStoreContext<AppGlobalStore>({
    callID: '',
    username: '',
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
  });
