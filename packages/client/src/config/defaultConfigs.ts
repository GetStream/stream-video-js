import { CallConfig, CallMode } from './types';

export const CALL_CONFIG: Record<CallMode, CallConfig> = {
  ring: {
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
