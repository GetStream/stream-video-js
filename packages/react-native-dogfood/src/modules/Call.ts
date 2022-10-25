import { MediaStream } from 'react-native-webrtc';
import { EventHandler, RTCConfiguration, RTCDataChannel } from '../../types';
import { RTCPeerConnection, RTCRtpTransceiver } from 'react-native-webrtc/src';
import { DEFAULT_VIDEO_LAYERS, findOptimalVideoLayers } from './VideoLayers';
import {
  Credentials,
  ICEServer,
  SfuModels,
  StreamSfuClient,
} from '@stream-io/video-client';
import { createSubscriber } from './Subscriber';
import { createPublisher } from './Publisher';
import { handleICETrickle, registerEventHandlers } from './CallEventHandlers';
import { SfuEventListener } from '@stream-io/video-client/dist/src/rtc/Dispatcher';
import { SfuRequest } from '@stream-io/video-client/dist/src/gen/video/sfu/event/events';
import {
  CallState,
  VideoDimension,
} from '@stream-io/video-client/dist/src/gen/video/sfu/models/models';
import { getReceiverCodecs, getSenderCodecs } from './Codecs';

const hostnameFromUrl = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch (e) {
    console.warn("Invalid URL. Can't extract hostname from it.", e);
    return url;
  }
};

const toRtcConfiguration = (
  config?: ICEServer[],
): RTCConfiguration | undefined => {
  if (!config || config.length === 0) {
    return undefined;
  }
  const rtcConfig = {
    iceServers: config.map((ice) => ({
      urls: ice.urls,
      username: ice.username,
      credential: ice.password,
    })),
  };
  return rtcConfig;
};

const defaultRtcConfiguration = (sfuUrl: string): RTCConfiguration => ({
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
  private readonly connectionConfig: RTCConfiguration;
  readonly currentUserId: string;

  /** the current user's upload and download tracks. We use 2 peer connections to avoid glare */
  publisher: RTCPeerConnection | undefined;
  subscriber: RTCPeerConnection | undefined;
  signalChannel: RTCDataChannel | undefined;
  transceiver: RTCRtpTransceiver | undefined;
  videoLayers: SfuModels.VideoLayer[] = DEFAULT_VIDEO_LAYERS;
  publisherCandidates: any[] = [];
  subscriberCandidates: any[] = [];
  participantMapping: { [key: string]: string } = {};

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
      toRtcConfiguration(credentials.iceServers) ??
      defaultRtcConfiguration(serverUrl);
    this.client.dispatcher.on('iceTrickle', handleICETrickle(this));
    this.subscriber = createSubscriber({
      rpcClient: this.client,

      // FIXME: don't do this
      dispatcher: client.dispatcher,
      connectionConfig: this.connectionConfig,
      onTrack: (e) => {
        console.log('Got remote track:', e.track);
        this.handleOnTrack?.(e);
      },
      getCandidates: () => this.subscriberCandidates,
      clearCandidates: () => (this.subscriberCandidates = []),
    });
    this.publisher = createPublisher({
      rpcClient: this.client,
      connectionConfig: this.connectionConfig,
      getCandidates: () => this.publisherCandidates,
      clearCandidates: () => (this.publisherCandidates = []),
    });
    registerEventHandlers(this);
  }

  // FIXME: change the call-sites in the SDK
  on = (eventName: string, fn: SfuEventListener) => {
    return this.client.dispatcher.on(eventName, fn);
  };
  // FIXME: change the call-sites in the SDK
  off = (eventName: string, fn: SfuEventListener) => {
    return this.client.dispatcher.off(eventName, fn);
  };

  leave = () => {
    this.subscriber?.close();

    this.publisher?.getSenders().forEach((s) => {
      s.track?.stop();
      this.publisher?.removeTrack(s);
    });
    this.publisher?.close();

    this.client.close();
  };

  join = async (stream: MediaStream | undefined) => {
    await this.client.signalReady;

    const [audioEncode, audioDecode, videoEncode, videoDecode] =
      await Promise.all([
        getSenderCodecs('audio', this.connectionConfig),
        getReceiverCodecs('audio', this.connectionConfig, this.subscriber),
        getSenderCodecs('video', this.connectionConfig),
        getReceiverCodecs('video', this.connectionConfig, this.subscriber),
      ]);

    if (stream) {
      this.videoLayers = await findOptimalVideoLayers(stream);
    }

    this.client.send(
      SfuRequest.create({
        requestPayload: {
          oneofKind: 'joinRequest',
          joinRequest: {
            sessionId: this.client.sessionId,
            token: this.client.token,
            // todo fix-me
            publish: true,
            // publish: true,
            // FIXME OL: encode parameters and video layers should be announced when
            // initiating "publish" operation
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
          },
        },
      }),
    );

    // FIXME: make it nicer
    return new Promise<CallState | undefined>((resolve) => {
      this.client.dispatcher.on('joinResponse', (event) => {
        if (event.eventPayload.oneofKind === 'joinResponse') {
          const callState = event.eventPayload.joinResponse.callState;
          callState?.participants.forEach((p) => {
            this.participantMapping[p.trackLookupPrefix!] = p.user!.id;
          });
          this.client.keepAlive();
          resolve(callState);
        }
      });
    });
  };

  publish = async (stream: MediaStream) => {
    const [videoTrack] = stream.getVideoTracks();
    const [audioTrack] = stream.getAudioTracks();

    if (videoTrack) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const videoTransceiver = this.publisher?.addTransceiver(videoTrack, {
        direction: 'sendonly',
        streams: [stream],
        sendEncodings: this.videoLayers.map((layer, index) => {
          return {
            rid: layer.rid,
            maxBitrate: layer.bitrate,
            scaleResolutionDownBy: Number(Math.pow(2, index).toFixed(1)),
          };
        }),
      });

      // TODO: use below this when webrtc supports getCapabilities
      // const codecPreferences = getPreferredCodecs('video', 'vp8');
      // // @ts-ignore
      // if ('setCodecPreferences' in videoTransceiver && codecPreferences) {
      //   console.log(`set codec preferences`, codecPreferences);
      //   videoTransceiver.setCodecPreferences(codecPreferences);
      // }
    }

    if (audioTrack) {
      this.publisher?.addTransceiver(audioTrack, {
        direction: 'sendonly',
      });
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

  updateMuteState = (trackKind: 'audio' | 'video', isMute: boolean) => {
    if (!this.publisher) {
      return;
    }
    const senders = this.publisher.getSenders();
    const sender = senders.find((s) => s.track?.kind === trackKind);
    if (sender && sender.track) {
      sender.track.enabled = !isMute;

      if (trackKind === 'audio') {
        return this.client.updateAudioMuteState(isMute);
      } else if (trackKind === 'video') {
        return this.client.updateVideoMuteState(isMute);
      }
    }
  };

  updatePublishQuality = async (enabledRids: string[]) => {
    console.log(
      'Updating publish quality, qualities requested by SFU:',
      enabledRids,
    );
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

  updateSubscriptions = async (subscriptions: {
    [key: string]: VideoDimension;
  }) => {
    return this.client.updateSubscriptions(subscriptions);
  };
}
