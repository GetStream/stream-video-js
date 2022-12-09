import createStoreContext from './createStoreContext';
import { CallKeepOptions } from '../types';

export interface SDKStreamVideoStore {
  cameraBackFacingMode: boolean;
  isVideoMuted: boolean;
  leaveOnLeftAlone: boolean;
  callKeepOptions: CallKeepOptions | undefined;
}

export const { Provider, useStoreValue, useStoreSetState } =
  createStoreContext<SDKStreamVideoStore>({
    cameraBackFacingMode: false,
    isVideoMuted: false,
    leaveOnLeftAlone: false, // true on ringing, false on meeting
    callKeepOptions: undefined,
  });
