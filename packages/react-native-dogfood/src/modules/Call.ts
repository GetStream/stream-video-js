import {
  // @ts-ignore
  EventOnCandidate,
  MediaStream,
  MediaStreamTrack,
  // @ts-ignore
  RTCPeerConnectionConfiguration,
} from 'react-native-webrtc';
import { EventHandler, RTCDataChannel } from '../../types';
import {
  RTCPeerConnection,
  RTCRtpTransceiver,
  RTCSessionDescription,
} from 'react-native-webrtc/src';
import * as SDPTransform from 'sdp-transform';
import { DEFAULT_VIDEO_LAYERS, findOptimalVideoLayers } from './VideoLayers';
import { createSignalChannel } from './Signal';
import {
  Credentials,
  ICEServer,
  StreamSfuClient,
  SfuModels,
  SfuEvents,
} from '@stream-io/video-client';

const hostnameFromUrl = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch (e) {
    console.warn("Invalid URL. Can't extract hostname from it.", e);
    return url;
  }
};

const toRtcConfiguration = (config?: ICEServer[]) => {
  if (!config || config.length === 0) {
    return undefined;
  }
  const rtcConfig: RTCPeerConnectionConfiguration = {
    iceServers: config.map((ice) => ({
      urls: ice.urls,
      username: ice.username,
      credential: ice.password,
    })),
  };
  return rtcConfig;
};

const defaultRtcConfiguration = (
  sfuUrl: string,
): RTCPeerConnectionConfiguration => ({
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: `turn:${hostnameFromUrl(sfuUrl)}:3478`,
      username: 'video',
      credential: 'video',
    },
  ],
});

export class Call {
  private readonly client: StreamSfuClient;
  private readonly connectionConfig: RTCPeerConnectionConfiguration | undefined;
  readonly currentUserId: string;

  /** the current user's upload and download tracks. We use 2 peer connections to avoid glare */
  publisher: RTCPeerConnection | undefined;
  subscriber: RTCPeerConnection | undefined;
  signalChannel: RTCDataChannel | undefined;
  transceiver: RTCRtpTransceiver | undefined;
  videoLayers: SfuModels.VideoLayer[] = DEFAULT_VIDEO_LAYERS;

  // listeners for events
  listeners: {
    [key: string]: EventHandler[];
  } = {};

  handleOnTrack?: (e: any) => void;

  constructor(
    client: StreamSfuClient,
    currentUserId: string,
    serverUrl: string,
    credentials: Credentials,
  ) {
    this.client = client;
    this.currentUserId = currentUserId;
    this.connectionConfig =
      toRtcConfiguration(credentials.iceServers) ||
      defaultRtcConfiguration(serverUrl);
  }

  /** Join the call and if publish is true start broadcasting video */
  async join(publish: boolean = true, stream: MediaStream | undefined) {
    // first set up the download track and signal

    this.subscriber = new RTCPeerConnection(this.connectionConfig);

    this.subscriber.onicecandidate = this.onSubscriberIceCandidate;

    this.subscriber.addEventListener('track', (event: any) => {
      if (this.handleOnTrack) {
        this.handleOnTrack(event);
      }
    });

    this.signalChannel = createSignalChannel({
      label: 'signaling',
      pc: this.subscriber,
      onMessage: (message) => {
        this.handleEvent(message);
      },
    });

    const subscriberOfferSDP = (await this.subscriber.createOffer(
      {},
    )) as RTCSessionDescription;
    const { sdp } = subscriberOfferSDP;
    await this.subscriber.setLocalDescription(subscriberOfferSDP);
    if (sdp == null) {
      throw new Error('null sdp');
    }
    if (!stream) {
      return { callState: null };
    }

    const [audioEncode, audioDecode, videoEncode, videoDecode] =
      await Promise.all([
        this.getCodecsFromPeerConnection('audio', 'sendonly', stream),
        this.getCodecsFromPeerConnection('audio', 'recvonly', stream),
        this.getCodecsFromPeerConnection('video', 'sendonly', stream),
        this.getCodecsFromPeerConnection('video', 'recvonly', stream),
      ]);

    if (stream) {
      this.videoLayers = await findOptimalVideoLayers(stream);
    }

    const joinInput: SfuEvents.JoinRequest = {
      publish: true,
      //TODO: SV can you add the token here please?
      token: '',
      sessionId: this.client.sessionId,
      codecSettings: {
        audio: {
          encodes: audioEncode,
          decodes: audioDecode,
        },
        video: {
          encodes: videoEncode,
          decodes: videoDecode,
        },
        layers: this.videoLayers,
      },
    };
    const { response: joinResponse } = await this.client.rpc.join(joinInput);

    const subscriberAnswerSessionDescription = {
      // @ts-ignore
      type: 'answer',
      sdp: joinResponse.sdp,
    };
    await this.subscriber.setRemoteDescription(
      subscriberAnswerSessionDescription,
    );

    if (publish) {
      this.publisher = new RTCPeerConnection(this.connectionConfig);
      this.publisher.onicecandidate = this.onPublisherIceCandidate;
      this.publisher.onnegotiationneeded = this.onNegotiationNeeded;
    }

    return joinResponse;
  }

