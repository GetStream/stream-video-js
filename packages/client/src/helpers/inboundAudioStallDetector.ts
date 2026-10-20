import { CallingState, CallState } from '../store';
import type { Subscriber } from '../rtc';
import { Tracer } from '../stats';
import { hasAudio, hasScreenShareAudio } from './participantUtils';

export type InboundAudioStallDetectorOptions = {
  state: CallState;
  subscriber: Subscriber;
  tracer: Tracer;
  /** How long no inbound audio packet may arrive before it's traced. */
  stallThresholdMs?: number;
  pollingIntervalMs?: number;
};

/**
 * Traces "joined but silent": the call is joined and at least one remote
 * participant publishes audio, yet the subscriber hasn't received an audio
 * packet for `stallThresholdMs`. Unmuted senders keep sending packets
 * (DTX included), so silence alone doesn't trigger it, and calls where
 * everyone is muted are never checked. Trace-only, no recovery.
 *
 * @returns a function that stops the detector.
 */
export const createInboundAudioStallDetector = ({
  state,
  subscriber,
  tracer,
  stallThresholdMs = 5000,
  pollingIntervalMs = 2000,
}: InboundAudioStallDetectorOptions) => {
  let lastPackets: number | undefined;
  let lastProgressAt = Date.now();
  let stalledSince: number | undefined;
  let stopped = false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const reset = (now: number) => {
    lastPackets = undefined;
    lastProgressAt = now;
  };

  const countInboundAudioPackets = async () => {
    let packets = 0;
    const report = await subscriber.getStats();
    report.forEach((s) => {
      if (s.type === 'inbound-rtp' && s.kind === 'audio') {
        packets += s.packetsReceived ?? 0;
      }
    });
    return packets;
  };

  const check = async () => {
    const now = Date.now();
    const senders =
      state.callingState === CallingState.JOINED
        ? state.remoteParticipants.filter(
            (p) => hasAudio(p) || hasScreenShareAudio(p),
          )
        : [];
    if (senders.length === 0) {
      if (stalledSince !== undefined) {
        tracer.trace('inboundAudio.stallEnded', {
          stalledForMs: now - stalledSince,
          reason: 'no_remote_audio_expected',
        });
        stalledSince = undefined;
      }
      reset(now);
      return;
    }

    const packets = await countInboundAudioPackets();
    if (lastPackets === undefined || packets < lastPackets) {
      // first sample, or the receivers changed: start a new baseline
      lastPackets = packets;
      lastProgressAt = now;
      return;
    }
    if (packets > lastPackets) {
      lastPackets = packets;
      lastProgressAt = now;
      if (stalledSince !== undefined) {
        tracer.trace('inboundAudio.stallEnded', {
          stalledForMs: now - stalledSince,
          reason: 'packets_resumed',
        });
        stalledSince = undefined;
      }
      return;
    }
    if (
      stalledSince === undefined &&
      now - lastProgressAt >= stallThresholdMs
    ) {
      stalledSince = lastProgressAt;
      tracer.trace('inboundAudio.stalled', {
        noPacketsForMs: now - lastProgressAt,
        remoteAudioSenders: senders.length,
      });
    }
  };

  const loop = async () => {
    await check().catch(() => {});
    if (!stopped) timeoutId = setTimeout(loop, pollingIntervalMs);
  };
  timeoutId = setTimeout(loop, pollingIntervalMs);

  return () => {
    stopped = true;
    clearTimeout(timeoutId);
  };
};
