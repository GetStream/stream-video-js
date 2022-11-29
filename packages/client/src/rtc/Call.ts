import { StreamSfuClient } from '../StreamSfuClient';
import { createSubscriber } from './subscriber';
import { createPublisher } from './publisher';
import { findOptimalVideoLayers } from './videoLayers';
import { getGenericSdp, getPreferredCodecs } from './codecs';
import { CallState, TrackType } from '../gen/video/sfu/models/models';
import { registerEventHandlers } from './callEventHandlers';
import { SfuRequest } from '../gen/video/sfu/event/events';
import { SfuEventListener } from './Dispatcher';
import { StreamVideoWriteableStateStore } from '../stateStore';
import type {
  CallOptions,
  PublishOptions,
  StatEvent,
  StatEventListener,
  StreamVideoParticipant,
  StreamVideoParticipantPatches,
  SubscriptionChanges,
} from './types';
import { debounceTime, Subject } from 'rxjs';
import { TrackSubscriptionDetails } from '../gen/video/sfu/signal_rpc/signal';
import {
  MediaStateChange,
  MediaStateChangeReason,
} from '../gen/video/coordinator/stat_v1/stat';
import { createStatsReporter, StatsReporter } from '../stats/reporter';

/**
 * A `Call` object represents the active call, the user is part of.
 */
export class Call {
  /**@deprecated use store for this data */
  currentUserId: string;

  private readonly subscriber: RTCPeerConnection;
  private readonly publisher: RTCPeerConnection;
  private readonly trackSubscriptionsSubject = new Subject<
    TrackSubscriptionDetails[]
  >();

  private statsReporter: StatsReporter;
  private joinResponseReady?: Promise<CallState | undefined>;
  private statEventListeners: StatEventListener[];

  /**
   * Use the [`StreamVideoClient.joinCall`](./StreamVideoClient.md/#joincall) method to construct a `Call` instance.
   * @param client
   * @param options
   * @param stateStore
   */
  constructor(
    private readonly client: StreamSfuClient,
    private readonly options: CallOptions,
    private readonly stateStore: StreamVideoWriteableStateStore,
  ) {
    this.currentUserId = stateStore.getCurrentValue(
      stateStore.connectedUserSubject,
    )!.name;

    this.subscriber = createSubscriber({
      rpcClient: this.client,
      connectionConfig: this.options.connectionConfig,
      onTrack: this.handleOnTrack,
    });

    this.publisher = createPublisher({
      rpcClient: this.client,
      connectionConfig: this.options.connectionConfig,
    });

    this.statEventListeners = [];
    this.statsReporter = createStatsReporter({
      subscriber: this.subscriber,
      publisher: this.publisher,
      store: stateStore,
      latencyCheckUrl: this.options.latencyCheckUrl,
      edgeName: this.options.edgeName,
    });

    const { dispatcher } = this.client;
    registerEventHandlers(this, this.stateStore, dispatcher);

    this.trackSubscriptionsSubject
      .pipe(debounceTime(1200))
      .subscribe((subscriptions) =>
        this.client.updateSubscriptions(subscriptions),
      );
  }

  /**
   * You can subscribe to WebSocket events provided by the API. To remove a subscription, call the `off` method.
   * Please note that subscribing to WebSocket events is an advanced use-case, for most use-cases it should be enough to watch for changes in the reactive state store.
   * @param eventName
   * @param fn
   * @returns
   */
  on = (eventName: string, fn: SfuEventListener) => {
    return this.client.dispatcher.on(eventName, fn);
  };

  /**
   * Remove subscription for WebSocket events that were created by the `on` method.
   * @param eventName
   * @param fn
   * @returns
   */
  off = (eventName: string, fn: SfuEventListener) => {
    return this.client.dispatcher.off(eventName, fn);
  };

  /**
   * Leave the call and stop the media streams that were published by the call.
   */
  leave = () => {
    this.statsReporter.stop();
    this.subscriber.close();
    this.publisher.getSenders().forEach((s) => {
      if (s.track) {
        s.track.stop();
        this.publishStatEvent({
          type: 'media_state_changed',
          track: s.track,
          change: MediaStateChange.ENDED,
          reason: MediaStateChangeReason.CONNECTION,
        });
      }
      this.publisher.removeTrack(s);
    });
    this.publisher.close();
    this.client.close();

    this.stateStore.setCurrentValue(
      this.stateStore.activeCallSubject,
      undefined,
    );
  };

