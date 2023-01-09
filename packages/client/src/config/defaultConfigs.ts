import { CallConfig, CallType } from './types';

export const CALL_CONFIG: Record<CallType, CallConfig> = {
  ring: {
    leaveCallOnLeftAlone: true,
    joinCallInstantly: true,
    playSounds: true,
    ringingTimeoutMs: 30 * 1000,
    videoEnabled: false,
  },
  meeting: {
    leaveCallOnLeftAlone: false,
    joinCallInstantly: false,
    playSounds: false,
    videoEnabled: false,
  },
};
