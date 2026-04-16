import type {
  StreamVideoClient,
  Call,
  EncryptionManager,
} from '@stream-io/video-react-sdk';

export type PreferredCodec = 'vp8' | 'vp9' | 'h264' | 'av1';

export interface ParticipantSession {
  // Identity
  userId: string;
  name: string;
  color: string;

  // SDK handles (set once per session)
  client: StreamVideoClient;
  call: Call;
  e2eeManager: EncryptionManager;

  // E2EE key state (changes on rotation / manual set)
  currentKey?: ArrayBuffer;
  keyIndex: number;

  // UI state
  joined: boolean;
  /** Whether this participant's worker is actively encrypting/decrypting. */
  e2eeActive: boolean;
  /** True when this participant's worker reports decryption failures. */
  decryptionFailed: boolean;
}

export interface EventLogEntry {
  id: number;
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
