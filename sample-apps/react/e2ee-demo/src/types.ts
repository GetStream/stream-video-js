import type {
  StreamVideoClient,
  Call,
  EncryptionManager,
} from '@stream-io/video-react-sdk';

export interface ParticipantState {
  userId: string;
  name: string;
  color: string;
  client: StreamVideoClient;
  call: Call;
  e2ee: EncryptionManager;
  currentKey: ArrayBuffer;
  keyIndex: number;
  joined: boolean;
  /** True when this participant's worker reports decryption failures. */
  decryptionFailed: boolean;
  /** Dismiss the decryption error toast. Set by App. */
  onDismissError?: () => void;
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
