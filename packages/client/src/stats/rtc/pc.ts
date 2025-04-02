import type { Trace } from './types';

export const patchRTCPeerConnection = (
  pc: RTCPeerConnection,
  id: string,
  trace: Trace,
) => {
  pc.addEventListener('icecandidate', (e) => {
    trace('onicecandidate', id, e.candidate);
  });
  pc.addEventListener('track', (e) => {
    const streams = e.streams.map((stream) => `stream:${stream.id}`);
    trace('ontrack', id, `${e.track.kind}:${e.track.id} ${streams}`);
  });
  pc.addEventListener('signalingstatechange', () => {
    trace('onsignalingstatechange', id, pc.signalingState);
  });
  pc.addEventListener('iceconnectionstatechange', () => {
    trace('oniceconnectionstatechange', id, pc.iceConnectionState);
  });
  pc.addEventListener('icegatheringstatechange', () => {
    trace('onicegatheringstatechange', id, pc.iceGatheringState);
  });
  pc.addEventListener('connectionstatechange', () => {
    trace('onconnectionstatechange', id, pc.connectionState);
  });
  pc.addEventListener('negotiationneeded', () => {
    trace('onnegotiationneeded', id, undefined);
  });
  pc.addEventListener('datachannel', ({ channel }) => {
    trace('ondatachannel', id, [channel.id, channel.label]);
  });

  let prev: Record<string, RTCStats> = {};
  const getStats = () => {
    pc.getStats(null).then((stats) => {
      const now = toObject(stats);
      trace('getstats', id, deltaCompression(prev, now));
      prev = now;
    });
  };

  const interval = setInterval(() => {
    getStats();
  }, 8000);

  pc.addEventListener('connectionstatechange', () => {
    const state = pc.connectionState;
    if (state === 'connected' || state === 'failed') {
      getStats();
    }
  });

  const origClose = pc.close;
  pc.close = function patchedClose() {
    clearInterval(interval);
    trace('close', id, undefined);
    return origClose.call(this);
  };

  const origCreateOffer: (
    options?: RTCOfferOptions,
  ) => Promise<RTCSessionDescriptionInit> = pc.createOffer;

  // @ts-expect-error we don't use deprecated APIs
  pc.createOffer = async function patchedCreateOffer(
    options?: RTCOfferOptions,
  ) {
    trace('createOffer', id, options);
    try {
      const description = await origCreateOffer.call(this, options);
      trace('createOfferOnSuccess', id, description);
      return description;
    } catch (err) {
      trace('createOfferOnFailure', id, (err as Error).toString());
      throw err;
    }
  };

  const origCreateAnswer: (
    opts?: RTCAnswerOptions,
  ) => Promise<RTCSessionDescriptionInit> = pc.createAnswer;

  // @ts-expect-error we don't use deprecated APIs
  pc.createAnswer = async function patchedCreateAnswer(
    options?: RTCAnswerOptions,
  ) {
    trace('createAnswer', id, options);
    try {
      const description = await origCreateAnswer.call(this, options);
      trace('createAnswerOnSuccess', id, description);
      return description;
    } catch (err) {
      trace('createAnswerOnFailure', id, (err as Error).toString());
      throw err;
    }
  };

  const origSetLocalDescription: (
    description: RTCSessionDescriptionInit,
  ) => Promise<void> = pc.setLocalDescription;

  pc.setLocalDescription = async function patchedSetLocalDescription(
    description: RTCSessionDescriptionInit,
  ) {
    trace('setLocalDescription', id, description);
    try {
      await origSetLocalDescription.call(this, description);
      trace('setLocalDescriptionOnSuccess', id, undefined);
    } catch (err) {
      trace('setLocalDescriptionOnFailure', id, (err as Error).toString());
      throw err;
    }
  };

  const origSetRemoteDescription: (
    description: RTCSessionDescriptionInit,
  ) => Promise<void> = pc.setRemoteDescription;

  pc.setRemoteDescription = async function patchedSetRemoteDescription(
    description: RTCSessionDescriptionInit,
  ) {
    trace('setRemoteDescription', id, description);
    try {
      await origSetRemoteDescription.call(this, description);
      trace('setRemoteDescriptionOnSuccess', id, undefined);
    } catch (err) {
      trace('setRemoteDescriptionOnFailure', id, (err as Error).toString());
      throw err;
    }
  };

  const origAddIceCandidate: (
    candidate: RTCIceCandidateInit | null,
  ) => Promise<void> = pc.addIceCandidate;

  pc.addIceCandidate = async function patchedAddIceCandidate(
    candidate: RTCIceCandidateInit | null,
  ) {
    trace('addIceCandidate', id, candidate);
    try {
      await origAddIceCandidate.call(this, candidate);
      trace('addIceCandidateOnSuccess', id, undefined);
    } catch (err) {
      trace('addIceCandidateOnFailure', id, (err as Error).toString());
      throw err;
    }
  };
};

const toObject = (s: RTCStatsReport): Record<string, RTCStats> => {
  const obj: Record<string, RTCStats> = {};
  s.forEach((v, k) => {
    obj[k] = v;
  });
  return obj;
};

/**
 * Apply delta compression to the stats report.
 * Reduces size by ~90%.
 * To reduce further, report keys could be compressed.
 */
const deltaCompression = (
  oldStats: Record<any, any>,
  newStats: Record<any, any>,
): Record<any, any> => {
  newStats = JSON.parse(JSON.stringify(newStats));

  for (const [id, report] of Object.entries(newStats)) {
    delete report.id;
    if (!oldStats[id]) continue;

    for (const [name, value] of Object.entries(report)) {
      if (value === oldStats[id][name]) {
        delete report[name];
      }
    }
  }

  let timestamp = -Infinity;
  for (const report of Object.values(newStats)) {
    if (report.timestamp > timestamp) {
      timestamp = report.timestamp;
    }
  }
  for (const report of Object.values(newStats)) {
    if (report.timestamp === timestamp) {
      report.timestamp = 0;
    }
  }
  newStats.timestamp = timestamp;
  return newStats;
};
