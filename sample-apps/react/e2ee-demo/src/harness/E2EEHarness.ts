import {
  EncryptionManager,
  StreamVideoClient,
  type Call,
  type KeyStateReport,
  type PerfReport,
} from '@stream-io/video-react-sdk';
import {
  TOKEN_ENDPOINT,
  CALL_TYPE,
  PARTICIPANT_NAMES,
  PARTICIPANT_COLORS,
  MAX_PARTICIPANTS,
  SPY_NAME,
  SPY_COLOR,
} from '../config';
import { resolveEnvironment } from './url';
import { generateKey, toHex, parseKeyInput } from './keys';
import type { SendKeyFn } from './keyTransport';
import { detectTransformSupport } from './transformSupport';
import type {
  HarnessConfig,
  HarnessParticipant,
  LogEntry,
  PreferredCodec,
  RosterEntry,
  Snapshot,
} from './snapshot';

const MAX_LOG = 200;

// Manual overrides and shared keys use one fixed key index so peers on other
// tabs only need to copy the key value, not coordinate an index. Decryption
// resolves a key by (userId, keyIndex) from the frame trailer, so a per-tab
// counter would drift and break cross-tab decryption; a fixed index always
// lines up. setKey/setSharedKey make the given index the active one, so the
// local encoder uses exactly this key.
const FIXED_KEY_INDEX = 0;

const defaultFetchCredentials = async (userId: string) => {
  const url = new URL(TOKEN_ENDPOINT);
  url.searchParams.set(
    'environment',
    resolveEnvironment(window.location.search),
  );
  url.searchParams.set('user_id', userId);
  const { apiKey, token } = await fetch(url).then((r) => r.json());
  return { apiKey: apiKey as string, token: token as string };
};

export interface HarnessDeps {
  fetchCredentials: (
    userId: string,
  ) => Promise<{ apiKey: string; token: string }>;
  createClient: (args: {
    apiKey: string;
    token: string;
    userId: string;
    name: string;
    fetchCredentials: (
      userId: string,
    ) => Promise<{ apiKey: string; token: string }>;
  }) => StreamVideoClient;
  createManager: (
    userId: string,
    opts: { forceRtpScriptTransform: boolean },
  ) => Promise<EncryptionManager>;
}

export const defaultDeps = (): HarnessDeps => ({
  fetchCredentials: defaultFetchCredentials,
  createClient: ({ apiKey, token, userId, name, fetchCredentials }) =>
    new StreamVideoClient({
      apiKey,
      user: { id: userId, name },
      token,
      // DIAGNOSTIC: surface the SDK's "E2EE encryptor attached to sender" debug
      // line and any worker errors while we confirm frames are encrypted.
      options: { logLevel: 'debug' },
      tokenProvider: () => fetchCredentials(userId).then((c) => c.token),
    }),
  createManager: (userId, opts) => EncryptionManager.create(userId, opts),
});

/** Internal per-participant state held by the engine (not the snapshot shape). */
interface EngineParticipant {
  userId: string;
  name: string;
  color: string;
  role: 'normal' | 'spy';
  codec: PreferredCodec;
  client: StreamVideoClient;
  call: Call;
  manager: EncryptionManager;
  currentKey?: ArrayBuffer;
  keyIndex: number;
  enabled: boolean;
  keyStore: KeyStateReport | null;
  perf: PerfReport | null;
  failingFrom: Set<string>;
  unsubscribes: Array<() => void>;
}

export class E2EEHarness {
  private deps: HarnessDeps;
  private participants: EngineParticipant[] = [];
  private config: HarnessConfig;
  private log: LogEntry[] = [];
  private globalError: string | null = null;
  private listeners = new Set<() => void>();
  private snapshot: Snapshot;
  private logId = 0;
  private activeSharedKeyIndex = -1;
  private sharedKeyBytes: ArrayBuffer | null = null;

  constructor(
    init: { callId: string; codec?: PreferredCodec },
    deps: HarnessDeps = defaultDeps(),
  ) {
    this.deps = deps;
    this.config = {
      callId: init.callId,
      codec: init.codec ?? 'vp8',
      // Preselect the path the SDK would actually attach in this browser.
      transform: detectTransformSupport().recommended ?? 'insertable',
      keyMode: 'per-user',
    };
    this.snapshot = this.build();
  }

