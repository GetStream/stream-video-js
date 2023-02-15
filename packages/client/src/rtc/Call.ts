import { StreamSfuClient } from '../StreamSfuClient';
import { createSubscriber } from './subscriber';
import { Publisher } from './publisher';
import { getGenericSdp } from './codecs';
import { CallState, TrackType } from '../gen/video/sfu/models/models';
import { registerEventHandlers } from './callEventHandlers';
import { SfuEventListener } from './Dispatcher';
import { StreamVideoWriteableStateStore } from '../store';
import { trackTypeToParticipantStreamKey } from './helpers/tracks';
import type {
  CallOptions,
  PublishOptions,
  StreamVideoParticipant,
  StreamVideoParticipantPatches,
  SubscriptionChanges,
} from './types';
import {
  BehaviorSubject,
  debounceTime,
  filter,
  Subject,
  takeWhile,
} from 'rxjs';
import { TrackSubscriptionDetails } from '../gen/video/sfu/signal_rpc/signal';
import {
  createStatsReporter,
  StatsReporter,
} from '../stats/state-store-stats-reporter';
import { Batcher } from '../Batcher';
import { CallMetadata } from './CallMetadata';

/**
 * A `Call` object represents the active call the user is part of. It's not enough to have a `Call` instance, you will also need to call the [`join`](#join) method.
 */
export class Call {
  /**
   * Contains metadata about the call, for example who created the call. You can also extract the call ID from this object, which you'll need for certain API calls (for example to start a recording).
   */
  data: CallMetadata;
  private readonly subscriber: RTCPeerConnection;
  private readonly publisher: Publisher;
  private readonly trackSubscriptionsSubject = new Subject<
    TrackSubscriptionDetails[]
  >();

  private statsReporter: StatsReporter;
  private joined$ = new BehaviorSubject<boolean>(false);

  /**
   * Don't call the constructor directly, use the [`StreamVideoClient.joinCall`](./StreamVideoClient.md/#joincall) method to construct a `Call` instance.
   * @param client
   * @param data
   * @param options
   * @param stateStore
   * @param userBatcher
   */
  constructor(
    data: CallMetadata,
    private readonly client: StreamSfuClient,
    private readonly options: CallOptions,
    private readonly stateStore: StreamVideoWriteableStateStore,
    private readonly userBatcher: Batcher<string>,
  ) {
    this.data = data;
    this.subscriber = createSubscriber({
      rpcClient: this.client,
      connectionConfig: this.options.connectionConfig,
      onTrack: this.handleOnTrack,
    });

    this.publisher = new Publisher({
      rpcClient: this.client,
      connectionConfig: this.options.connectionConfig,
    });

    this.statsReporter = createStatsReporter({
      subscriber: this.subscriber,
      publisher: this.publisher,
      store: stateStore,
      edgeName: this.options.edgeName,
    });

    const { dispatcher } = this.client;
    registerEventHandlers(this, this.stateStore, dispatcher, this.userBatcher);

    this.trackSubscriptionsSubject
      .pipe(debounceTime(1200))
      .subscribe((subscriptions) =>
        this.client.updateSubscriptions(subscriptions),
      );
  }

  /**
   * You can subscribe to WebSocket events provided by the API. To remove a subscription, call the `off` method.
   * Please note that subscribing to WebSocket events is an advanced use-case, for most use-cases it should be enough to watch for changes in the [reactive state store](./StreamVideoClient.md/#readonlystatestore).
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
    if (!this.joined$.getValue()) {
      throw new Error('Cannot leave call that has already been left.');
    }
    this.joined$.next(false);

    this.statsReporter.stop();
    this.subscriber.close();
    this.userBatcher.clearBatch();

    this.publisher.stopPublishing();
    this.client.close();

    this.stateStore.setCurrentValue(
      this.stateStore.activeCallSubject,
      undefined,
    );
  };

  /**
   * Will initiate a call session with the server and return the call state. Don't call this method directly, use the [`StreamVideoClient.joinCall`](./StreamVideoClient.md/#joincall) method that takes care of this operation.
   *
   * If the join was successful the [`activeCall$` state variable](./StreamVideClient/#readonlystatestore) will be set
   *
   * @returns a promise which resolves once the call join-flow has finished.
   */
  join = async () => {
    if (this.joined$.getValue()) {
      throw new Error(`Illegal State: Already joined.`);
    }

    const joinResponseReady = new Promise<CallState | undefined>(
      async (resolve) => {
        this.client.dispatcher.on('joinResponse', (event) => {
          if (event.eventPayload.oneofKind !== 'joinResponse') return;

          const { callState } = event.eventPayload.joinResponse;
          const currentParticipants = callState?.participants || [];

          // get user data from the call envelope (invited participants)
          const { users } = this.data;

          // request user data for uninvited users
          currentParticipants.forEach((participant) => {
            const userData = users[participant.userId];
            if (!userData) this.userBatcher.addToBatch(participant.userId);
          });

          this.stateStore.setCurrentValue(
            this.stateStore.participantsSubject,
            currentParticipants.map<StreamVideoParticipant>((participant) => ({
              ...participant,
              isLoggedInUser: participant.sessionId === this.client.sessionId,
              user: users[participant.userId],
            })),
          );

          this.client.keepAlive();
          this.joined$.next(true);
          resolve(callState); // expose call state
        });

        const genericSdp = await getGenericSdp('recvonly');
        await this.client.join({
          subscriberSdp: genericSdp || '',
        });
      },
    );

    return joinResponseReady;
  };

