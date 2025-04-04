import type { RTCStatsDataType, Trace } from './types';

export const traceRTCPeerConnection = (pc: RTCPeerConnection, trace: Trace) => {
  pc.addEventListener('icecandidate', (e) => {
    trace('onicecandidate', e.candidate);
  });
  pc.addEventListener('track', (e) => {
    const streams = e.streams.map((stream) => `stream:${stream.id}`);
    trace('ontrack', `${e.track.kind}:${e.track.id} ${streams}`);
  });
  pc.addEventListener('signalingstatechange', () => {
    trace('onsignalingstatechange', pc.signalingState);
  });
  pc.addEventListener('iceconnectionstatechange', () => {
    trace('oniceconnectionstatechange', pc.iceConnectionState);
  });
  pc.addEventListener('icegatheringstatechange', () => {
    trace('onicegatheringstatechange', pc.iceGatheringState);
  });
  pc.addEventListener('connectionstatechange', () => {
    trace('onconnectionstatechange', pc.connectionState);
  });
  pc.addEventListener('negotiationneeded', () => {
    trace('onnegotiationneeded', undefined);
  });
  pc.addEventListener('datachannel', ({ channel }) => {
    trace('ondatachannel', [channel.id, channel.label]);
  });

  let prev: Record<string, RTCStats> = {};
  const getStats = () => {
    pc.getStats(null)
      .then((stats) => {
        const now = toObject(stats);
        trace('getstats', deltaCompression(prev, now));
        prev = now;
      })
      .catch((err) => {
        trace('getstatsOnFailure', (err as Error).toString());
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
  pc.close = function tracedClose() {
    clearInterval(interval);
    trace('close', undefined);
    return origClose.call(this);
  };

  for (const method of [
    'createOffer',
    'createAnswer',
    'setLocalDescription',
    'setRemoteDescription',
    'addIceCandidate',
  ] as const) {
    const original = pc[method];
    if (!original) continue;

    // @ts-expect-error we don't use deprecated APIs
    pc[method] = async function tracedMethod(...args: any[]) {
      try {
        trace(method, args);
        // @ts-expect-error improper types
        const result = await original.apply(this, args);
        trace(`${method}OnSuccess`, result as RTCStatsDataType);
        return result;
      } catch (err) {
        trace(`${method}OnFailure`, (err as Error).toString());
        throw err;
      }
    };
  }
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
