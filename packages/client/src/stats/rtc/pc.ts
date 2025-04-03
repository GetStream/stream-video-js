import type { RTCStatsDataType, Trace } from './types';

type AsyncMethodOf<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => Promise<any> ? K : never;
}[keyof T];

export const traceRTCPeerConnection = (
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
    pc.getStats(null)
      .then((stats) => {
        const now = toObject(stats);
        trace('getstats', id, deltaCompression(prev, now));
        prev = now;
      })
      .catch((err) => {
        trace('getstatsOnFailure', id, (err as Error).toString());
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
    trace('close', id, undefined);
    return origClose.call(this);
  };

  const enableTracingFor = (methods: AsyncMethodOf<RTCPeerConnection>[]) => {
    for (const method of methods) {
      const original = pc[method];
      if (!original) continue;

      // @ts-expect-error we don't use deprecated APIs
      pc[method] = async function tracedMethod(...args: any[]) {
        try {
          trace(method, id, args);
          // @ts-expect-error improper types
          const result = await original.apply(this, args);
          trace(`${method}OnSuccess`, id, result as RTCStatsDataType);
          return result;
        } catch (err) {
          trace(`${method}OnFailure`, id, (err as Error).toString());
          throw err;
        }
      };
    }
  };

  enableTracingFor([
    'createOffer',
    'createAnswer',
    'setLocalDescription',
    'setRemoteDescription',
    'addIceCandidate',
  ]);
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
