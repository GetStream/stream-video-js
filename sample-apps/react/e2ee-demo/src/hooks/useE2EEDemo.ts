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
  type SendKeyFn,
} from '../e2ee/keys';
import type { ParticipantSession, EventLogEntry } from '../types';

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

  const callIdRef = useRef(`e2ee-demo-${crypto.randomUUID().slice(0, 8)}`);
  const eventIdRef = useRef(0);
  const participantsRef = useRef<ParticipantSession[]>([]);

  // Keep ref in sync with state (for use in async callbacks and cleanup)
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      participantsRef.current.forEach((p) => {
        p.call.leave().catch(() => {});
        p.e2eeManager?.dispose();
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
      if (!recipient?.e2eeManager) return;
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

      let e2eeManager: EncryptionManager | undefined;
      let initialKey: ArrayBuffer | undefined;

      if (e2eeEnabled) {
        // Create E2EE manager and set on call BEFORE join
        e2eeManager = await EncryptionManager.create(userId);
        call.setE2EEManager(e2eeManager);

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

        // Generate initial per-user key
        initialKey = initializeKey(e2eeManager, userId);
        logEvent(
          `${name} set key: ${toHex(initialKey).slice(0, 16)}...`,
          'key-set',
        );
      }

      // Join the call
      await call.join({ create: true });
      logEvent(
        `${name} joined the call${e2eeEnabled ? '' : ' (no E2EE)'}`,
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
        keyIndex: 0,
        joined: true,
        decryptionFailed: false,
      };

      if (e2eeEnabled && e2eeManager) {
        // Cross-distribute keys between new and existing participants.
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
      if (!target?.e2eeManager) return;

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
      if (!target?.e2eeManager) return;

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
      const managers = remaining
        .map((p) => p.e2eeManager)
        .filter((m): m is EncryptionManager => !!m);
      if (managers.length) {
        revokeKeys(targetUserId, managers);
        for (const other of remaining) {
          logEvent(
            `Removed ${target.name}'s keys from ${other.name}`,
            'key-distribute',
          );
        }
      }

      // Pure state update
      setParticipants((prev) => prev.filter((p) => p.userId !== targetUserId));
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
    setE2eeEnabled,
    addParticipant,
    removeParticipant,
    rotateKey,
    setKeyFromInput,
    dismissError,
  };
};