  /**
   * Will initiate a call session with the server and return the call state.
   *
   * @returns a promise which resolves once the call join-flow has finished.
   */
  join = async () => {
    await this.client.signalReady.then((ws) => {
      this.publishStatEvent({
        type: 'participant_joined',
      });
      ws.addEventListener('close', () => {
        this.publishStatEvent({
          type: 'participant_left',
        });
      });
    });

    if (this.joinResponseReady) {
      throw new Error(`Illegal State: Already joined.`);
    }

    this.joinResponseReady = new Promise<CallState | undefined>(
      async (resolve) => {
        this.client.dispatcher.on('joinResponse', (event) => {
          if (event.eventPayload.oneofKind !== 'joinResponse') return;

          const { callState } = event.eventPayload.joinResponse;
          const currentParticipants = callState?.participants || [];
          this.stateStore.setCurrentValue(
            this.stateStore.activeCallAllParticipantsSubject,
            currentParticipants.map<StreamVideoParticipant>((participant) => {
              if (participant.sessionId === this.client.sessionId) {
                const localParticipant = participant as StreamVideoParticipant;
                localParticipant.isLoggedInUser = true;
              }
              return participant;
            }),
          );
          this.client.keepAlive();
          this.stateStore.setCurrentValue(
            this.stateStore.activeCallSubject,
            this,
          );

          resolve(callState); // expose call state
        });

        const genericSdp = await getGenericSdp('recvonly');
        this.client.send(
          SfuRequest.create({
            requestPayload: {
              oneofKind: 'joinRequest',
              joinRequest: {
                sessionId: this.client.sessionId,
                token: this.client.token,
                subscriberSdp: genericSdp || '',
              },
            },
          }),
        );
      },
    );

    return this.joinResponseReady;
  };

  /**
   * Starts publishing the given video stream to the call.
   * The stream will be stopped if the user changes an input device, or if the user leaves the call.
   *
   * @param videoStream the video stream to publish.
   * @param opts the options to use when publishing the stream.
   */
  publishVideoStream = async (
    videoStream: MediaStream,
    opts: PublishOptions = {},
  ) => {
    await this.assertCallJoined();
    const [videoTrack] = videoStream.getVideoTracks();
    if (!videoTrack) {
      return console.error(`There is no video track in the stream.`);
    }

    const videoEncodings = findOptimalVideoLayers(videoTrack);
    const videoTransceiver = this.publisher.addTransceiver(videoTrack, {
      direction: 'sendonly',
      streams: [videoStream],
      sendEncodings: videoEncodings,
    });

    const codecPreferences = getPreferredCodecs(
      'video',
      opts.preferredCodec || 'vp8',
    );
    // @ts-ignore
    if ('setCodecPreferences' in videoTransceiver && codecPreferences) {
      console.log(`set codec preferences`, codecPreferences);
      videoTransceiver.setCodecPreferences(codecPreferences);
    }

    this.stateStore.updateParticipant(this.client.sessionId, {
      videoStream,
      videoDeviceId: this.getActiveInputDeviceId('videoinput'),
    });

    this.publishStatEvent({
      type: 'media_state_changed',
      track: videoTrack,
      change: MediaStateChange.STARTED,
      reason: MediaStateChangeReason.CONNECTION,
    });
  };

  /**
   * Starts publishing the given audio stream to the call.
   * The stream will be stopped if the user changes an input device, or if the user leaves the call.
   *
   * @param audioStream the audio stream to publish.
   */
  publishAudioStream = async (audioStream: MediaStream) => {
    await this.assertCallJoined();
    const [audioTrack] = audioStream.getAudioTracks();
    if (!audioTrack) {
      return console.error(`There is no audio track in the stream`);
    }

    this.publisher.addTransceiver(audioTrack, {
      direction: 'sendonly',
    });

    this.stateStore.updateParticipant(this.client.sessionId, {
      audioStream,
      audioDeviceId: this.getActiveInputDeviceId('audioinput'),
    });

    this.publishStatEvent({
      type: 'media_state_changed',
      track: audioTrack,
      change: MediaStateChange.STARTED,
      reason: MediaStateChangeReason.CONNECTION,
    });
  };

