import { createSubscriber } from './subscriber';
import {
  findOptimalVideoLayers,
  defaultVideoLayers,
  OptimalVideoLayer,
} from './videoLayers';
import { StreamSfuClient } from '../StreamSfuClient';
import {
  defaultVideoPublishEncodings,
  getPreferredCodecs,
  getReceiverCodecs,
  getSenderCodecs,
} from './codecs';
import { createPublisher } from './publisher';
import { Dispatcher } from './Dispatcher';
import { CallState, VideoDimension } from '../gen/video/sfu/models/models';
import { handleICETrickle, registerEventHandlers } from './callEventHandlers';
import { RequestEvent } from '../gen/video/sfu/event/events';

export type CallOptions = {
  connectionConfig: RTCConfiguration | undefined;
};

export class Call {
  private readonly dispatcher = new Dispatcher();
  private readonly client: StreamSfuClient;
  private readonly options: CallOptions;

  private videoLayers?: OptimalVideoLayer[];
  private readonly subscriber: RTCPeerConnection;
  private readonly publisher: RTCPeerConnection;

  readonly currentUserId: string;

  // FIXME: OL: convert to regular event
  handleOnTrack?: (e: RTCTrackEvent) => void;

  constructor(
    client: StreamSfuClient,
    currentUserId: string,
    options: CallOptions,
  ) {
    this.client = client;
    this.currentUserId = currentUserId;
    this.options = options;

    this.subscriber = createSubscriber({
      rpcClient: this.client,
      dispatcher: this.dispatcher,
      connectionConfig: this.options.connectionConfig,
      onTrack: (e) => {
        console.log('Got remote track:', e.track);
        this.handleOnTrack?.(e);
      },
    });

    this.publisher = createPublisher({
      dispatcher: this.dispatcher,
      rpcClient: this.client,
      connectionConfig: this.options.connectionConfig,
    });

    this.on('iceTrickle', handleICETrickle(this.subscriber, this.publisher));
    registerEventHandlers(this);
  }

  on = this.dispatcher.on;
  off = this.dispatcher.off;

  leave = () => {
    this.subscriber?.close();

    this.publisher.getSenders().forEach((s) => {
      s.track?.stop();
      this.publisher?.removeTrack(s);
    });
    this.publisher.close();

    this.client.close();
    this.dispatcher.offAll();
  };

  join = async (videoStream?: MediaStream) => {
    const [audioEncode, audioDecode, videoEncode, videoDecode] =
      await Promise.all([
        getSenderCodecs('audio'),
        getReceiverCodecs('audio', this.subscriber),
        getSenderCodecs('video'),
        getReceiverCodecs('video', this.subscriber),
      ]);

    this.videoLayers = videoStream
      ? await findOptimalVideoLayers(videoStream)
      : defaultVideoLayers;

    this.client.send(
      RequestEvent.create({
        eventPayload: {
          oneofKind: 'join',
          join: {
            sessionId: this.client.sessionId,
            token: this.client.token,
            publish: true,
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
              layers: this.videoLayers.map((layer) => ({
                rid: layer.rid!,
                bitrate: layer.maxBitrate!,
                videoDimension: {
                  width: layer.width,
                  height: layer.height,
                },
              })),
            },
          },
        },
      }),
    );

    // FIXME OL: await until joined
    return CallState.create();
  };

  publish = (audioStream?: MediaStream, videoStream?: MediaStream) => {
    if (videoStream) {
      const videoEncodings: RTCRtpEncodingParameters[] =
        this.videoLayers && this.videoLayers.length > 0
          ? this.videoLayers
          : defaultVideoPublishEncodings;

      const [videoTrack] = videoStream.getVideoTracks();
      if (videoTrack) {
        const videoTransceiver = this.publisher.addTransceiver(videoTrack, {
          direction: 'sendonly',
          streams: [videoStream],
          sendEncodings: videoEncodings,
        });

        const codecPreferences = getPreferredCodecs('video', 'vp8');
        if ('setCodecPreferences' in videoTransceiver && codecPreferences) {
          console.log(`set codec preferences`, codecPreferences);
          videoTransceiver.setCodecPreferences(codecPreferences);
        }
      }
    }

    if (audioStream) {
      const [audioTrack] = audioStream.getAudioTracks();
      if (audioTrack) {
        this.publisher.addTransceiver(audioTrack, {
          direction: 'sendonly',
        });
      }
    }
  };

  changeInputDevice = async (
    kind: Exclude<MediaDeviceKind, 'audiooutput'>,
    deviceId: string,
    extras?: MediaTrackConstraints,
  ) => {
    if (!this.publisher) {
      // FIXME: OL: throw error instead?
      console.warn(
        `Can't change input device without publish connection established`,
        kind,
        deviceId,
      );
      return;
    }

    const constraints: MediaStreamConstraints = {};
    if (kind === 'audioinput') {
      constraints.audio = {
        ...extras,
        deviceId,
      };
    } else if (kind === 'videoinput') {
      constraints.video = {
        ...extras,
        deviceId,
      };
    }

    const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    const [newTrack] =
      kind === 'videoinput'
        ? mediaStream.getVideoTracks()
        : mediaStream.getAudioTracks();

    const senders = this.publisher.getSenders();
    const sender = senders.find((s) => s.track?.kind === newTrack.kind);
    if (!sender || !sender.track || !newTrack) {
      // FIXME: OL: maybe start publishing in this case?
      console.warn(
        `Can't find a sender for track with kind`,
        newTrack,
        kind,
        senders,
      );
      return;
    }

    sender.track.stop(); // release old track
    await sender.replaceTrack(newTrack);

    return mediaStream; // for SDK use (preview video)
  };

  getActiveInputDeviceId = (kind: MediaDeviceKind) => {
    if (!this.publisher) return;

    const trackKind =
      kind === 'audioinput'
        ? 'audio'
        : kind === 'videoinput'
        ? 'video'
        : 'unknown';
    const senders = this.publisher.getSenders();
    const sender = senders.find((s) => s.track?.kind === trackKind);
    return sender?.track?.getConstraints().deviceId as string;
  };

  getStats = async (kind: 'subscriber' | 'publisher') => {
    if (kind === 'subscriber' && this.subscriber) {
      return this.subscriber.getStats();
    } else if (kind === 'publisher' && this.publisher) {
      return this.publisher.getStats();
    } else {
      console.warn(`Can't retrieve RTC stats for`, kind);
      return undefined;
    }
  };

  updateMuteState = (trackKind: 'audio' | 'video', isMute: boolean) => {
    if (!this.publisher) return;
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

    if (!videoSender) return;

    const params = await videoSender.getParameters();
    let changed = false;
    params.encodings.forEach((enc) => {
      console.log(enc.rid, enc.active);
      // flip 'active' flag only when necessary
      const shouldEnable = enabledRids.includes(enc.rid!);
      if (shouldEnable !== enc.active) {
        enc.active = shouldEnable;
        changed = true;
      }
    });
    if (changed) {
      if (params.encodings.length === 0) {
        console.warn('No suitable video encoding quality found');
      }
      await videoSender.setParameters(params);
    }
  };

  updateSubscriptions = async (subscriptions: {
    [key: string]: VideoDimension;
  }) => {
    return this.client.updateSubscriptions(subscriptions);
  };
}