  /**
   * Starts publishing the given video stream to the call.
   * The stream will be stopped if the user changes an input device, or if the user leaves the call.
   *
   * If the method was successful the [`activeCall$` state variable](./StreamVideClient/#readonlystatestore) will be cleared
   *
   * Consecutive calls to this method will replace the previously published stream.
   * The previous video stream will be stopped.
   *
   * @angular It's recommended to use the [`InCallDeviceManagerService`](./InCallDeviceManagerService.md) that takes care of this operation for you.
   *
   * @param videoStream the video stream to publish.
   * @param opts the options to use when publishing the stream.
   */
  publishVideoStream = async (
    videoStream: MediaStream,
    opts: PublishOptions = {},
  ) => {
    // we should wait until we get a JoinResponse from the SFU,
    // otherwise we risk breaking the ICETrickle flow.
    await this.assertCallJoined();
    const [videoTrack] = videoStream.getVideoTracks();
    if (!videoTrack) {
      return console.error(`There is no video track in the stream.`);
    }

    const trackType = TrackType.VIDEO;

    try {
      await this.publisher.publishStream(
        videoStream,
        videoTrack,
        trackType,
        opts,
      );
      await this.client.updateMuteState(trackType, false);
    } catch (e) {
      throw e;
    }

    this.stateStore.updateParticipant(this.client.sessionId, (p) => ({
      videoStream,
      videoDeviceId: videoTrack.getSettings().deviceId,
      publishedTracks: p.publishedTracks.includes(trackType)
        ? p.publishedTracks
        : [...p.publishedTracks, trackType],
    }));
  };

  /**
   * Starts publishing the given audio stream to the call.
   * The stream will be stopped if the user changes an input device, or if the user leaves the call.
   *
   * Consecutive calls to this method will replace the audio stream that is currently being published.
   * The previous audio stream will be stopped.
   *
   * @angular It's recommended to use the [`InCallDeviceManagerService`](./InCallDeviceManagerService.md) that takes care of this operation for you.
   *
   * @param audioStream the audio stream to publish.
   */
  publishAudioStream = async (audioStream: MediaStream) => {
    // we should wait until we get a JoinResponse from the SFU,
    // otherwise we risk breaking the ICETrickle flow.
    await this.assertCallJoined();
    const [audioTrack] = audioStream.getAudioTracks();
    if (!audioTrack) {
      return console.error(`There is no audio track in the stream`);
    }

    const trackType = TrackType.AUDIO;
    try {
      await this.publisher.publishStream(audioStream, audioTrack, trackType);
      await this.client.updateMuteState(trackType, false);
    } catch (e) {
      throw e;
    }

    this.stateStore.updateParticipant(this.client.sessionId, (p) => ({
      audioStream,
      audioDeviceId: audioTrack.getSettings().deviceId,
      publishedTracks: p.publishedTracks.includes(trackType)
        ? p.publishedTracks
        : [...p.publishedTracks, trackType],
    }));
  };

