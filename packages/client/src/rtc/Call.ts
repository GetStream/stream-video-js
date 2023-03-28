import { StreamSfuClient } from '../StreamSfuClient';
import { createSubscriber } from './subscriber';
import { Publisher } from './publisher';
import { getGenericSdp } from './codecs';
import { TrackType } from '../gen/video/sfu/models/models';
import { registerEventHandlers } from './callEventHandlers';
import {
  Dispatcher,
  SfuEventKinds,
  SfuEventListener,
  SfuEventKindMap,
} from './Dispatcher';
import { CallState } from '../store';
import { trackTypeToParticipantStreamKey } from './helpers/tracks';
import {
  StreamCall,
  StreamCoordinatorClient,
} from '../coordinator/StreamCoordinatorClient';
import {
  CallResponse,
  JoinCallRequest,
  MemberResponse,
} from '../gen/coordinator';
import { join } from './flows/join';
import type {
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

/**
 * The options to pass to {@link Call} constructor.
 */
export type CallConstructor = {
  /**
   * The httpClient instance to use.
   */
  httpClient: StreamCoordinatorClient;

  /**
   * The Call type.
   */
  type: string;

  /**
   * The Call ID.
   */
  id: string;

  /**
   * An optional {@link CallResponse} metadata from the backend.
   * If provided, the call will be initialized with the data from this object.
   * This is useful when initializing a new "pending call" from an event.
   */
  metadata?: CallResponse;

  /**
   * An optional list of {@link MemberResponse} from the backend.
   * If provided, the call will be initialized with the data from this object.
   * This is useful when initializing a new "pending call" from an event.
   */
  members?: MemberResponse[];
};

/**
 * A `Call` object represents the active call the user is part of.
 * It's not enough to have a `Call` instance, you will also need to call the [`join`](#join) method.
 */
export class Call {
  /**
   * The type of the call.
   */
  readonly type: string;

  /**
   * The ID of the call.
   */
  readonly id: string;

  /**
   * The call CID.
   */
  readonly cid: string;

  /**
   * The state of this call.
   */
  readonly state = new CallState();

  /**
   * The event dispatcher instance dedicated to this Call instance.
   * @private
   */
  private dispatcher = new Dispatcher();

  private subscriber?: RTCPeerConnection;
  private publisher?: Publisher;
  private trackSubscriptionsSubject = new Subject<TrackSubscriptionDetails[]>();

  private statsReporter?: StatsReporter;
  private joined$ = new BehaviorSubject<boolean>(false);

  private readonly httpClient: StreamCoordinatorClient;
  private sfuClient?: StreamSfuClient;

  private get preferredAudioCodec() {
    const audioSettings = this.state.getCurrentValue(this.state.metadata$)
      ?.settings.audio;
    let preferredCodec =
      audioSettings?.redundant_coding_enabled === undefined
        ? 'opus'
        : audioSettings.redundant_coding_enabled
        ? 'red'
        : 'opus';
    if (
      typeof window !== 'undefined' &&
      window.location &&
      window.location.search
    ) {
      const queryParams = new URLSearchParams(window.location.search);
      preferredCodec = queryParams.get('codec') || preferredCodec;
    }

    return preferredCodec;
  }

  /**
   * Don't call the constructor directly, use the [`StreamVideoClient.joinCall`](./StreamVideoClient.md/#joincall) method to construct a `Call` instance.
   */
  constructor({ type, id, httpClient, metadata, members }: CallConstructor) {
    this.type = type;
    this.id = id;
    this.cid = `${type}:${id}`;
    this.httpClient = httpClient;

    this.state.metadataSubject.next(metadata);
    this.state.membersSubject.next(members || []);

    registerEventHandlers(this, this.state, this.dispatcher);

    this.trackSubscriptionsSubject
      .pipe(debounceTime(1200))
      .subscribe((subscriptions) => {
        this.sfuClient?.updateSubscriptions(subscriptions);
      });
  }

  /**
   * You can subscribe to WebSocket events provided by the API. To remove a subscription, call the `off` method.
   * Please note that subscribing to WebSocket events is an advanced use-case, for most use-cases it should be enough to watch for changes in the [reactive state store](./StreamVideoClient.md/#readonlystatestore).
   * @param eventName
   * @param fn
   * @returns
   */
  on = (eventName: SfuEventKinds, fn: SfuEventListener) => {
    return this.dispatcher.on(eventName, fn);
  };

  /**
   * Remove subscription for WebSocket events that were created by the `on` method.
   * @param eventName
   * @param fn
   * @returns
   */
  off = (eventName: SfuEventKinds, fn: SfuEventListener) => {
    return this.dispatcher.off(eventName, fn);
  };

  /**
   * Leave the call and stop the media streams that were published by the call.
   */
  leave = () => {
    if (!this.joined$.getValue()) {
      throw new Error('Cannot leave call that has already been left.');
    }
    this.joined$.next(false);

    this.statsReporter?.stop();
    this.statsReporter = undefined;

    this.subscriber?.close();
    this.subscriber = undefined;

    this.publisher?.stopPublishing();
    this.publisher = undefined;

    this.sfuClient?.close();
    this.sfuClient = undefined;

    // FIXME OL: sort this out
    // this.stateStore.setCurrentValue(
    //   this.stateStore.activeCallSubject,
    //   undefined,
    // );
  };

  private waitForJoinResponse = (timeout: number = 10000) =>
    new Promise<SfuEventKindMap['joinResponse']>((resolve, reject) => {
      const unsubscribe = this.on('joinResponse', (event) => {
        resolve(event as SfuEventKindMap['joinResponse']);
      });

      setTimeout(() => {
        unsubscribe();
        reject(new Error('Waiting for "joinResponse" has timed out'));
      }, timeout);
    });

  /**
   * Will initiate a call session with the server.
   *
   * @returns a promise which resolves once the call join-flow has finished.
   */
  join = async (data?: JoinCallRequest) => {
    if (this.joined$.getValue()) {
      throw new Error(`Illegal State: Already joined.`);
    }

    const call = await join(this.httpClient, this.type, this.id, data);
    this.state.setCurrentValue(this.state.metadataSubject, call.metadata);
    this.state.setCurrentValue(this.state.membersSubject, call.members);

    // FIXME OL: convert to a derived state
    this.state.setCurrentValue(
      this.state.callRecordingInProgressSubject,
      call.metadata.recording,
    );

    // FIXME OL: remove once cascading is implemented
    let sfuUrl = call.sfuServer.url;
    if (
      typeof window !== 'undefined' &&
      window.location &&
      window.location.search
    ) {
      const params = new URLSearchParams(window.location.search);
      const sfuUrlParam = params.get('sfuUrl');
      sfuUrl = sfuUrlParam || call.sfuServer.url;
    }

    const sfuClient = (this.sfuClient = new StreamSfuClient(
      this.dispatcher,
      sfuUrl,
      call.token,
    ));

    this.subscriber = createSubscriber({
      rpcClient: sfuClient,
      connectionConfig: call.connectionConfig,
      onTrack: this.handleOnTrack,
    });

    const audioSettings = this.state.getCurrentValue(this.state.metadata$)
      ?.settings.audio;
    let isDtxEnabled =
      audioSettings?.opus_dtx_enabled === undefined
        ? false
        : audioSettings?.opus_dtx_enabled;
    // TODO: SZ: Remove once SFU team don't need this
    if (
      typeof window !== 'undefined' &&
      window.location &&
      window.location.search
    ) {
      const queryParams = new URLSearchParams(window.location.search);
      isDtxEnabled = queryParams.get('dtx') === 'false' ? false : isDtxEnabled;
    }
    console.log('DTX enabled', isDtxEnabled);
    this.publisher = new Publisher({
      rpcClient: sfuClient,
      connectionConfig: call.connectionConfig,
      isDtxEnabled,
    });

    this.statsReporter = createStatsReporter({
      subscriber: this.subscriber,
      publisher: this.publisher,
      store: this.state,
      edgeName: call.sfuServer.edge_name,
    });

    const joinResponsePromise = this.waitForJoinResponse().then((event) => {
      const { callState } = event.eventPayload.joinResponse;
      const currentParticipants = callState?.participants || [];

      const ownCapabilities = {
        ownCapabilities: call.metadata.own_capabilities,
      };

      this.state.setCurrentValue(
        this.state.participantsSubject,
        currentParticipants.map<StreamVideoParticipant>((participant) => ({
          ...participant,
          isLoggedInUser: participant.sessionId === sfuClient.sessionId,
          // TODO: save other participants permissions once that's provided by SFU
          ...(participant.sessionId === sfuClient.sessionId
            ? ownCapabilities
            : {}),
        })),
      );

      sfuClient.keepAlive();
      this.joined$.next(true);
    });

    const genericSdp = await getGenericSdp(
      'recvonly',
      this.preferredAudioCodec,
    );
    await sfuClient.join({
      subscriberSdp: genericSdp || '',
    });

    return joinResponsePromise;
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
    if (!this.publisher) {
      throw new Error(`Call not joined yet.`);
    }

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
      await this.sfuClient?.updateMuteState(trackType, false);
    } catch (e) {
      throw e;
    }

    this.state.updateParticipant(this.sfuClient!.sessionId, (p) => ({
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
    if (!this.publisher) {
      throw new Error(`Call not joined yet.`);
    }

    const [audioTrack] = audioStream.getAudioTracks();
    if (!audioTrack) {
      return console.error(`There is no audio track in the stream`);
    }

    const trackType = TrackType.AUDIO;

    try {
      await this.publisher.publishStream(audioStream, audioTrack, trackType, {
        preferredCodec: this.preferredAudioCodec,
      });
      await this.sfuClient!.updateMuteState(trackType, false);
    } catch (e) {
      throw e;
    }

    this.state.updateParticipant(this.sfuClient!.sessionId, (p) => ({
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
    if (!this.publisher) {
      throw new Error(`Call not joined yet.`);
    }
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
      await this.sfuClient!.updateMuteState(trackType, false);
    } catch (e) {
      throw e;
    }

    this.state.updateParticipant(this.sfuClient!.sessionId, (p) => ({
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
    if (!this.publisher) {
      throw new Error(`Call not joined yet.`);
    }

    console.log(`stopPublish`, TrackType[trackType]);
    const wasPublishing = this.publisher.unpublishStream(trackType);
    if (wasPublishing) {
      await this.sfuClient!.updateMuteState(trackType, true);

      const audioOrVideoOrScreenShareStream =
        trackTypeToParticipantStreamKey(trackType);
      if (audioOrVideoOrScreenShareStream) {
        this.state.updateParticipant(this.sfuClient!.sessionId, (p) => ({
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
    const participants = this.state.updateParticipants(
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
    return this.statsReporter?.getRawStatsForTrack(kind, selector);
  };

  /**
   * Will enhance the reported stats with additional participant-specific information (`callStatsReport$` state [store variable](./StreamVideoClient.md/#readonlystatestore)).
   * This is usually helpful when detailed stats for a specific participant are needed.
   *
   * @param sessionId the sessionId to start reporting for.
   */
  startReportingStatsFor = (sessionId: string) => {
    return this.statsReporter?.startReportingStatsFor(sessionId);
  };

  /**
   * Opposite of `startReportingStatsFor`.
   * Will turn off stats reporting for a specific participant.
   *
   * @param sessionId the sessionId to stop reporting for.
   */
  stopReportingStatsFor = (sessionId: string) => {
    return this.statsReporter?.stopReportingStatsFor(sessionId);
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
    this.state.updateParticipant(this.sfuClient!.sessionId, {
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
    this.state.updateParticipant(this.sfuClient!.sessionId, {
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
    this.state.updateParticipant(this.sfuClient!.sessionId, {
      videoDeviceId: deviceId,
    });
  };

  /**
   * Resets the last sent reaction for the user holding the given `sessionId`.
   *
   * @param sessionId the session id.
   */
  resetReaction = (sessionId: string) => {
    this.state.updateParticipant(sessionId, {
      reaction: undefined,
    });
  };

  /**
   * @internal
   * @param enabledRids
   * @returns
   */
  updatePublishQuality = async (enabledRids: string[]) => {
    return this.publisher?.updateVideoPublishQuality(enabledRids);
  };

  private handleOnTrack = (e: RTCTrackEvent) => {
    const [primaryStream] = e.streams;
    // example: `e3f6aaf8-b03d-4911-be36-83f47d37a76a:TRACK_TYPE_VIDEO`
    const [trackId, trackType] = primaryStream.id.split(':');
    console.log(`Got remote ${trackType} track:`, e.track);
    const participantToUpdate = this.state
      .getCurrentValue(this.state.participantsSubject)
      .find((p) => p.trackLookupPrefix === trackId);
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
    this.state.updateParticipant(participantToUpdate.sessionId, {
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

  blockUser: StreamCall['blockUser'] = (userId) =>
    this.httpClient.call(this.type, this.id).blockUser(userId);

  unblockUser: StreamCall['unblockUser'] = (userId) =>
    this.httpClient.call(this.type, this.id).unblockUser(userId);

  muteUser: StreamCall['muteUser'] = (userId, type, sessionId) =>
    this.httpClient.call(this.type, this.id).muteUser(userId, type, sessionId);

  muteAllUsers: StreamCall['muteAllUsers'] = (type) =>
    this.httpClient.call(this.type, this.id).muteAllUsers(type);

  /**
   * Performs HTTP request to retrieve the list of recordings for the current call
   */
  queryRecordings: StreamCall['queryRecordings'] = () =>
    this.httpClient.call(this.type, this.id).queryRecordings();

  /**
   * Retrieves the list of recordings done with the current call and updates the call state
   */
  updateRecordingsList = async () => {
    const { recordings } = await this.queryRecordings();
    this.state.setCurrentValue(this.state.callRecordingListSubject, recordings);
  };
}
