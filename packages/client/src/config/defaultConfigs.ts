import { CallConfig, CallType } from './types';

export const CALL_CONFIG: Record<CallType, CallConfig> = {
  ring: {
    autoRejectTimeoutInMs: 30 * 1000,
    autoRejectWhenInCall: false,
    joinCallInstantly: false,
    playSounds: true,
  },
  meeting: {
    autoRejectWhenInCall: false,
    joinCallInstantly: true,
    playSounds: false,
  },
};