  /**
   * Starts publishing the given screen-share stream to the call.
   *
   * Consecutive calls to this method will replace the previous screen-share stream.
   * The previous screen-share stream will be stopped.
   *
   * @angular It's recommended to use the [`InCallDeviceManagerService`](./InCallDeviceManagerService.md) that takes care of this operation for you.
   *
   * @param screenShareStream the screen-share stream to publish.
   */
  publishScreenShareStream = async (screenShareStream: MediaStream) => {
    // we should wait until we get a JoinResponse from the SFU,
    // otherwise we risk breaking the ICETrickle flow.
    await this.assertCallJoined();
    const [screenShareTrack] = screenShareStream.getVideoTracks();
    if (!screenShareTrack) {
      return console.error(`There is no video track in the stream`);
    }

    // fires when browser's native 'Stop Sharing button' is clicked
    const onTrackEnded = () => this.stopPublish(trackType);
    screenShareTrack.addEventListener('ended', onTrackEnded);

    const trackType = TrackType.SCREEN_SHARE;
    try {
      await this.publisher.publishStream(
        screenShareStream,
        screenShareTrack,
        trackType,
      );
      await this.client.updateMuteState(trackType, false);
    } catch (e) {
      throw e;
    }

    this.stateStore.updateParticipant(this.client.sessionId, (p) => ({
      screenShareStream,
      publishedTracks: p.publishedTracks.includes(trackType)
        ? p.publishedTracks
        : [...p.publishedTracks, trackType],
    }));
  };

  /**
   * Stops publishing the given track type to the call, if it is currently being published.
   * Underlying track will be stopped and removed from the publisher.
   *
   * The `audioDeviceId`/`videoDeviceId` property of the [`localParticipant$`](./StreamVideoClient.md/#readonlystatestore) won't be updated, you can do that by calling the [`setAudioDevice`](#setaudiodevice)/[`setVideoDevice`](#setvideodevice) method.
   *
   * @angular It's recommended to use the [`InCallDeviceManagerService`](./InCallDeviceManagerService.md) that takes care of this operation for you.
   *
   * @param trackType the track type to stop publishing.
   */
  stopPublish = async (trackType: TrackType) => {
    console.log(`stopPublish`, TrackType[trackType]);
    const wasPublishing = this.publisher.unpublishStream(trackType);
    if (wasPublishing) {
      await this.client.updateMuteState(trackType, true);

      const audioOrVideoOrScreenShareStream =
        trackTypeToParticipantStreamKey(trackType);
      if (audioOrVideoOrScreenShareStream) {
        this.stateStore.updateParticipant(this.client.sessionId, (p) => ({
          publishedTracks: p.publishedTracks.filter((t) => t !== trackType),
          [audioOrVideoOrScreenShareStream]: undefined,
        }));
      }
    }
  };

