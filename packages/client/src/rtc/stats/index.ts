import type { PatchedRTCPeerConnection, Trace } from './types';
import { deltaCompression, dumpStream, map2obj } from './utils';

export default function (trace: Trace, getStatsInterval: number) {
  let pcCounter = 0;

  const origPeerConnection = RTCPeerConnection;

  // @ts-expect-error we're modifying the RTCPeerConnection constructor
  const patchedRTCPeerConnection: PatchedRTCPeerConnection = function (
    config?: RTCConfiguration | undefined,
  ) {
    const pc: RTCPeerConnection = new origPeerConnection(config);
    const id = 'PC_' + pcCounter++;

    // @ts-expect-error __rtcStatsId is not part of the RTCPeerConnection interface
    pc.__rtcStatsId = id;

    if (!config) {
      // @ts-expect-error we're modifying the config object with a custom property
      config = { nullConfig: true };
    }

    config = JSON.parse(JSON.stringify(config)); // deepcopy
    // don't log credentials
    ((config && config.iceServers) || []).forEach((server) => {
      delete server.credential;
    });

    trace('create', id, config);

    pc.addEventListener('icecandidate', (e) => {
      trace('onicecandidate', id, e.candidate);
    });
    pc.addEventListener('track', (e) => {
      const streams = e.streams.map((stream) => 'stream:' + stream.id);
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
    pc.addEventListener('datachannel', (event) => {
      trace('ondatachannel', id, [event.channel.id, event.channel.label]);
    });

    let prev = {};
    const getStats = () => {
      pc.getStats(null).then((stats) => {
        const now = map2obj(stats as Map<string, any>);
        const base = JSON.parse(JSON.stringify(now)); // our new prev
        trace('getstats', id, deltaCompression(prev, now));
        prev = base;
      });
    };

    if (getStatsInterval) {
      const interval = window.setInterval(() => {
        if (pc.signalingState === 'closed') {
          window.clearInterval(interval);
          return;
        }
        getStats();
      }, getStatsInterval);
    }

    pc.addEventListener('connectionstatechange', () => {
      const state = pc.connectionState;
      if (state === 'connected' || state === 'failed') {
        getStats();
      }
    });
    return pc;
  };

  patchedRTCPeerConnection.prototype = origPeerConnection.prototype;
  patchedRTCPeerConnection.generateCertificate =
    origPeerConnection.generateCertificate;

  {
    const origCreateDataChannel: (
      label: string,
      options?: RTCDataChannelInit,
    ) => RTCDataChannel = origPeerConnection.prototype.createDataChannel;
    origPeerConnection.prototype.createDataChannel = function (
      this: PatchedRTCPeerConnection,
      label: string,
      options?: RTCDataChannelInit,
    ) {
      trace('createDataChannel', this.__rtcStatsId, [label, options]);
      return origCreateDataChannel.call(this, label, options);
    };
  }

  {
    const origClose = origPeerConnection.prototype.close;
    origPeerConnection.prototype.close = function (
      this: PatchedRTCPeerConnection,
    ) {
      trace('close', this.__rtcStatsId, undefined);
      return origClose.call(this);
    };
  }

  {
    const origAddTrack = origPeerConnection.prototype.addTrack;
    origPeerConnection.prototype.addTrack = function (
      this: PatchedRTCPeerConnection,
      track: MediaStreamTrack,
      ...streams: MediaStream[]
    ) {
      const streamIds = streams.map((s) => 'stream:' + s.id).join(';') || '-';
      trace(
        'addTrack',
        this.__rtcStatsId,
        `${track.kind}:${track.id} ${streamIds}`,
      );
      return origAddTrack.call(this, track, ...streams);
    };
  }

  {
    const origRemoveTrack = origPeerConnection.prototype.removeTrack;
    origPeerConnection.prototype.removeTrack = function (
      this: PatchedRTCPeerConnection,
      sender: RTCRtpSender,
    ) {
      const track = sender.track;
      const data = track ? track.kind + ':' + track.id : 'null';
      trace('removeTrack', this.__rtcStatsId, data);
      return origRemoveTrack.call(this, sender);
    };
  }

  {
    const origCreateOffer: (
      options?: RTCOfferOptions,
    ) => Promise<RTCSessionDescriptionInit> =
      origPeerConnection.prototype.createOffer;

    // @ts-expect-error we don't use deprecated APIs
    origPeerConnection.prototype.createOffer = async function (
      this: PatchedRTCPeerConnection,
      options?: RTCOfferOptions,
    ) {
      const rtcStatsId = this.__rtcStatsId;
      trace('createOffer', rtcStatsId, options);
      try {
        const description = await origCreateOffer.call(this, options);
        trace('createOfferOnSuccess', rtcStatsId, description);
        return description;
      } catch (err) {
        trace('createOfferOnFailure', rtcStatsId, (err as Error).toString());
        throw err;
      }
    };
  }

  {
    const origCreateAnswer: (
      opts?: RTCAnswerOptions,
    ) => Promise<RTCSessionDescriptionInit> =
      origPeerConnection.prototype.createAnswer;

    // @ts-expect-error we don't use deprecated APIs
    origPeerConnection.prototype.createAnswer = async function (
      this: PatchedRTCPeerConnection,
      options?: RTCAnswerOptions,
    ) {
      const id = this.__rtcStatsId;
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
  }

  {
    const origSetLocalDescription: (
      description: RTCSessionDescriptionInit,
    ) => Promise<void> = origPeerConnection.prototype.setLocalDescription;

    origPeerConnection.prototype.setLocalDescription = async function (
      this: PatchedRTCPeerConnection,
      description: RTCSessionDescriptionInit,
    ) {
      const id = this.__rtcStatsId;
      trace('setLocalDescription', id, description);
      try {
        await origSetLocalDescription.call(this, description);
        trace('setLocalDescriptionOnSuccess', id, undefined);
      } catch (err) {
        trace('setLocalDescriptionOnFailure', id, (err as Error).toString());
        throw err;
      }
    };
  }

  {
    const origSetRemoteDescription: (
      description: RTCSessionDescriptionInit,
    ) => Promise<void> = origPeerConnection.prototype.setRemoteDescription;

    origPeerConnection.prototype.setRemoteDescription = async function (
      this: PatchedRTCPeerConnection,
      description: RTCSessionDescriptionInit,
    ) {
      const id = this.__rtcStatsId;
      trace('setRemoteDescription', id, description);
      try {
        await origSetRemoteDescription.call(this, description);
        trace('setRemoteDescriptionOnSuccess', id, undefined);
      } catch (err) {
        trace('setRemoteDescriptionOnFailure', id, (err as Error).toString());
        throw err;
      }
    };
  }

  {
    const origAddIceCandidate: (
      candidate: RTCIceCandidateInit | RTCIceCandidate,
    ) => Promise<void> = origPeerConnection.prototype.addIceCandidate;

    origPeerConnection.prototype.addIceCandidate = async function (
      this: PatchedRTCPeerConnection,
      candidate: RTCIceCandidateInit | RTCIceCandidate,
    ) {
      const id = this.__rtcStatsId;
      trace('addIceCandidate', id, candidate);
      try {
        await origAddIceCandidate.call(this, candidate);
        trace('addIceCandidateOnSuccess', id, undefined);
      } catch (err) {
        trace('addIceCandidateOnFailure', id, (err as Error).toString());
        throw err;
      }
    };
  }

  // wrap static methods. Currently just generateCertificate.
  if (origPeerConnection.generateCertificate) {
    Object.defineProperty(patchedRTCPeerConnection, 'generateCertificate', {
      get: function (...args: any[]) {
        return arguments.length
          ? // @ts-expect-error we don't use deprecated APIs
            origPeerConnection.generateCertificate.apply(null, args)
          : origPeerConnection.generateCertificate;
      },
    });
  }
  window.RTCPeerConnection = patchedRTCPeerConnection;

  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    const origGetUserMedia = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices,
    );
    const gum: MediaDevices['getUserMedia'] = async function (constraints) {
      const tag = 'navigator.mediaDevices';
      trace(`${tag}.getUserMedia`, null, constraints);
      try {
        const stream = await origGetUserMedia(constraints);
        trace(`${tag}.getUserMediaOnSuccess`, null, dumpStream(stream));
        return stream;
      } catch (err) {
        trace(`${tag}.getUserMediaOnFailure`, null, (err as Error).name);
        throw err;
      }
    };
    navigator.mediaDevices.getUserMedia = gum.bind(navigator.mediaDevices);
  }

  if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
    const origGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(
      navigator.mediaDevices,
    );
    const gdm: MediaDevices['getDisplayMedia'] = async function (constraints) {
      const tag = 'navigator.mediaDevices';
      trace(`${tag}.getDisplayMedia`, null, constraints);
      try {
        const stream = await origGetDisplayMedia(constraints);
        trace(`${tag}.getDisplayMediaOnSuccess`, null, dumpStream(stream));
        return stream;
      } catch (err) {
        trace(`${tag}.getDisplayMediaOnFailure`, null, (err as Error).name);
        throw err;
      }
    };
    navigator.mediaDevices.getDisplayMedia = gdm.bind(navigator.mediaDevices);
  }
}
