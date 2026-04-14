import { useCallback, useEffect, useRef, useState } from 'react';
import {
  EncryptionManager,
  StreamVideoClient,
} from '@stream-io/video-react-sdk';

import {
  API_KEY,
  TOKEN_ENDPOINT,
  CALL_TYPE,
  PARTICIPANT_NAMES,
  PARTICIPANT_COLORS,
  MAX_PARTICIPANTS,
} from './config';
import { generateKey, parseKeyInput, toHex } from './crypto';
import type { ParticipantState, EventLogEntry } from './types';
import { Header } from './components/Header';
import { ParticipantGrid } from './components/ParticipantGrid';
import { EventLog } from './components/EventLog';

import '@stream-io/video-react-sdk/dist/css/styles.css';
import './App.css';

const createTokenProvider = (userId: string) => async () => {
  const url = new URL(TOKEN_ENDPOINT);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('user_id', userId);
  const { token } = await fetch(url).then((r) => r.json());
  return token as string;
};

export default function App() {
  const [participants, setParticipants] = useState<ParticipantState[]>([]);
  const [events, setEvents] = useState<EventLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const callIdRef = useRef(`e2ee-demo-${crypto.randomUUID().slice(0, 8)}`);
  const eventIdRef = useRef(0);
  const participantsRef = useRef<ParticipantState[]>([]);

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      participantsRef.current.forEach((p) => {
        p.call.leave().catch(() => {});
        p.e2ee.dispose();
        p.client.disconnectUser().catch(() => {});
      });
    };
  }, []);

  const logEvent = useCallback(
    (message: string, type: EventLogEntry['type']) => {
      setEvents((prev) => [
        ...prev,
        { id: ++eventIdRef.current, timestamp: new Date(), message, type },
      ]);
    },
    [],
  );

  /**
   * Distribute a participant's key to all other participants.
   * Each recipient gets a .slice(0) copy since postMessage transfers ownership.
   */
  const distributeKey = useCallback(
    (
      fromName: string,
      fromUserId: string,
      keyIndex: number,
      key: ArrayBuffer,
      allParticipants: ParticipantState[],
    ) => {
      for (const other of allParticipants) {
        if (other.userId === fromUserId) continue;
        other.e2ee.setKey(fromUserId, keyIndex, key.slice(0));
        logEvent(
          `Distributed ${fromName}'s key to ${other.name}`,
          'key-distribute',
        );
      }
    },
    [logEvent],
  );

  const addParticipant = useCallback(async () => {
    const index = participantsRef.current.length;
    if (index >= MAX_PARTICIPANTS) return;

    setLoading(true);
    try {
      const name = PARTICIPANT_NAMES[index];
      const color = PARTICIPANT_COLORS[index];
      const userId = `e2ee-${name.toLowerCase()}-${Date.now()}`;

      // Create client
      const client = new StreamVideoClient({
        apiKey: API_KEY,
        user: { id: userId, name },
        tokenProvider: createTokenProvider(userId),
      });

      // Create call
      const call = client.call(CALL_TYPE, callIdRef.current);

      // Create E2EE manager and set on call BEFORE join
      const e2ee = await EncryptionManager.create(userId);
      call.setE2EEManager(e2ee);

      // Listen for decryption failures (key mismatch, rotation in progress)
      e2ee.onDecryptionFailed = (remoteUserId) => {
        const remoteName =
          participantsRef.current.find((p) => p.userId === remoteUserId)
            ?.name ?? remoteUserId;
        logEvent(
          `${name} failed to decrypt frames from ${remoteName} — key mismatch`,
          'error',
        );
        // Flag this participant as having decryption issues
        setParticipants((prev) =>
          prev.map((p) =>
            p.userId === userId ? { ...p, decryptionFailed: true } : p,
          ),
        );
      };

      // Generate initial per-user key
      const initialKey = generateKey();
      e2ee.setKey(userId, 0, initialKey.slice(0));
      logEvent(
        `${name} set key: ${toHex(initialKey).slice(0, 16)}...`,
        'key-set',
      );

      // Join the call
      await call.join({ create: true });
      logEvent(`${name} joined the call`, 'join');

      const newParticipant: ParticipantState = {
        userId,
        name,
        color,
        client,
        call,
        e2ee,
        currentKey: initialKey,
        keyIndex: 0,
        joined: true,
        decryptionFailed: false,
        onDismissError: () => {
          setParticipants((prev) =>
            prev.map((p) =>
              p.userId === userId ? { ...p, decryptionFailed: false } : p,
            ),
          );
        },
      };

      // Cross-distribute keys between new and existing participants
      setParticipants((prev) => {
        // Give existing participants this new participant's key
        distributeKey(name, userId, 0, initialKey, prev);

        // Give this new participant all existing participants' keys
        for (const existing of prev) {
          e2ee.setKey(
            existing.userId,
            existing.keyIndex,
            existing.currentKey.slice(0),
          );
          logEvent(
            `Distributed ${existing.name}'s key to ${name}`,
            'key-distribute',
          );
        }

        return [...prev, newParticipant];
      });
    } catch (err) {
      logEvent(`Failed to add participant: ${err}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [logEvent, distributeKey]);

  const rotateKey = useCallback(
    (targetUserId: string, localOnly: boolean) => {
      setParticipants((prev) => {
        const target = prev.find((p) => p.userId === targetUserId);
        if (!target) return prev;

        const newKey = generateKey();
        const newKeyIndex = target.keyIndex + 1;

        // Set on own manager
        target.e2ee.setKey(target.userId, newKeyIndex, newKey.slice(0));
        logEvent(
          `${target.name} rotated key (#${newKeyIndex}): ${toHex(newKey).slice(0, 16)}...${localOnly ? ' [LOCAL ONLY]' : ''}`,
          'key-rotate',
        );

        // Distribute to others (unless local only — simulates key mismatch)
        if (!localOnly) {
          distributeKey(target.name, target.userId, newKeyIndex, newKey, prev);
        }

        return prev.map((p) =>
          p.userId === targetUserId
            ? { ...p, currentKey: newKey, keyIndex: newKeyIndex }
            : p,
        );
      });
    },
    [logEvent, distributeKey],
  );

  const setKeyFromInput = useCallback(
    (targetUserId: string, input: string, localOnly: boolean) => {
      const target = participantsRef.current.find(
        (p) => p.userId === targetUserId,
      );
      if (!target) return;

      parseKeyInput(input).then((newKey) => {
        setParticipants((prev) => {
          const t = prev.find((p) => p.userId === targetUserId);
          if (!t) return prev;

          const newKeyIndex = t.keyIndex + 1;

          t.e2ee.setKey(t.userId, newKeyIndex, newKey.slice(0));
          logEvent(
            `${t.name} set key (#${newKeyIndex}): ${toHex(newKey).slice(0, 16)}...${localOnly ? ' [LOCAL ONLY]' : ''}`,
            'key-set',
          );

          if (!localOnly) {
            distributeKey(t.name, t.userId, newKeyIndex, newKey, prev);
          }

          return prev.map((p) =>
            p.userId === targetUserId
              ? { ...p, currentKey: newKey, keyIndex: newKeyIndex }
              : p,
          );
        });
      });
    },
    [logEvent, distributeKey],
  );

  const removeParticipant = useCallback(
    (targetUserId: string) => {
      setParticipants((prev) => {
        const target = prev.find((p) => p.userId === targetUserId);
        if (!target) return prev;

        // Cleanup
        target.call.leave().catch(() => {});
        target.e2ee.dispose();
        target.client.disconnectUser().catch(() => {});
        logEvent(`${target.name} left the call`, 'leave');

        const remaining = prev.filter((p) => p.userId !== targetUserId);

        // Remove departed user's keys from all remaining participants
        for (const other of remaining) {
          other.e2ee.removeKeys(targetUserId);
          logEvent(
            `Removed ${target.name}'s keys from ${other.name}`,
            'key-distribute',
          );
        }

        return remaining;
      });
    },
    [logEvent],
  );

  return (
    <div className="app">
      <Header
        callId={callIdRef.current}
        participantCount={participants.length}
        onAddParticipant={addParticipant}
        loading={loading}
      />
      <ParticipantGrid
        participants={participants}
        onRemove={removeParticipant}
        onRotateKey={rotateKey}
        onSetKey={setKeyFromInput}
      />
      <EventLog entries={events} />
    </div>
  );
}
