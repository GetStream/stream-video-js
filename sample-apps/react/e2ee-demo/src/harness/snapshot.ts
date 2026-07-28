import type {
  StreamVideoClient,
  Call,
  EncryptionSettingsResponseModeEnum,
  KeyStateReport,
  PerfReport,
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
  /**
   * Set once `e2ee.rotation_needed` fires for this sender: its frame counter is
   * approaching the 32-bit ceiling and encryption fails closed at the hard
   * limit. Cleared as soon as fresh key material is installed.
   */
  rotationNeeded: boolean;
  /** Last `e2ee.encryption_failed` reason, if the local encoder ever threw. */
  encryptionFailure: string | null;
  tracks: {
    encrypting: boolean;
    decryptingFrom: string[];
    /** Remotes reporting `e2ee.decryption_failed`, possibly transient. */
    failingFrom: string[];
    /**
     * Remotes whose session the SDK declared broken via `e2ee.broken` -
     * decryption failed past the internal tolerance, so this is terminal
     * until new key material arrives.
     */
    brokenFrom: string[];
  };
  perf: PerfReport;
  // Live SDK handles, for rendering only. Never serialized.
  client: StreamVideoClient;
  call: Call;
}

export interface HarnessConfig {
  callId: string;
  /** Call type every participant joins, from `?call_type=`. Fixed per session. */
  callType: string;
  codec: PreferredCodec;
  transform: TransformPath;
  keyMode: KeyMode;
}

/**
 * A participant seen in the call via the SFU roster (local or remote, including
 * peers from other tabs/browsers). Used by the manual key-override UI.
 */
export interface RosterEntry {
  userId: string;
  name: string;
  isLocal: boolean;
}

export interface Snapshot {
  config: HarnessConfig;
  participants: HarnessParticipant[];
  roster: RosterEntry[];
  log: LogEntry[];
  globalError: string | null;
  /**
   * Encryption mode the backend resolved for this call, read back from the call
   * settings. `undefined` until the first participant joins. The harness never
   * requests a mode - this is purely whatever the call type is configured with
   * server-side.
   */
  resolvedEncryptionMode: EncryptionSettingsResponseModeEnum | undefined;
  /**
   * Whether the SFU reports E2EE as actually active for this call, from the join
   * response. Unlike {@link Snapshot.resolvedEncryptionMode} - which is only what
   * the call permits - this is the authoritative signal, so a mismatch between
   * the two is exactly the bug this harness exists to catch.
   */
  e2eeEnabled: boolean;
}