  /**
   * Starts publishing the given screen-share stream to the call.
   *
   * @param screenShareStream the screen-share stream to publish.
   */
  publishScreenShareStream = async (screenShareStream: MediaStream) => {
    await this.assertCallJoined();
    const [screenShareTrack] = screenShareStream.getVideoTracks();
    if (!screenShareTrack) {
      return console.error(`There is no video track in the stream`);
    }

    const transceiver = this.publisher.addTransceiver(screenShareTrack, {
      direction: 'sendonly',
      streams: [screenShareStream],
      // sendEncodings
    });
    // @ts-ignore FIXME: OL: this is a hack
    transceiver._kind = 'screen';

    this.stateStore.updateParticipant(this.client.sessionId, {
      screenShareStream,
    });

    this.publishStatEvent({
      type: 'media_state_changed',
      track: screenShareTrack,
      change: MediaStateChange.STARTED,
      reason: MediaStateChangeReason.CONNECTION,
    });
  };

  // TODO OL: add stream unpublish methods

  /**
   * A method for switching an input device.
   * @param kind
   * @param deviceId
   * @param extras
   * @returns
   */
  replaceMediaStream = async (
    kind: Exclude<MediaDeviceKind, 'audiooutput'>,
    mediaStream: MediaStream,
  ) => {
    if (!this.publisher) {
      // FIXME: OL: throw error instead?
      console.warn(
        `Can't change input device without publish connection established`,
        kind,
      );
      return;
    }

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

    // const localParticipant = this.participants.find(
    //   (p) => p.sessionId === this.client.sessionId,
    // );
    // const muteState = !(kind === 'audioinput'
    //   ? localParticipant?.audio
    //   : localParticipant?.video);
    const muteState = false; // FIXME: OL: this is a hack
    this.updateMuteState(kind === 'audioinput' ? 'audio' : 'video', muteState);

    this.stateStore.updateParticipant(this.client.sessionId, {
      // FIXME: screen share?
      [kind === 'audioinput' ? 'audioStream' : 'videoStream']: mediaStream,
      [kind === 'audioinput' ? 'audioDeviceId' : 'videoDeviceId']:
        this.getActiveInputDeviceId(kind),
    });

    return mediaStream; // for SDK use (preview video)
  };

  /**
   * Update track subscription configuration for one or more participants.
   * You have to create a subscription for each participant you want to receive any kind of track.
   *
   * @param changes the list of subscription changes to do.
   */
  updateSubscriptionsPartial = (changes: SubscriptionChanges) => {
    const participants = this.stateStore.updateParticipants(
      Object.entries(changes).reduce<StreamVideoParticipantPatches>(
        (acc, [sessionId, change]) => {
          acc[sessionId] = {
            videoDimension: change.videoDimension,
          };
          return acc;
        },
        {},
      ),
    );

    if (participants) {
      this.updateSubscriptions(participants);
    }
  };

  private updateSubscriptions = (participants: StreamVideoParticipant[]) => {
    const subscriptions: TrackSubscriptionDetails[] = [];
    participants.forEach((p) => {
      if (!p.isLoggedInUser) {
        // if (p.videoDimension && p.publishedTracks.includes(TrackKind.VIDEO)) {
        subscriptions.push({
          userId: p.userId,
          sessionId: p.sessionId,
          trackType: TrackType.VIDEO,
          dimension: p.videoDimension,
        });
        // }
        // if (p.publishedTracks.includes(TrackKind.AUDIO)) {
        subscriptions.push({
          userId: p.userId,
          sessionId: p.sessionId,
          trackType: TrackType.AUDIO,
        });
        // }
        // if (p.publishedTracks.includes(TrackKind.SCREEN_SHARE)) {
        subscriptions.push({
          userId: p.userId,
          sessionId: p.sessionId,
          trackType: TrackType.SCREEN_SHARE,
          dimension: {
            width: 1280,
            height: 720,
          },
        });
        // }
      }
    });
    // schedule update
    this.trackSubscriptionsSubject.next(subscriptions);
  };