  publish = async (stream: MediaStream) => {
    const pc = this.publisher!!;

    stream.getAudioTracks().forEach((track: MediaStreamTrack) => {
      pc.addTrack(track);
    });

    const [primaryVideoTrack] = stream.getVideoTracks();
    this.transceiver = pc.addTransceiver(primaryVideoTrack, {
      direction: 'sendonly',
      streams: [stream],
      sendEncodings: this.videoLayers.map((layer, index) => {
        return {
          rid: layer.rid,
          maxBitrate: layer.bitrate,
          scaleResolutionDownBy: Math.pow(2, index).toFixed(1),
        };
      }),
    });
  };

  updatePublishQuality = async (enabledRids: string[]) => {
    const videoSender = this.publisher
      ?.getSenders()
      .find((s) => s.track?.kind === 'video');
    if (!videoSender) {
      return;
    }

    const _params = await videoSender.getParameters();
    if (!_params?.encodings) {
      return;
    }
    let changed = false;
    _params.encodings.forEach((encoding: any) => {
      const previouslyActive = encoding.active;
      const shouldNowBeActive = enabledRids.includes(encoding.rid);
      if (previouslyActive !== shouldNowBeActive) {
        changed = true;
      }
    });
    if (changed) {
      console.log('old params', {
        params: JSON.stringify(_params, null, 2),
      });
      // @ts-ignore
      _params.encodings = this.videoLayers.map((layer, index) => ({
        rid: layer.rid,
        maxBitrate: layer.bitrate,
        scaleResolutionDownBy: Math.pow(2, index).toFixed(1),
        active: enabledRids.includes(layer.rid),
      }));
      console.log('new params', {
        params: JSON.stringify(_params, null, 2),
      });
      await videoSender.setParameters(_params);
    }
  };

  getStats = async (kind: 'subscriber' | 'publisher') => {
    if (kind === 'subscriber' && this.subscriber) {
      return this.subscriber.getStats();
    } else if (kind === 'publisher' && this.publisher) {
      return this.publisher.getStats();
    } else {
      console.warn("Can't retrieve RTC stats for", kind);
      return undefined;
    }
  };

  /** Handle events from the signalling channel */
  async handleEvent(event: SfuEvents.SfuEvent) {
    const eventKind = event.eventPayload.oneofKind;
    switch (eventKind) {
      case 'changePublishQuality':
        if (eventKind !== 'changePublishQuality') {
          return;
        }
        const { videoSenders } = event.eventPayload.changePublishQuality;

        if (videoSenders && videoSenders.length > 0) {
          const enabledRids: string[] = [];
          videoSenders.forEach((video) => {
            const { layers } = video;
            layers.forEach((l) => l.active && enabledRids.push(l.name));
          });
          // TODO: enable this when simulcast is working
          // await this.updatePublishQuality(enabledRids);
        }
        break;

      case 'subscriberOffer':
        const subOffer = event.eventPayload.subscriberOffer;
        if (!this.subscriber) {
          return;
        }
        try {
          const subscriberOfferSessionDescription = {
            // @ts-ignore
            type: 'offer',
            sdp: subOffer.sdp,
          };

          await this.subscriber.setRemoteDescription(
            subscriberOfferSessionDescription,
          );
          const answer =
            (await this.subscriber.createAnswer()) as RTCSessionDescription;
          await this.subscriber.setLocalDescription(answer);

          await this.client.rpc.sendAnswer({
            sessionId: this.client.sessionId,
            peerType: SfuModels.PeerType.SUBSCRIBER,
            sdp: answer.sdp || '',
          });
        } catch (error) {
          console.warn(error);
        }
        break;
      default:
        break;
    }
    // dispatch the event to listeners
    this.dispatchEvent(event);
  }

  // dispatch the event to listeners
  dispatchEvent = (event: SfuEvents.SfuEvent) => {
    const call = this;
    // gather and call the listeners
    const listeners = [];
    if (call.listeners.all) {
      listeners.push(...call.listeners.all);
    }
    const eventType = event.eventPayload.oneofKind;
    if (!eventType) {
      console.warn('invalid type found in event payload', eventType);
      return null;
    }
    if (call.listeners[eventType]) {
      listeners.push(...call.listeners[eventType]);
    }

    // call the event and send it to the listeners
    for (const listener of listeners) {
      if (typeof listener !== 'string') {
        listener(event);
      }
    }
  };