  // --- external store ---

  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };

  getSnapshot = (): Snapshot => this.snapshot;

  private emit = (): void => {
    this.snapshot = this.build();
    this.listeners.forEach((cb) => cb());
  };

  private build = (): Snapshot => ({
    config: { ...this.config },
    participants: this.participants.map(this.toSnapshotParticipant),
    roster: this.buildRoster(),
    log: this.log,
    globalError: this.globalError,
  });

  /**
   * The union of every local participant's SFU roster, deduped by userId. All
   * local participants share the same call, so this surfaces everyone in the
   * call - including remote peers joined from other tabs or browsers.
   */
  private buildRoster = (): RosterEntry[] => {
    const localIds = new Set(this.participants.map((p) => p.userId));
    const seen = new Map<string, RosterEntry>();
    for (const p of this.participants) {
      for (const sfu of p.call.state.participants) {
        if (seen.has(sfu.userId)) continue;
        seen.set(sfu.userId, {
          userId: sfu.userId,
          name: sfu.name || sfu.userId.slice(0, 8),
          isLocal: localIds.has(sfu.userId),
        });
      }
    }
    // Stable order so the key-override rows do not jump around as the SFU
    // roster re-sorts (dominant speaker, etc.).
    return [...seen.values()].sort(
      (a, b) =>
        a.name.localeCompare(b.name) || a.userId.localeCompare(b.userId),
    );
  };

  private toSnapshotParticipant = (
    p: EngineParticipant,
  ): HarnessParticipant => {
    const decryptingFrom = p.enabled
      ? this.participants
          .filter(
            (o) =>
              o.userId !== p.userId &&
              !!o.currentKey &&
              !p.failingFrom.has(o.userId),
          )
          .map((o) => o.userId)
      : [];
    const failingFrom = [...p.failingFrom];
    return {
      userId: p.userId,
      name: p.name,
      color: p.color,
      role: p.role,
      enabled: p.enabled,
      transform: this.config.transform,
      codec: p.codec,
      currentKey: p.currentKey,
      keyIndex: p.keyIndex,
      keyStore: p.keyStore,
      tracks: {
        encrypting:
          p.enabled && (!!p.currentKey || this.activeSharedKeyIndex >= 0),
        decryptingFrom,
        failingFrom,
      },
      perf: {
        encode: p.perf?.encode ?? [],
        decode: p.perf?.decode ?? [],
      },
      client: p.client,
      call: p.call,
    };
  };

  // --- config ---

  setConfig = (
    patch: Partial<Pick<HarnessConfig, 'codec' | 'transform' | 'keyMode'>>,
  ): void => {
    Object.assign(this.config, patch);
    this.emit();
  };

  // --- participants ---

  addParticipant = async (): Promise<void> => {
    const normals = this.participants.filter((p) => p.role === 'normal');
    const index = normals.length;
    if (index >= MAX_PARTICIPANTS) return;
    await this.spawn({
      name: PARTICIPANT_NAMES[index],
      color: PARTICIPANT_COLORS[index],
      role: 'normal',
      withKey: this.config.keyMode === 'per-user',
    });
  };

  addSpy = async (): Promise<void> => {
    if (this.participants.some((p) => p.role === 'spy')) return; // one spy is enough
    await this.spawn({
      name: SPY_NAME,
      color: SPY_COLOR,
      role: 'spy',
      withKey: false,
    });
  };

  private spawn = async (opts: {
    name: string;
    color: string;
    role: 'normal' | 'spy';
    withKey: boolean;
  }): Promise<void> => {
    const userId = `e2ee-${opts.name.toLowerCase()}-${crypto.randomUUID().slice(0, 8)}`;
    try {
      this.globalError = null;
      const { apiKey, token } = await this.deps.fetchCredentials(userId);
      const client = this.deps.createClient({
        apiKey,
        token,
        userId,
        name: opts.name,
        fetchCredentials: this.deps.fetchCredentials,
      });
      const call = client.call(CALL_TYPE, this.config.callId);
      const isNormal = opts.role === 'normal';
      const manager = await this.deps.createManager(userId, {
        forceRtpScriptTransform: this.config.transform === 'script',
      });

      const p: EngineParticipant = {
        userId,
        name: opts.name,
        color: opts.color,
        role: opts.role,
        codec: this.config.codec,
        client,
        call,
        manager,
        keyIndex: 0,
        enabled: isNormal,
        keyStore: null,
        perf: null,
        failingFrom: new Set(),
        unsubscribes: [],
      };

      // Every participant, including the spy, attaches an E2EEManager before
      // joining. The backend rejects a join whose e2ee flag (which the SDK sends
      // whenever a manager is attached) does not match the encrypted call, so the
      // spy cannot join as a plain, manager-less participant anymore. She differs
      // only in her keys: she never receives any. With E2EE active her decode
      // transform fails on every peer and renders gibberish - the proof the media
      // is unusable without the keys - while her own encoder drops outgoing frames
      // for lack of a key.
      call.setE2EEManager(manager);
      manager.setEnabled(true);
      this.wireEvents(p);
      manager.setPerfReport(true);
      manager.requestKeyDump();

      if (isNormal) {
        if (opts.withKey) {
          const key = generateKey();
          manager.setKey(userId, 0, key.slice(0));
          p.currentKey = key;
          this.addLog(
            userId,
            `Set key: ${toHex(key).slice(0, 16)}...`,
            'key-set',
          );
        } else if (this.config.keyMode === 'shared' && this.sharedKeyBytes) {
          manager.setSharedKey(
            this.activeSharedKeyIndex,
            this.sharedKeyBytes.slice(0),
          );
          p.currentKey = this.sharedKeyBytes;
          p.keyIndex = this.activeSharedKeyIndex;
          this.addLog(userId, 'Shared key applied', 'key-distribute');
        }
      }

      call.updatePublishOptions({ preferredCodec: this.config.codec });
      // Create the call with encryption enabled so it matches the e2ee join sent
      // above; without it the backend rejects every participant's join.
      await call.join({
        create: true,
        data: { settings_override: { encryption: { enabled: true } } },
      });
      this.addLog(userId, `Joined the call`, 'join');

      // Publish real camera + mic so there is encrypted media flowing - for
      // peers to decrypt and for the spy to fail to decrypt into gibberish.
      try {
        await call.camera.enable();
        await call.microphone.enable();
      } catch (err) {
        this.addLog(
          userId,
          `Could not enable camera/mic: ${String(err)}`,
          'error',
        );
      }

      this.participants.push(p);
      // Re-emit when the SFU roster changes so the manual key-override panel
      // tracks peers joining or leaving from other tabs.
      const rosterSub = p.call.state.participants$.subscribe(() => this.emit());
      p.unsubscribes.push(() => rosterSub.unsubscribe());
      if (isNormal) this.exchangeOnJoin(p);
      this.emit();
    } catch (err) {
      this.globalError = `Failed to add ${opts.name}: ${String(err)}`;
      this.emit();
    }
  };

  // --- key exchange ---

  /** In-tab transport: set the key directly on the recipient's manager. */
  private sendKey: SendKeyFn = (
    toUserId: string,
    fromUserId: string,
    keyIndex: number,
    key: ArrayBuffer,
  ): void => {
    const recipient = this.participants.find((p) => p.userId === toUserId);
    if (!recipient) return;
    recipient.manager.setKey(fromUserId, keyIndex, key.slice(0));
    const sender = this.participants.find((p) => p.userId === fromUserId);
    this.addLog(
      toUserId,
      `Received ${sender?.name ?? fromUserId}'s key`,
      'key-distribute',
    );
  };

  private exchangeOnJoin = (joiner: EngineParticipant): void => {
    if (this.config.keyMode === 'shared') return;
    const existing = this.participants.filter(
      (p) => p.userId !== joiner.userId && p.role === 'normal',
    );
    // 1. Give existing participants the joiner's key.
    if (joiner.currentKey) {
      for (const other of existing) {
        this.sendKey(
          other.userId,
          joiner.userId,
          joiner.keyIndex,
          joiner.currentKey,
        );
      }
    }
    // 2. Give the joiner each existing participant's key.
    for (const other of existing) {
      if (!other.currentKey) continue;
      this.sendKey(
        joiner.userId,
        other.userId,
        other.keyIndex,
        other.currentKey,
      );
    }
  };

  // --- key rotation / set ---

  rotateKey = (targetUserId: string, localOnly: boolean): void => {
    const target = this.participants.find((p) => p.userId === targetUserId);
    if (!target) return;
    const key = generateKey();
    const keyIndex = target.keyIndex + 1;
    target.manager.setKey(targetUserId, keyIndex, key.slice(0));
    target.currentKey = key;
    target.keyIndex = keyIndex;
    if (!localOnly) this.distribute(target);
    this.addLog(
      targetUserId,
      `Rotated key (#${keyIndex}): ${toHex(key).slice(0, 16)}...${
        localOnly ? ' [LOCAL ONLY]' : ''
      }`,
      'key-rotate',
    );
    target.manager.requestKeyDump();
    this.emit();
  };

  setKey = async (
    targetUserId: string,
    input: string,
    localOnly: boolean,
  ): Promise<void> => {
    const target = this.participants.find((p) => p.userId === targetUserId);
    if (!target) return;
    const key = await parseKeyInput(input);
    const keyIndex = target.keyIndex + 1;
    target.manager.setKey(targetUserId, keyIndex, key.slice(0));
    target.currentKey = key;
    target.keyIndex = keyIndex;
    if (!localOnly) this.distribute(target);
    this.addLog(
      targetUserId,
      `Set key (#${keyIndex}): ${toHex(key).slice(0, 16)}...${
        localOnly ? ' [LOCAL ONLY]' : ''
      }`,
      'key-set',
    );
    target.manager.requestKeyDump();
    this.emit();
  };

  private distribute = (from: EngineParticipant): void => {
    if (!from.currentKey) return;
    for (const r of this.participants) {
      if (r.userId === from.userId || r.role === 'spy') continue;
      this.sendKey(r.userId, from.userId, from.keyIndex, from.currentKey);
    }
  };

  // --- manual key override (cross-tab) ---

  /**
   * Manually set the key for any participant in the call by userId, at the
   * fixed {@link FIXED_KEY_INDEX}, on every local manager. If the userId
   * belongs to a local participant this becomes their encode key; otherwise it
   * is the decode key their peers use. Nothing is auto-distributed - paste the
   * same value into another tab or browser to interoperate.
   */
  overrideKey = async (userId: string, input: string): Promise<void> => {
    const key = await parseKeyInput(input);
    for (const p of this.participants) {
      if (p.role === 'spy') continue; // the spy stays keyless
      p.manager.setKey(userId, FIXED_KEY_INDEX, key.slice(0));
      p.manager.requestKeyDump();
    }
    const local = this.participants.find(
      (p) => p.userId === userId && p.role === 'normal',
    );
    if (local) {
      local.currentKey = key;
      local.keyIndex = FIXED_KEY_INDEX;
    }
    this.addLog(
      userId,
      `Manual key override (#${FIXED_KEY_INDEX}): ${toHex(key).slice(0, 16)}...`,
      'key-set',
    );
    this.emit();
  };

  // --- shared key ---

  setSharedKey = async (passphrase: string): Promise<void> => {
    const key = await parseKeyInput(passphrase);
    // Fixed index (not a per-tab counter) so the same passphrase decrypts
    // across tabs regardless of how many times each side sets it.
    const keyIndex = FIXED_KEY_INDEX;
    this.activeSharedKeyIndex = keyIndex;
    this.sharedKeyBytes = key;
    this.config.keyMode = 'shared';

    // The spy never receives the shared key - she stays an outsider.
    const targets = this.participants.filter((p) => p.role === 'normal');
    for (const p of targets) {
      p.manager.setSharedKey(keyIndex, key.slice(0));
    }
    // Revoke per-user keys so the shared key is the baseline.
    for (const p of targets) {
      for (const other of targets) {
        if (other.userId !== p.userId) p.manager.removeKeys(other.userId);
      }
      p.manager.removeKeys(p.userId);
      p.currentKey = key;
      p.keyIndex = keyIndex;
    }
    const label =
      passphrase.length > 12 ? passphrase.slice(0, 12) + '...' : passphrase;
    for (const p of targets) {
      this.addLog(
        p.userId,
        `Shared key set from "${label}", per-user keys revoked`,
        'key-set',
      );
    }
    this.emit();
  };

  // --- remove + dispose ---

  removeParticipant = (targetUserId: string): void => {
    const target = this.participants.find((p) => p.userId === targetUserId);
    if (!target) return;
    this.teardown(target);
    this.participants = this.participants.filter(
      (p) => p.userId !== targetUserId,
    );
    for (const other of this.participants) {
      if (other.role === 'spy') continue;
      other.manager.removeKeys(targetUserId);
      other.failingFrom.delete(targetUserId);
      this.addLog(
        other.userId,
        `Removed ${target.name}'s keys`,
        'key-distribute',
      );
    }
    this.emit();
  };

  dispose = (): void => {
    for (const p of this.participants) this.teardown(p);
    this.participants = [];
    this.activeSharedKeyIndex = -1;
    this.sharedKeyBytes = null;
    this.log = [];
    this.logId = 0;
    this.globalError = null;
    this.emit();
  };

  dismissError = (): void => {
    this.globalError = null;
    this.emit();
  };

  private teardown = (p: EngineParticipant): void => {
    p.unsubscribes.forEach((u) => u());
    p.call.leave().catch(() => {});
    p.manager.dispose();
    p.client.disconnectUser().catch(() => {});
  };

  // --- failure injection ---

  /** Remove `targetUserId`'s key from `fromUserId`'s manager (or from all). */
  revokeKey = (targetUserId: string, fromUserId?: string): void => {
    const holders = (
      fromUserId
        ? this.participants.filter((p) => p.userId === fromUserId)
        : this.participants.filter((p) => p.userId !== targetUserId)
    ).filter((p) => p.role === 'normal');
    for (const h of holders) {
      h.manager.removeKeys(targetUserId);
      this.addLog(h.userId, `Revoked ${targetUserId}'s key`, 'key-distribute');
    }
    this.emit();
  };

  /** Set a fresh local key without distributing it: instant decrypt mismatch. */
  setWrongKey = (targetUserId: string): void => {
    const target = this.participants.find((p) => p.userId === targetUserId);
    if (!target) return;
    const key = generateKey();
    const keyIndex = target.keyIndex + 1;
    target.manager.setKey(targetUserId, keyIndex, key.slice(0));
    target.currentKey = key;
    target.keyIndex = keyIndex;
    this.addLog(
      targetUserId,
      `Set WRONG key (#${keyIndex}) [not distributed]`,
      'key-rotate',
    );
    target.manager.requestKeyDump();
    this.emit();
  };

  /** Fire two rotations back-to-back to exercise replay-window / key-index handling. */
  rotationRace = (targetUserId: string): void => {
    this.addLog(
      targetUserId,
      'Rotation race: firing two rotations',
      'key-rotate',
    );
    this.rotateKey(targetUserId, false);
    this.rotateKey(targetUserId, false);
  };

  // --- event wiring ---

  private wireEvents = (p: EngineParticipant): void => {
    const m = p.manager;
    p.unsubscribes.push(
      m.on('e2ee.decryption_failed', ({ userId: remoteUserId }) => {
        p.failingFrom.add(remoteUserId);
        const name = this.nameFor(remoteUserId);
        this.addLog(
          p.userId,
          `Failed to decrypt from ${name}: key mismatch`,
          'error',
        );
        this.emit();
      }),
      m.on('e2ee.decryption_resumed', ({ userId: remoteUserId }) => {
        p.failingFrom.delete(remoteUserId);
        this.addLog(
          p.userId,
          `Decryption resumed from ${this.nameFor(remoteUserId)}`,
          'join',
        );
        this.emit();
      }),
      m.on('e2ee.missing_key', () => {
        this.addLog(
          p.userId,
          'No encryption key set: outgoing frames dropped',
          'error',
        );
        this.emit();
      }),
      m.on('e2ee.key_state', (report: KeyStateReport) => {
        p.keyStore = report;
        this.emit();
      }),
      m.on('e2ee.perf_report', (report: PerfReport) => {
        p.perf = report;
        this.emit();
      }),
    );
  };

  private nameFor = (userId: string): string =>
    this.participants.find((p) => p.userId === userId)?.name ?? userId;

  // --- logging ---

  private addLog = (
    userId: string | null,
    message: string,
    type: LogEntry['type'],
  ): void => {
    this.log = [
      ...this.log,
      { id: ++this.logId, userId, timestamp: new Date(), message, type },
    ].slice(-MAX_LOG);
  };
}
