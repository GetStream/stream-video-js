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
    trace('signalingstatechange', pc.signalingState);
  });
  pc.addEventListener('iceconnectionstatechange', () => {
    trace('iceconnectionstatechange', pc.iceConnectionState);
  });
  pc.addEventListener('icegatheringstatechange', () => {
    trace('icegatheringstatechange', pc.iceGatheringState);
  });
  pc.addEventListener('connectionstatechange', () => {
    trace('connectionstatechange', pc.connectionState);
  });
  pc.addEventListener('negotiationneeded', () => {
    trace('negotiationneeded', undefined);
  });
  pc.addEventListener('datachannel', ({ channel }) => {
    trace('datachannel', [channel.id, channel.label]);
  });

  const origClose = pc.close;
  pc.close = function tracedClose() {
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
