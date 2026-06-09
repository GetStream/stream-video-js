import type {
  StreamVideoClient,
  Call,
  KeyStateReport,
} from '@stream-io/video-react-sdk';

export type PreferredCodec = 'vp8' | 'vp9' | 'h264' | 'av1';
export type TransformPath = 'script' | 'insertable';
export type KeyMode = 'per-user' | 'shared';
export type ParticipantRole = 'normal' | 'spy';

export interface LogEntry {
  id: number;
  userId: string | null; // null = global (e.g. spawn failure)
  timestamp: Date;
  message: string;
  type:
    | 'key-set'
    | 'key-rotate'
    | 'key-distribute'
    | 'join'
    | 'leave'
    | 'error'
    | 'perf';
}

export interface HarnessParticipant {
  userId: string;
  name: string;
  color: string;
  role: ParticipantRole;
  enabled: boolean;
  transform: TransformPath;
  codec: PreferredCodec;
  currentKey?: ArrayBuffer;
  keyIndex: number;
  keyStore: KeyStateReport | null;
  tracks: {
    encrypting: boolean;
    decryptingFrom: string[];
    failingFrom: string[];
  };
  perf: { encodeFps?: number; decodeFps: { userId: string; fps: number }[] };
  // Live SDK handles, for rendering only. Never serialized.
  client: StreamVideoClient;
  call: Call;
}

export interface HarnessConfig {
  callId: string;
  codec: PreferredCodec;
  transform: TransformPath;
  keyMode: KeyMode;
  e2eeEnabled: boolean;
}

export interface Snapshot {
  config: HarnessConfig;
  participants: HarnessParticipant[];
  log: LogEntry[];
  globalError: string | null;
}
