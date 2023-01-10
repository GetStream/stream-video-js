import { CallConfig, CallType } from './types';

export const CALL_CONFIG: Record<CallType, CallConfig> = {
  ring: {
    leaveCallOnLeftAlone: true,
    joinCallInstantly: true,
    playSounds: true,
    ringingTimeout: 30 * 1000,
    videoEnabled: false,
  },
  meeting: {
    leaveCallOnLeftAlone: false,
    joinCallInstantly: true,
    playSounds: false,
    videoEnabled: false,
  },
};