  /**
   * Update track subscription configuration for one or more participants.
   * You have to create a subscription for each participant for all the different kinds of tracks you want to receive.
   * You can only subscribe for tracks after the participant started publishing the given kind of track.
   *
   * @param kind the kind of subscription to update.
   * @param changes the list of subscription changes to do.
   */
  updateSubscriptionsPartial = (
    kind: 'video' | 'screen',
    changes: SubscriptionChanges,
  ) => {
    const participants = this.stateStore.updateParticipants(
      Object.entries(changes).reduce<StreamVideoParticipantPatches>(
        (acc, [sessionId, change]) => {
          const prop: keyof StreamVideoParticipant | undefined =
            kind === 'video'
              ? 'videoDimension'
              : kind === 'screen'
              ? 'screenShareDimension'
              : undefined;
          if (prop) {
            acc[sessionId] = {
              [prop]: change.dimension,
            };
          }
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
      if (p.isLoggedInUser) return;
      if (p.videoDimension && p.publishedTracks.includes(TrackType.VIDEO)) {
        subscriptions.push({
          userId: p.userId,
          sessionId: p.sessionId,
          trackType: TrackType.VIDEO,
          dimension: p.videoDimension,
        });
      }
      if (p.publishedTracks.includes(TrackType.AUDIO)) {
        subscriptions.push({
          userId: p.userId,
          sessionId: p.sessionId,
          trackType: TrackType.AUDIO,
        });
      }
      if (
        p.screenShareDimension &&
        p.publishedTracks.includes(TrackType.SCREEN_SHARE)
      ) {
        subscriptions.push({
          userId: p.userId,
          sessionId: p.sessionId,
          trackType: TrackType.SCREEN_SHARE,
          dimension: p.screenShareDimension,
        });
      }
    });
    // schedule update
    this.trackSubscriptionsSubject.next(subscriptions);
  };

  /**
   * @deprecated use the `callStatsReport$` state [store variable](./StreamVideoClient.md/#readonlystatestore) instead
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
   * Will enhance the reported stats with additional participant-specific information (`callStatsReport$` state [store variable](./StreamVideoClient.md/#readonlystatestore)).
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

  /**
   * Sets the used audio output device (`audioOutputDeviceId` of the [`localParticipant$`](./StreamVideoClient.md/#readonlystatestore).
   *
   * This method only stores the selection, if you're using custom UI components, you'll have to implement the audio switching, for more information see: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/sinkId.
   *
   * @angular It's recommended to use the [`InCallDeviceManagerService`](./InCallDeviceManagerService.md) that takes care of this operation for you.
   *
   * @param deviceId the selected device, `undefined` means the user wants to use the system's default audio output
   */
  setAudioOutputDevice = (deviceId?: string) => {
    this.stateStore.updateParticipant(this.client.sessionId, {
      audioOutputDeviceId: deviceId,
    });
  };

  /**
   * Sets the `audioDeviceId` property of the [`localParticipant$`](./StreamVideoClient.md/#readonlystatestore)).
   *
   * This method only stores the selection, if you want to start publishing a media stream call the [`publishAudioStream` method](#publishaudiostream) that will set `audioDeviceId` as well.
   *
   * @angular It's recommended to use the [`InCallDeviceManagerService`](./InCallDeviceManagerService.md) that takes care of this operation for you.
   *
   * @param deviceId the selected device, pass `undefined` to clear the device selection
   */
  setAudioDevice = (deviceId?: string) => {
    this.stateStore.updateParticipant(this.client.sessionId, {
      audioDeviceId: deviceId,
    });
  };

  /**
   * Sets the `videoDeviceId` property of the [`localParticipant$`](./StreamVideoClient.md/#readonlystatestore).
   *
   * This method only stores the selection, if you want to start publishing a media stream call the [`publishVideoStream` method](#publishvideostream) that will set `videoDeviceId` as well.
   *
   * @angular It's recommended to use the [`InCallDeviceManagerService`](./InCallDeviceManagerService.md) that takes care of this operation for you.
   *
   * @param deviceId the selected device, pass `undefined` to clear the device selection
   */
  setVideoDevice = (deviceId?: string) => {
    this.stateStore.updateParticipant(this.client.sessionId, {
      videoDeviceId: deviceId,
    });
  };

  /**
   * @internal
   * @param enabledRids
   * @returns
   */
  updatePublishQuality = async (enabledRids: string[]) => {
    this.publisher.updateVideoPublishQuality(enabledRids);
  };

  private get participants() {
    return this.stateStore.getCurrentValue(this.stateStore.participantsSubject);
  }

  private handleOnTrack = (e: RTCTrackEvent) => {
    const [primaryStream] = e.streams;
    // example: `e3f6aaf8-b03d-4911-be36-83f47d37a76a:TRACK_TYPE_VIDEO`
    const [trackId, trackType] = primaryStream.id.split(':');
    console.log(`Got remote ${trackType} track:`, e.track);
    const participantToUpdate = this.participants.find(
      (p) => p.trackLookupPrefix === trackId,
    );
    if (!participantToUpdate) {
      console.error('Received track for unknown participant', trackId, e);
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

    const streamKindProp = (
      {
        TRACK_TYPE_AUDIO: 'audioStream',
        TRACK_TYPE_VIDEO: 'videoStream',
        TRACK_TYPE_SCREEN_SHARE: 'screenShareStream',
      } as const
    )[trackType];

    if (!streamKindProp) {
      console.error('Unknown track type', trackType);
      return;
    }
    const previousStream = participantToUpdate[streamKindProp];
    if (previousStream) {
      console.log(`Cleaning up previous remote tracks`, e.track.kind);
      previousStream.getTracks().forEach((t) => {
        t.stop();
        previousStream.removeTrack(t);
      });
    }
    this.stateStore.updateParticipant(participantToUpdate.sessionId, {
      [streamKindProp]: primaryStream,
    });
  };

  private assertCallJoined = () => {
    return new Promise<void>((resolve) => {
      this.joined$
        .pipe(
          takeWhile((isJoined) => !isJoined, true),
          filter((isJoined) => isJoined),
        )
        .subscribe(() => {
          resolve();
        });
    });
  };
}