  /** Receive the ice candidates for the subscriber track */
  onSubscriberIceCandidate = async (event: EventOnCandidate) => {
    const { candidate } = event;
    if (!candidate) {
      // When you find a null candidate then there are no more candidates.
      // Gathering of candidates has finished.
      return;
    }
    /* example candidate
    "candidate":{
      "candidate":"candidate:470786752 1 udp 2122260223 192.168.50.171 65335 typ host generation 0 ufrag vW0o network-id 1 network-cost 10",
      "sdpMLineIndex":0,
      "sdpMid":"0"
    }
    */
    const splittedCandidate = candidate.candidate.split(' ');
    const ufragIndex =
      splittedCandidate.findIndex((s: string) => s === 'ufrag') + 1;
    const usernameFragment = splittedCandidate[ufragIndex];

    await this.client.rpc.sendIceCandidate({
      publisher: false,
      sessionId: this.client.sessionId,
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid ?? undefined,
      sdpMlineIndex: candidate.sdpMLineIndex ?? undefined,
      usernameFragment,
    });
  };

  /** Receive the ice candidates for the publisher track */
  onPublisherIceCandidate = async ({ candidate }: EventOnCandidate) => {
    if (!candidate) {
      // When you find a null candidate then there are no more candidates.
      // Gathering of candidates has finished.
      return;
    }
    const splittedCandidate = candidate.candidate.split(' ');
    const ufragIndex =
      splittedCandidate.findIndex((s: string) => s === 'ufrag') + 1;
    const usernameFragment = splittedCandidate[ufragIndex];
    await this.client.rpc.sendIceCandidate({
      publisher: true,
      sessionId: this.client.sessionId,
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid ?? undefined,
      sdpMlineIndex: candidate.sdpMLineIndex ?? undefined,
      usernameFragment,
    });
  };

  getCodecsFromPeerConnection = async (
    kind: 'audio' | 'video',
    direction: string,
    stream: MediaStream,
  ) => {
    const pc = new RTCPeerConnection(this.connectionConfig);
    const [primaryVideoTrack] = stream.getVideoTracks();
    const [primaryAudioTrack] = stream.getAudioTracks();
    const track = kind === 'video' ? primaryVideoTrack : primaryAudioTrack;

    const transceiver = pc.addTransceiver(track, {
      streams: [stream],
    });
    transceiver.direction = direction;
    const offer = (await pc.createOffer({})) as RTCSessionDescription;
    const parsedSdp = SDPTransform.parse(offer.sdp);
    const supportedCodecs: SfuModels.Codec[] = [];
    parsedSdp.media.forEach((media) => {
      if (media.type === kind) {
        media.rtp.forEach((rtp) => {
          const index = media.fmtp.findIndex((f) => f.payload === rtp.payload);
          const fmtpLine = media.fmtp[index]?.config ?? '';
          supportedCodecs.push({
            hwAccelerated: true,
            clockRate: rtp.rate ?? 0,
            fmtpLine,
            mime: `${kind}/${rtp.codec}`,
          });
        });
      }
    });

    pc.close();
    return supportedCodecs;
  };

  /** on negoatiation needed repeats the offer answer cycle */
  onNegotiationNeeded = async () => {
    const offer = (await this.publisher?.createOffer(
      {},
    )) as RTCSessionDescription;
    this.publisher?.setLocalDescription(offer);
    const result = await this.client.rpc.setPublisher({
      sessionId: this.client.sessionId,
      sdp: offer?.sdp || '',
    });

    const publisherAnswerSessionDescription = {
      // @ts-ignore
      type: 'answer',
      sdp: result.response.sdp,
    };

    await this.publisher?.setRemoteDescription(
      publisherAnswerSessionDescription,
    );
  };

  /** basic event handling */
  on(
    eventType: string | EventHandler,
    callback?: EventHandler | undefined,
  ): { unsubscribe: () => void };
  // eslint-disable-next-line no-dupe-class-members
  on(
    callbackOrString: EventHandler | string,
    callbackOrNothing?: EventHandler | undefined,
  ): { unsubscribe: () => void } {
    const key = callbackOrNothing ? (callbackOrString as string) : 'all';
    const callback = callbackOrNothing
      ? callbackOrNothing
      : (callbackOrString as EventHandler);
    if (!(key in this.listeners)) {
      this.listeners[key] = [];
    }

    this.listeners[key].push(callback);
    return {
      unsubscribe: () => {
        this.listeners[key] = this.listeners[key].filter(
          (el) => el !== callback,
        );
      },
    };
  }

  disconnect = () => {
    this.subscriber?.close();
    this.subscriber = undefined;
    this.publisher?.close();
    this.publisher = undefined;
    this.signalChannel?.close();
  };
}
