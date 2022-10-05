import { createSubscriber } from './subscriber';
import { createSignalChannel } from './signal';
import {
  findOptimalVideoLayers,
  defaultVideoLayers,
  OptimalVideoLayer,
} from './videoLayers';
import { Client } from '../rpc';
import {
  defaultVideoPublishEncodings,
  getPreferredCodecs,
  getReceiverCodecs,
  getSenderCodecs,
} from './codecs';
import { createPublisher } from './publisher';
import { Dispatcher } from './Dispatcher';
import { VideoDimension } from '../gen/sfu_models/models';
import { registerEventHandlers } from './callEventHandlers';

export type CallOptions = {
  connectionConfig: RTCConfiguration | undefined;
};

export class Call {
  private readonly dispatcher = new Dispatcher();
  private readonly client: Client;
  private readonly options: CallOptions;

  private videoLayers?: OptimalVideoLayer[];
  private subscriber?: RTCPeerConnection;
  private publisher?: RTCPeerConnection;

  // FIXME: OL: convert to regular event
  handleOnTrack?: (e: RTCTrackEvent) => void;

  constructor(client: Client, options: CallOptions) {
    this.client = client;
    this.options = options;
    registerEventHandlers(this);
  }

  on = this.dispatcher.on;
  off = this.dispatcher.off;

  leave = () => {
    this.subscriber?.close();
    this.subscriber = undefined;

    this.publisher?.getSenders().forEach((s) => {
      this.publisher?.removeTrack(s);
    });
    this.publisher?.close();
    this.publisher = undefined;

    this.dispatcher.offAll();
  };

  join = async (videoStream?: MediaStream) => {
    if (this.subscriber) {
      this.subscriber.close();
      this.subscriber = undefined;
    }
    console.log(`Setting up subscriber`);

    this.subscriber = createSubscriber({
      rpcClient: this.client,
      dispatcher: this.dispatcher,
      connectionConfig: this.options.connectionConfig,
      onTrack: (e) => {
        console.log('Got remote track:', e.track);
        this.handleOnTrack?.(e);
      },
    });

    createSignalChannel({
      label: 'signalling',
      pc: this.subscriber,
      onMessage: (message) => {
        console.log('Received event', message.eventPayload);
        this.dispatcher.dispatch(message);
      },
    });

    const offer = await this.subscriber.createOffer();
    if (!offer.sdp) {
      throw new Error(`Failed to configure protocol, null SDP`);
    }
    await this.subscriber.setLocalDescription(offer);

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

    const { response: sfu } = await this.client.rpc.join({
      sessionId: this.client.sessionId,
      subscriberSdpOffer: offer.sdp,
      // FIXME OL: encode parameters and video layers should be announced when
      // initiating "publish" operation
      codecSettings: {
        audio: {
          encode: audioEncode,
          decode: audioDecode,
        },
        video: {
          encode: videoEncode,
          decode: videoDecode,
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
    });

    await this.subscriber.setRemoteDescription({
      type: 'answer',
      sdp: sfu.sdp,
    });

    return sfu.callState;
  };

  publish = (audioStream?: MediaStream, videoStream?: MediaStream) => {
    if (this.publisher) {
      this.publisher.close();
      this.publisher = undefined;
    }
    console.log(`Setting up publisher`);

    this.publisher = createPublisher({
      rpcClient: this.client,
      connectionConfig: this.options.connectionConfig,
    });

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

    const senders = this.publisher.getSenders();
    const sender = senders.find((s) => s.track?.kind === kind);
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

  updatePublishQuality = async (enabledRids: string[]) => {
    console.log('Updating publish quality, qualities requested by SFU:', enabledRids)
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
