import { useCallback, useEffect, useRef, useState } from 'react';
import {
  EncryptionManager,
  StreamVideoClient,
} from '@stream-io/video-react-sdk';

import {
  TOKEN_ENDPOINT,
  TOKEN_ENVIRONMENT,
  CALL_TYPE,
  PARTICIPANT_NAMES,
  PARTICIPANT_COLORS,
  MAX_PARTICIPANTS,
} from '../config';
import {
  initializeKey,
  distributeKey,
  rotateKey as rotateE2EEKey,
  setKeyFromInput as setE2EEKeyFromInput,
  revokeKeys,
  toHex,
  parseKeyInput,
  type SendKeyFn,
} from '../e2ee/keys';
import type {
  ParticipantSession,
  EventLogEntry,
  PreferredCodec,
} from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fetchCredentials = async (userId: string) => {
  const url = new URL(TOKEN_ENDPOINT);
  url.searchParams.set('environment', TOKEN_ENVIRONMENT);
  url.searchParams.set('user_id', userId);
  const { apiKey, token } = await fetch(url).then((r) => r.json());
  return { apiKey: apiKey as string, token: token as string };
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export const useE2EEDemo = () => {
  const [participants, setParticipants] = useState<ParticipantSession[]>([]);
  const [events, setEvents] = useState<EventLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [e2eeEnabled, setE2eeEnabled] = useState(true);
  const [preferredCodec, setPreferredCodec] = useState<PreferredCodec>('vp8');
  const [sharedPassphrase, setSharedPassphrase] = useState<string | null>(null);

  const callIdRef = useRef(`e2ee-demo-${crypto.randomUUID().slice(0, 8)}`);
  const eventIdRef = useRef(0);
  const participantsRef = useRef<ParticipantSession[]>([]);
  const preferredCodecRef = useRef(preferredCodec);
  const sharedPassphraseRef = useRef(sharedPassphrase);
  const sharedKeyIndexRef = useRef(0); // next index to use
  const activeSharedKeyIndexRef = useRef(-1); // last-set index (-1 = none)
  const sharedKeyBytesRef = useRef<ArrayBuffer | null>(null); // derived key bytes for display

  // Keep refs in sync with state (for use in async callbacks and cleanup)
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);
  useEffect(() => {
    preferredCodecRef.current = preferredCodec;
  }, [preferredCodec]);
  useEffect(() => {
    sharedPassphraseRef.current = sharedPassphrase;
  }, [sharedPassphrase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      participantsRef.current.forEach((p) => {
        p.call.leave().catch(() => {});
        p.e2eeManager.dispose();
        p.client.disconnectUser().catch(() => {});
      });
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Event logging
  // ---------------------------------------------------------------------------

  const logEvent = useCallback(
    (message: string, type: EventLogEntry['type']) => {
      setEvents((prev) => [
        ...prev,
        { id: ++eventIdRef.current, timestamp: new Date(), message, type },
      ]);
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Key transport (demo implementation)
  // ---------------------------------------------------------------------------

  /**
   * Demo transport: direct in-memory key distribution.
   *
   * All participants share the same browser tab, so we set the key directly
   * on the recipient's EncryptionManager.
   *
   * In production, replace this with your secure channel:
   * - REST: POST to /api/e2ee/keys
   * - WebSocket: send over encrypted signaling
   *
   * See `e2ee/keys.ts` for a production example.
   */
  const sendKey: SendKeyFn = useCallback(
    (toUserId, fromUserId, keyIndex, key) => {
      const recipient = participantsRef.current.find(
        (p) => p.userId === toUserId,
      );
      if (!recipient) return;
      recipient.e2eeManager.setKey(fromUserId, keyIndex, key.slice(0));

      const sender = participantsRef.current.find(
        (p) => p.userId === fromUserId,
      );
      logEvent(
        `Distributed ${sender?.name ?? fromUserId}'s key to ${recipient.name}`,
        'key-distribute',
      );
    },
    [logEvent],
  );

  // ---------------------------------------------------------------------------
  // Participant lifecycle
  // ---------------------------------------------------------------------------

  const addParticipant = useCallback(async () => {
    const index = participantsRef.current.length;
    if (index >= MAX_PARTICIPANTS) return;

    setLoading(true);
    try {
      const name = PARTICIPANT_NAMES[index];
      const color = PARTICIPANT_COLORS[index];
      const userId = `e2ee-${name.toLowerCase()}-${Date.now()}`;

      // Fetch initial credentials (apiKey + token)
      const { apiKey, token: initialToken } = await fetchCredentials(userId);

      // Create client
      const client = new StreamVideoClient({
        apiKey,
        user: { id: userId, name },
        token: initialToken,
        tokenProvider: () => fetchCredentials(userId).then((c) => c.token),
      });

      // Create call
      const call = client.call(CALL_TYPE, callIdRef.current);

      // Always create E2EE manager so transforms are in the pipeline.
      // When E2EE is off, the worker passes frames through unchanged.
      const e2eeManager = await EncryptionManager.create(userId);
      call.setE2EEManager(e2eeManager);
      e2eeManager.setEnabled(e2eeEnabled);

      // Listen for decryption failures (key mismatch, rotation in progress)
      e2eeManager.onDecryptionFailed = (remoteUserId) => {
        const remoteName =
          participantsRef.current.find((p) => p.userId === remoteUserId)
            ?.name ?? remoteUserId;
        logEvent(
          `${name} failed to decrypt frames from ${remoteName} — key mismatch`,
          'error',
        );
        setParticipants((prev) =>
          prev.map((p) =>
            p.userId === userId ? { ...p, decryptionFailed: true } : p,
          ),
        );
      };

      // Auto-clear decryption error when decryption resumes
      e2eeManager.onDecryptionResumed = (remoteUserId) => {
        const remoteName =
          participantsRef.current.find((p) => p.userId === remoteUserId)
            ?.name ?? remoteUserId;
        logEvent(
          `${name} can now decrypt frames from ${remoteName} — key resolved`,
          'join',
        );
        setParticipants((prev) =>
          prev.map((p) =>
            p.userId === userId ? { ...p, decryptionFailed: false } : p,
          ),
        );
      };

      // Listen for perf reports (encode/decode FPS)
      e2eeManager.onPerfReport = (report) => {
        const decodeInfo = report.decode
          .map((d) => {
            const pName =
              participantsRef.current.find((p) => p.userId === d.userId)
                ?.name ?? d.userId;
            return `${pName}: ${d.fps}`;
          })
          .join(', ');
        logEvent(
          `${name} — encode: ${report.encode.fps} fps | decode: [${decodeInfo}]`,
          'perf',
        );
      };
      e2eeManager.setPerfReport(true);

      const useSharedKey = !!sharedPassphraseRef.current;

      // Apply shared key if one is set
      if (useSharedKey) {
        const sharedKey = await parseKeyInput(sharedPassphraseRef.current!);
        e2eeManager.setSharedKey(
          activeSharedKeyIndexRef.current,
          sharedKey.slice(0),
        );
        logEvent(`Distributed shared key to ${name}`, 'key-distribute');
      }

      // Initialize per-user keys only when E2EE is active and no shared key
      let initialKey: ArrayBuffer | undefined;
      let initialKeyIndex = 0;
      if (e2eeEnabled && !useSharedKey) {
        initialKey = initializeKey(e2eeManager, userId);
        logEvent(
          `${name} set key: ${toHex(initialKey).slice(0, 16)}...`,
          'key-set',
        );
      } else if (useSharedKey && sharedKeyBytesRef.current) {
        // Show the shared key in KeyControls (per-user overrides still allowed)
        initialKey = sharedKeyBytesRef.current;
        initialKeyIndex = activeSharedKeyIndexRef.current;
      }

      // Join the call
      call.updatePublishOptions({ preferredCodec: preferredCodecRef.current });
      await call.join({ create: true });
      logEvent(
        `${name} joined the call${e2eeEnabled ? (useSharedKey ? ' (shared key)' : '') : ' (no E2EE)'}`,
        'join',
      );

      const newParticipant: ParticipantSession = {
        userId,
        name,
        color,
        client,
        call,
        e2eeManager,
        currentKey: initialKey,
        keyIndex: initialKeyIndex,
        joined: true,
        e2eeActive: e2eeEnabled,
        decryptionFailed: false,
      };

      if (e2eeEnabled && !useSharedKey) {
        // Cross-distribute per-user keys between new and existing participants.
        const existing = participantsRef.current;

        // 1. Send B's key to all existing participants
        distributeKey(newParticipant, existing, sendKey);

        // 2. Give B each existing participant's key directly
        for (const other of existing) {
          if (other.currentKey) {
            e2eeManager.setKey(
              other.userId,
              other.keyIndex,
              other.currentKey.slice(0),
            );
            logEvent(
              `Distributed ${other.name}'s key to ${name}`,
              'key-distribute',
            );
          }
        }
      }

      // Pure state update — no side effects
      setParticipants((prev) => [...prev, newParticipant]);
    } catch (err) {
      logEvent(`Failed to add participant: ${err}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [e2eeEnabled, logEvent, sendKey]);

  // ---------------------------------------------------------------------------
  // Key operations
  // ---------------------------------------------------------------------------

  const rotateKey = useCallback(
    (targetUserId: string, localOnly: boolean) => {
      const allParticipants = participantsRef.current;
      const target = allParticipants.find((p) => p.userId === targetUserId);
      if (!target) return;

      // Delegate to centralized key module
      const { key, keyIndex } = rotateE2EEKey(
        target.e2eeManager,
        target,
        allParticipants,
        sendKey,
        { localOnly },
      );
      logEvent(
        `${target.name} rotated key (#${keyIndex}): ${toHex(key).slice(0, 16)}...${localOnly ? ' [LOCAL ONLY]' : ''}`,
        'key-rotate',
      );

      // Pure state update
      setParticipants((prev) =>
        prev.map((p) =>
          p.userId === targetUserId ? { ...p, currentKey: key, keyIndex } : p,
        ),
      );
    },
    [logEvent, sendKey],
  );

  const setKeyFromInput = useCallback(
    (targetUserId: string, input: string, localOnly: boolean) => {
      const allParticipants = participantsRef.current;
      const target = allParticipants.find((p) => p.userId === targetUserId);
      if (!target) return;

      setE2EEKeyFromInput(
        target.e2eeManager,
        target,
        input,
        allParticipants,
        sendKey,
        { localOnly },
      ).then(({ key, keyIndex }) => {
        logEvent(
          `${target.name} set key (#${keyIndex}): ${toHex(key).slice(0, 16)}...${localOnly ? ' [LOCAL ONLY]' : ''}`,
          'key-set',
        );

        // Pure state update
        setParticipants((prev) =>
          prev.map((p) =>
            p.userId === targetUserId ? { ...p, currentKey: key, keyIndex } : p,
          ),
        );
      });
    },
    [logEvent, sendKey],
  );

  // ---------------------------------------------------------------------------
  // Participant removal
  // ---------------------------------------------------------------------------

  const removeParticipant = useCallback(
    (targetUserId: string) => {
      const allParticipants = participantsRef.current;
      const target = allParticipants.find((p) => p.userId === targetUserId);
      if (!target) return;

      // SDK cleanup
      target.call.leave().catch(() => {});
      target.call.e2eeManager?.dispose();
      target.client.disconnectUser().catch(() => {});
      logEvent(`${target.name} left the call`, 'leave');

      // Remove departed user's keys from remaining participants
      const remaining = allParticipants.filter(
        (p) => p.userId !== targetUserId,
      );
      const managers = remaining.map((p) => p.e2eeManager);
      revokeKeys(targetUserId, managers);
      for (const other of remaining) {
        logEvent(
          `Removed ${target.name}'s keys from ${other.name}`,
          'key-distribute',
        );
      }

      // Pure state update
      setParticipants((prev) => prev.filter((p) => p.userId !== targetUserId));
    },
    [logEvent],
  );

  // ---------------------------------------------------------------------------
  // E2EE toggle (runtime)
  // ---------------------------------------------------------------------------

  const toggleE2EE = useCallback(
    (enabled: boolean) => {
      setE2eeEnabled(enabled);

      const all = participantsRef.current;
      for (const p of all) {
        p.e2eeManager.setEnabled(enabled);
      }

      if (enabled) {
        if (!sharedPassphraseRef.current) {
          // Per-user key mode: generate and distribute keys
          for (const p of all) {
            if (!p.currentKey) {
              const key = initializeKey(p.e2eeManager, p.userId);
              p.currentKey = key;
              p.keyIndex = 0;
              logEvent(
                `${p.name} set key: ${toHex(key).slice(0, 16)}...`,
                'key-set',
              );
            }
            distributeKey(p, all, sendKey);
          }
        }
        setParticipants((prev) =>
          prev.map((p) => ({
            ...p,
            e2eeActive: true,
            // Restore shared key display if no per-user key
            currentKey: p.currentKey ?? sharedKeyBytesRef.current ?? undefined,
          })),
        );
      } else {
        // Revoke all keys so decoders don't freeze on encrypted frames
        for (const p of all) {
          const others = all.filter((o) => o.userId !== p.userId);
          revokeKeys(
            p.userId,
            others.map((o) => o.e2eeManager),
          );
          p.currentKey = undefined;
        }
        setParticipants((prev) =>
          prev.map((p) => ({
            ...p,
            e2eeActive: false,
            currentKey: undefined,
            decryptionFailed: false,
          })),
        );
        sharedPassphraseRef.current = null;
        setSharedPassphrase(null);
        sharedKeyBytesRef.current = null;
      }
      logEvent(
        `E2EE ${enabled ? 'enabled' : 'disabled'} for all`,
        enabled ? 'join' : 'leave',
      );
    },
    [logEvent, sendKey],
  );

  const toggleParticipantE2EE = useCallback(
    (targetUserId: string, enabled: boolean) => {
      const all = participantsRef.current;
      const target = all.find((p) => p.userId === targetUserId);
      if (!target) return;

      target.e2eeManager.setEnabled(enabled);

      let newKey: ArrayBuffer | undefined = target.currentKey;
      let newKeyIndex = target.keyIndex;

      if (!enabled) {
        // Revoke this participant's keys from all others so their decoders
        // stop attempting decryption (which would freeze on the last frame).
        const others = all.filter((p) => p.userId !== targetUserId);
        revokeKeys(
          targetUserId,
          others.map((p) => p.e2eeManager),
        );
        newKey = undefined;
      } else if (!target.currentKey && !sharedPassphraseRef.current) {
        // Per-user key mode: generate and distribute keys
        const key = initializeKey(target.e2eeManager, target.userId);
        newKey = key;
        newKeyIndex = 0;
        logEvent(
          `${target.name} set key: ${toHex(key).slice(0, 16)}...`,
          'key-set',
        );
        // Need to update the ref before distributeKey reads it
        target.currentKey = key;
        target.keyIndex = 0;
        distributeKey(target, all, sendKey);
        for (const other of all) {
          if (other.userId !== targetUserId && other.currentKey) {
            target.e2eeManager.setKey(
              other.userId,
              other.keyIndex,
              other.currentKey.slice(0),
            );
          }
        }
      }

      setParticipants((prev) =>
        prev.map((p) =>
          p.userId === targetUserId
            ? {
                ...p,
                e2eeActive: enabled,
                currentKey: newKey,
                keyIndex: newKeyIndex,
                decryptionFailed: enabled ? p.decryptionFailed : false,
              }
            : p,
        ),
      );
      logEvent(
        `${target.name}: E2EE ${enabled ? 'enabled' : 'disabled'}`,
        enabled ? 'join' : 'leave',
      );
    },
    [logEvent, sendKey],
  );

  // ---------------------------------------------------------------------------
  // Shared key
  // ---------------------------------------------------------------------------

  const setSharedKey = useCallback(
    async (passphrase: string) => {
      const key = await parseKeyInput(passphrase);
      const keyIndex = sharedKeyIndexRef.current++;
      activeSharedKeyIndexRef.current = keyIndex;
      sharedKeyBytesRef.current = key;

      const all = participantsRef.current;

      // Set shared key on all participants
      for (const p of all) {
        p.e2eeManager.setSharedKey(keyIndex, key.slice(0));
      }

      // Revoke all per-user keys so the shared key is used as baseline
      // (participants can still set custom per-user keys via KeyControls)
      for (const p of all) {
        const others = all.filter((o) => o.userId !== p.userId);
        revokeKeys(
          p.userId,
          others.map((o) => o.e2eeManager),
        );
        p.e2eeManager.removeKeys(p.userId);
        p.currentKey = key;
      }

      sharedPassphraseRef.current = passphrase;
      setSharedPassphrase(passphrase);
      setParticipants((prev) =>
        prev.map((p) => ({ ...p, currentKey: key, keyIndex })),
      );
      logEvent(
        `Shared key set from "${passphrase.length > 12 ? passphrase.slice(0, 12) + '...' : passphrase}" — per-user keys revoked`,
        'key-set',
      );
    },
    [logEvent],
  );

  // ---------------------------------------------------------------------------
  // UI helpers
  // ---------------------------------------------------------------------------

  const dismissError = useCallback((userId: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.userId === userId ? { ...p, decryptionFailed: false } : p,
      ),
    );
  }, []);

  return {
    callId: callIdRef.current,
    participants,
    events,
    loading,
    e2eeEnabled,
    preferredCodec,
    setPreferredCodec,
    sharedPassphrase,
    setSharedKey,
    toggleE2EE,
    toggleParticipantE2EE,
    addParticipant,
    removeParticipant,
    rotateKey,
    setKeyFromInput,
    dismissError,
  };
};
