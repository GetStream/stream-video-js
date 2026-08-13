import { useEffect, useMemo, useState } from 'react';
import {
  EncryptionManager,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

/**
 * What the local peer can conclude about key agreement from its own decryption
 * failures.
 *
 * - `ok`: nothing is failing (or there is nothing to judge from yet).
 * - `local-key-mismatch`: every publishing peer fails to decrypt. With a shared
 *   key that means *this* peer holds the wrong one - a peer with the right key
 *   would still decrypt the majority.
 * - `peer-key-mismatch`: only some peers fail, so their keys differ from ours.
 */
export type E2EEKeyStatus =
  | { kind: 'ok' }
  | { kind: 'local-key-mismatch' }
  | { kind: 'peer-key-mismatch'; names: string[] };

/**
 * Detect a shared-key mismatch from the worker's decryption signals.
 *
 * There is no direct "your key is wrong" event, and there cannot be: a wrong key
 * still encrypts happily, so the local encoder never complains and nothing tells
 * us that others cannot decrypt *us*. The only evidence is inbound, and it is
 * per remote peer - so the verdict comes from the breadth of the failures rather
 * than from any single event.
 *
 * `e2ee.decryption_stalled` is the trigger, not `e2ee.decryption_failed`: the
 * latter fires once a second for any transient mismatch, including the brief
 * window while a key change propagates, and would cry wolf. Stalled means the
 * track has failed past the SDK's tolerance and is not recovering on its own.
 *
 * Blind spots worth knowing: alone in the call, or with every peer muted and
 * camera-off, a wrong key is undetectable. And if two peers share the same wrong
 * key they decrypt each other, so neither sees a full sweep of failures.
 */
export const useE2eeKeyStatus = (): E2EEKeyStatus => {
  const call = useCall();
  const { useRemoteParticipants } = useCallStateHooks();
  const remoteParticipants = useRemoteParticipants();
  // Keyed per (userId, trackType) because the SDK counts failures per track: a
  // peer publishing audio and video reports them independently, and their video
  // can recover while audio is still stalled.
  const [stalledTracks, setStalledTracks] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  useEffect(() => {
    // Only the built-in manager emits these events; a custom E2EEManager
    // implementation satisfies the RTC contract without them.
    const manager = call?.e2eeManager;
    if (!(manager instanceof EncryptionManager)) return;

    const trackKey = (userId: string, trackType?: string) =>
      `${userId}/${trackType ?? 'unknown'}`;

    const unsubscribes = [
      manager.on('e2ee.decryption_stalled', ({ userId, trackType }) => {
        setStalledTracks((prev) => {
          const next = new Set(prev);
          next.add(trackKey(userId, trackType));
          return next;
        });
      }),
      manager.on('e2ee.decryption_resumed', ({ userId, trackType }) => {
        setStalledTracks((prev) => {
          const key = trackKey(userId, trackType);
          if (!prev.has(key)) return prev;
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }),
    ];

    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [call]);

  return useMemo(() => {
    if (stalledTracks.size === 0) return { kind: 'ok' };
    const stalledUserIds = new Set(
      [...stalledTracks].map((key) => key.slice(0, key.lastIndexOf('/'))),
    );
    // Judge only against peers that are actually sending something: a muted,
    // camera-off peer produces no frames and so no evidence either way. Peers
    // who have left keep stale entries in the set, which is harmless - they are
    // simply not part of this comparison.
    const publishing = remoteParticipants.filter(
      (participant) => participant.publishedTracks.length > 0,
    );
    const failing = publishing.filter((participant) =>
      stalledUserIds.has(participant.userId),
    );
    if (failing.length === 0) return { kind: 'ok' };
    if (failing.length === publishing.length)
      return { kind: 'local-key-mismatch' };
    return {
      kind: 'peer-key-mismatch',
      names: failing.map(
        (participant) => participant.name || participant.userId,
      ),
    };
  }, [stalledTracks, remoteParticipants]);
};