  /**
   * TODO: this should be part of the state store.
   * @param kind
   * @param selector
   * @returns
   */
  getStats = async (
    kind: 'subscriber' | 'publisher',
    selector?: MediaStreamTrack,
  ) => {
    return this.statsReporter.getRawStatsForTrack(kind, selector);
  };

  /**
   * Will enhance the reported stats with additional participant-specific information.
   * This is usually helpful when detailed stats for a specific participant are needed.
   *
   * @param sessionId the sessionId to start reporting for.
   */
  startReportingStatsFor = (sessionId: string) => {
    return this.statsReporter.startReportingStatsFor(sessionId);
  };

  /**
   * Opposite of `startReportingStatsFor`.
   * Will turn off stats reporting for a specific participant.
   *
   * @param sessionId the sessionId to stop reporting for.
   */
  stopReportingStatsFor = (sessionId: string) => {
    return this.statsReporter.stopReportingStatsFor(sessionId);
  };

  onStatEvent = (fn: StatEventListener) => {
    this.statEventListeners.push(fn);
  };
  offStatEvent = (fn: StatEventListener) => {
    this.statEventListeners = this.statEventListeners.filter((f) => f !== fn);
  };
  private publishStatEvent = (event: StatEvent) => {
    this.statEventListeners.forEach((fn) => fn(event));
  };

  /**
   * Mute/unmute the video/audio stream of the current user.
   * @param trackKind
   * @param isMute
   * @returns
   */
  updateMuteState = (trackKind: 'audio' | 'video', isMute: boolean) => {
    if (!this.publisher) return;
    const senders = this.publisher.getSenders();
    const sender = senders.find((s) => s.track?.kind === trackKind);
    if (sender && sender.track) {
      sender.track.enabled = !isMute;

      this.publishStatEvent({
        type: 'media_state_changed',
        track: sender.track,
        change: isMute ? MediaStateChange.STARTED : MediaStateChange.ENDED,
        reason: MediaStateChangeReason.MUTE,
      });

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

  private get participants() {
    return this.stateStore.getCurrentValue(
      this.stateStore.activeCallAllParticipantsSubject,
    );
  }

  private handleOnTrack = (e: RTCTrackEvent) => {
    const [primaryStream] = e.streams;
    // TODO OL: extract track kind
    const [trackId, trackType] = primaryStream.id.split(':');
    console.log(`Got remote ${trackType} track:`, e.track);
    const participantToUpdate = this.participants.find(
      (p) => p.trackLookupPrefix === trackId,
    );
    if (!participantToUpdate) {
      console.warn('Received track for unknown participant', trackId, e);
      return;
    }

    e.track.addEventListener('mute', () => {
      console.log(
        `Track muted:`,
        participantToUpdate.userId,
        `${trackType}:${trackId}`,
        e.track,
      );
    });

    e.track.addEventListener('unmute', () => {
      console.log(
        `Track unmuted:`,
        participantToUpdate.userId,
        `${trackType}:${trackId}`,
        e.track,
      );
    });

    e.track.addEventListener('ended', () => {
      console.log(
        `Track ended:`,
        participantToUpdate.userId,
        `${trackType}:${trackId}`,
        e.track,
      );
    });

    const key: keyof StreamVideoParticipant =
      e.track.kind === 'audio'
        ? 'audioStream'
        : trackType === 'TRACK_TYPE_SCREEN_SHARE'
        ? 'screenShareStream'
        : 'videoStream';

    this.stateStore.updateParticipant(participantToUpdate.sessionId, {
      [key]: primaryStream,
    });
  };

  private getActiveInputDeviceId = (kind: MediaDeviceKind) => {
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

  private assertCallJoined = async () => {
    if (!this.joinResponseReady) {
      throw new Error(
        `Illegal State: Can't publish. Please join the call first`,
      );
    }
    // callee should wait until we get a JoinResponse from the SFU,
    // otherwise we risk breaking the ICETrickle flow.
    return this.joinResponseReady;
  };
}
