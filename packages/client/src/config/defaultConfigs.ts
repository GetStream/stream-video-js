import { CallConfig, CallType } from './types';

export const CALL_CONFIG: Record<CallType, CallConfig> = {
  ring: {
    autoRejectTimeout: 30 * 1000,
    autoRejectWhenInCall: false,
    leaveCallOnLeftAlone: true,
    joinCallInstantly: true,
    playSounds: true,
    videoEnabled: false,
  },
  meeting: {
    leaveCallOnLeftAlone: false,
    joinCallInstantly: true,
    playSounds: false,
    videoEnabled: false,
  },
};
