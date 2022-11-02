import { createSubscriber } from './subscriber';
import {
  defaultVideoLayers,
  findOptimalVideoLayers,
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
import { CallState, VideoDimension } from '../gen/video/sfu/models/models';
import { registerEventHandlers } from './callEventHandlers';
import { SfuRequest } from '../gen/video/sfu/event/events';
import { SfuEventListener } from './Dispatcher';
import { StreamVideoWriteableStateStore } from '../stateStore';
import { VideoDimensionChange } from './types';

export type CallOptions = {
  connectionConfig: RTCConfiguration | undefined;
};

export class Call {
  /**@deprecated use store for this data */
  currentUserId: string;

  private videoLayers?: OptimalVideoLayer[];
  readonly subscriber: RTCPeerConnection;
  readonly publisher: RTCPeerConnection;

  constructor(
    private readonly client: StreamSfuClient,
    private readonly options: CallOptions,
    private readonly stateStore: StreamVideoWriteableStateStore,
  ) {
    this.currentUserId = stateStore.getCurrentValue(
      stateStore.connectedUserSubject,
    )!.name;
    const { dispatcher, iceTrickleBuffer } = this.client;
    this.subscriber = createSubscriber({
      rpcClient: this.client,

      // FIXME: don't do this
      dispatcher: dispatcher,
      connectionConfig: this.options.connectionConfig,
      onTrack: this.handleOnTrack,
      candidates: iceTrickleBuffer.subscriberCandidates,
    });

    this.publisher = createPublisher({
      rpcClient: this.client,
      connectionConfig: this.options.connectionConfig,
      candidates: iceTrickleBuffer.publisherCandidates,
    });

    registerEventHandlers(this, this.stateStore, dispatcher);
  }

  // FIXME: change the call-sites in the SDK
  /**
   * @deprecated use `dispatcher.on`
   */
  on = (eventName: string, fn: SfuEventListener) => {
    return this.client.dispatcher.on(eventName, fn);
  };

  // FIXME: change the call-sites in the SDK
  /**
   * @deprecated use `dispatcher.off`
   */
  off = (eventName: string, fn: SfuEventListener) => {
    return this.client.dispatcher.off(eventName, fn);
  };

  leave = () => {
    this.subscriber.close();

    this.publisher.getSenders().forEach((s) => {
      s.track?.stop();
      this.publisher.removeTrack(s);
    });
    this.publisher.close();
    this.client.close();

    this.stateStore.activeCallSubject.next(undefined);
  };

  join = async (videoStream?: MediaStream, audioStream?: MediaStream) => {
    await this.client.signalReady;

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

    // FIXME: make it nicer
    return new Promise<CallState | undefined>((resolve) => {
      this.client.dispatcher.on('joinResponse', (event) => {
        if (event.eventPayload.oneofKind === 'joinResponse') {
          const callState = event.eventPayload.joinResponse.callState;
          this.stateStore.activeCallSubject.next(this);
          this.participants.push(...(callState?.participants || []));
          const ownParticipant = this.localParticipant;
          if (ownParticipant) {
            ownParticipant.isLoggedInUser = true;
            ownParticipant.audioTrack = audioStream;
            ownParticipant.videoTrack = videoStream;
          }
          this.stateStore.activeCallParticipantsSubject.next([
            ...this.participants,
          ]);
          this.client.keepAlive();
          resolve(callState);
        }
      });
    });
  };

  publish = (audioStream?: MediaStream, videoStream?: MediaStream) => {
    if (videoStream) {
      const videoEncodings: RTCRtpEncodingParameters[] =
        this.videoLayers && this.videoLayers.length > 0
          ? this.videoLayers
          : defaultVideoPublishEncodings;

      const [videoTrack] = videoStream.getVideoTracks();
      if (videoTrack) {
        const videoTransceiver = this.publisher?.addTransceiver(videoTrack, {
          direction: 'sendonly',
          streams: [videoStream],
          sendEncodings: videoEncodings,
        });

        const codecPreferences = getPreferredCodecs('video', 'vp8');
        // @ts-ignore
        if ('setCodecPreferences' in videoTransceiver && codecPreferences) {
          console.log(`set codec preferences`, codecPreferences);
          videoTransceiver.setCodecPreferences(codecPreferences);
        }
      }

      if (this.localParticipant) {
        this.localParticipant.videoTrack = videoStream;
        this.stateStore.activeCallParticipantsSubject.next([
          ...this.participants,
        ]);
      }
    }

    if (audioStream) {
      const [audioTrack] = audioStream.getAudioTracks();
      if (audioTrack) {
        this.publisher?.addTransceiver(audioTrack, {
          direction: 'sendonly',
        });
      }

      if (this.localParticipant) {
        this.localParticipant.audioTrack = audioStream;
        this.stateStore.activeCallParticipantsSubject.next([
          ...this.participants,
        ]);
      }
    }
  };

  updateVideoDimensions = (
    changes: VideoDimensionChange[],
    includeCurrentUser: boolean = false,
  ) => {
    if (changes.length === 0) {
      return;
    }
    changes.forEach((change) => {
      const participantToUpdate = this.findParticipant(change.participant);
      if (!participantToUpdate) {
        return;
      }
      participantToUpdate.videoDimension = change.videoDimension;
      this.stateStore.activeCallParticipantsSubject.next([
        ...this.participants,
      ]);
    });

    return this.updateSubscriptions(includeCurrentUser);
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

  getStats = async (
    kind: 'subscriber' | 'publisher',
    selector?: MediaStreamTrack,
  ) => {
    if (kind === 'subscriber' && this.subscriber) {
      return this.subscriber.getStats(selector);
    } else if (kind === 'publisher' && this.publisher) {
      return this.publisher.getStats(selector);
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

  private updateSubscriptions = async (includeCurrentUser: boolean) => {
    const subscriptions: { [key: string]: VideoDimension } = {};
    this.participants.forEach((p) => {
      if (
        includeCurrentUser ||
        (p.user?.id !== this.currentUserId &&
          this.client.sessionId !== p.sessionId)
      ) {
        subscriptions[p.user!.id] = p.videoDimension || { height: 0, width: 0 };
      }
    });
    return this.client.updateSubscriptions(subscriptions);
  };

  private get participants() {
    return this.stateStore.getCurrentValue(
      this.stateStore.activeCallParticipantsSubject,
    );
  }

  private findParticipant(participant: {
    user?: { id: string };
    sessionId: string;
  }) {
    return this.participants.find(
      (p) =>
        p.user?.id === participant.user?.id &&
        p.sessionId === participant.sessionId,
    );
  }

  private get localParticipant() {
    return this.findParticipant({
      user: { id: this.currentUserId },
      sessionId: this.client.sessionId,
    });
  }

  private handleOnTrack = (e: RTCTrackEvent) => {
    console.log('Got remote track:', e.track);
    const [primaryStream] = e.streams;
    const [trackId] = primaryStream.id.split(':');
    const participant = this.participants.find(
      (p) => p.trackLookupPrefix === trackId,
    );
    if (!participant) {
      console.warn('Received track from not existing participant', trackId);
      return;
    }
    if (e.track.kind === 'video') {
      participant.videoTrack = primaryStream;
      this.stateStore.activeCallParticipantsSubject.next([
        ...this.participants,
      ]);
    } else if (e.track.kind === 'audio') {
      participant.audioTrack = primaryStream;
      this.stateStore.activeCallParticipantsSubject.next([
        ...this.participants,
      ]);
    }
  };
}
