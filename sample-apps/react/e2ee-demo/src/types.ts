import type {
  StreamVideoClient,
  Call,
  EncryptionManager,
} from '@stream-io/video-react-sdk';

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
  currentKey: ArrayBuffer;
  keyIndex: number;

  // UI state
  joined: boolean;
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
    | 'error';
}
