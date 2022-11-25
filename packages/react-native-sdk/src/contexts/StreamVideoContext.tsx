import createStoreContext from './createStoreContext';
import { StreamVideoClient } from '@stream-io/video-client';
import { MediaStream } from 'react-native-webrtc';

interface SDKStreamVideoStore {
  videoClient: StreamVideoClient | undefined;
  cameraBackFacingMode: boolean;
  localMediaStream: MediaStream | undefined;
}

export const {
  Provider: StreamVideoProvider,
  useStoreValue: useStreamVideoStoreValue,
  useStoreSetState: useStreamVideoStoreSetState,
} = createStoreContext<SDKStreamVideoStore>({
  videoClient: undefined,
  cameraBackFacingMode: false,
  localMediaStream: undefined,
});
