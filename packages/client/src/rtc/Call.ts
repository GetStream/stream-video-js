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
import { StreamVideoWriteableStateStore } from '../store';
import type {
  CallOptions,
  PublishOptions,
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
  SubscriptionChanges,
} from './types';
import { debounceTime, Subject } from 'rxjs';
import { CallEnvelope } from '../gen/video/coordinator/client_v1_rpc/envelopes';
import {
  createStatsReporter,
  StatsReporter,
} from '../stats/state-store-stats-reporter';

/**
 * A `Call` object represents the active call, the user is part of.
 */
export class Call {
  /**@deprecated use store for this data */
  currentUserId: string;
  data: CallEnvelope;

  private videoLayers?: OptimalVideoLayer[];
  private readonly subscriber: RTCPeerConnection;
  private readonly publisher: RTCPeerConnection;
  private readonly trackSubscriptionsSubject = new Subject<{
    [key: string]: VideoDimension;
  }>();

  private statsReporter: StatsReporter;
  private joinResponseReady?: Promise<CallState | undefined>;

  /**
   * Use the [`StreamVideoClient.joinCall`](./StreamVideoClient.md/#joincall) method to construct a `Call` instance.
   * @param client
   * @param data
   * @param options
   * @param stateStore
   */
  constructor(
    data: CallEnvelope,
    private readonly client: StreamSfuClient,
    private readonly options: CallOptions,
    private readonly stateStore: StreamVideoWriteableStateStore,
  ) {
    this.data = data;
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
      }
      if (this.publisher.signalingState !== 'closed') {
        this.publisher.removeTrack(s);
      }
    });
    this.publisher.close();
    this.client.close();

    this.stateStore.setCurrentValue(
      this.stateStore.callRecordingInProgressSubject,
      false,
    );

    this.stateStore.setCurrentValue(
      this.stateStore.activeCallSubject,
      undefined,
    );

    this.stateStore.setCurrentValue(this.stateStore.participantsSubject, []);
  };

  /**
   * Joins the call and sets the necessary video and audio encoding configurations.
   * @param videoStream
   * @param audioStream
   * @returns
   */
  join = async (videoStream?: MediaStream, audioStream?: MediaStream) => {
    if (this.joinResponseReady) {
      throw new Error(`Illegal State: Already joined.`);
    }

    this.joinResponseReady = new Promise<CallState | undefined>(
      async (resolve) => {
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

        this.client.dispatcher.on('joinResponse', (event) => {
          if (event.eventPayload.oneofKind !== 'joinResponse') return;

          const { callState } = event.eventPayload.joinResponse;
          const currentParticipants = callState?.participants || [];
          this.stateStore.setCurrentValue(
            this.stateStore.participantsSubject,
            currentParticipants.map<StreamVideoParticipant>((participant) => {
              if (participant.sessionId === this.client.sessionId) {
                const localParticipant =
                  participant as StreamVideoLocalParticipant;
                localParticipant.isLoggedInUser = true;
                localParticipant.audioStream = audioStream;
                localParticipant.videoStream = videoStream;
              }
              return participant;
            }),
          );
          this.stateStore.setCurrentValue(
            this.stateStore.activeCallSubject,
            this,
          );
          this.stateStore.setCurrentValue(
            this.stateStore.pendingCallsSubject,
            this.stateStore
              .getCurrentValue(this.stateStore.pendingCallsSubject)
              .filter((call) => call.call?.callCid !== this.data.call?.callCid),
          );
          this.stateStore.setCurrentValue(
            this.stateStore.acceptedCallSubject,
            undefined,
          );

          this.client.keepAlive();
          resolve(callState); // expose call state
        });

        this.client.send(
          SfuRequest.create({
            requestPayload: {
              oneofKind: 'joinRequest',
              joinRequest: {
                sessionId: this.client.sessionId,
                token: this.client.token,
                publish: true,
                // FIXME OL: encode parameters and video layers
                // should be announced when initiating "publish" operation
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
      },
    );

    return this.joinResponseReady;
  };

  /**
   * Starts publishing the given video and/or audio streams, the streams will be stopped if the user changes an input device, or if the user leaves the call.
   * @param audioStream
   * @param videoStream
   * @param opts
   */
  publishMediaStreams = async (
    audioStream?: MediaStream,
    videoStream?: MediaStream,
    opts: PublishOptions = {},
  ) => {
    if (!this.joinResponseReady) {
      throw new Error(
        `Illegal State: Can't publish. Please join the call first`,
      );
    }

    // wait until we get a JoinResponse from the SFU, otherwise we risk
    // breaking the ICETrickle flow.
    await this.joinResponseReady;

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

        const codecPreferences = getPreferredCodecs(
          'video',
          opts.preferredVideoCodec || 'vp8',
        );
        // @ts-ignore
        if ('setCodecPreferences' in videoTransceiver && codecPreferences) {
          console.log(`set codec preferences`, codecPreferences);
          videoTransceiver.setCodecPreferences(codecPreferences);
        }
      }

      this.stateStore.setCurrentValue(
        this.stateStore.participantsSubject,
        this.participants.map((p) => {
          if (p.sessionId === this.client.sessionId) {
            return {
              ...p,
              videoStream,
              videoDeviceId: this.getActiveInputDeviceId('videoinput'),
            };
          }
          return p;
        }),
      );
    }

    if (audioStream) {
      const [audioTrack] = audioStream.getAudioTracks();
      if (audioTrack) {
        this.publisher?.addTransceiver(audioTrack, {
          direction: 'sendonly',
        });
      }

      this.stateStore.setCurrentValue(
        this.stateStore.participantsSubject,
        this.participants.map((p) => {
          if (p.sessionId === this.client.sessionId) {
            return {
              ...p,
              audioStream: audioStream,
              audioDeviceId: this.getActiveInputDeviceId('audioinput'),
            };
          }
          return p;
        }),
      );
    }
  };

  /**
   * A method for switching an input device.
   * @param kind
   * @param mediaStream
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

    const localParticipant = this.participants.find(
      (p) => p.sessionId === this.client.sessionId,
    );
    const muteState = !(kind === 'audioinput'
      ? localParticipant?.audio
      : localParticipant?.video);
    this.updateMuteState(kind === 'audioinput' ? 'audio' : 'video', muteState);

    this.stateStore.setCurrentValue(
      this.stateStore.participantsSubject,
      this.participants.map((p) => {
        if (p.sessionId === this.client.sessionId) {
          return {
            ...p,
            [kind === 'audioinput' ? 'audioTrack' : 'videoTrack']: mediaStream,
            [kind === 'audioinput' ? 'audioDeviceId' : 'videoDeviceId']:
              this.getActiveInputDeviceId(kind),
          };
        }
        return p;
      }),
    );

    return mediaStream; // for SDK use (preview video)
  };

  /**
   * Update track subscription configuration for one or more participants.
   * You have to create a subscription for each participant you want to receive any kind of track.
   *
   * @param changes the list of subscription changes to do.
   */
  updateSubscriptionsPartial = (changes: SubscriptionChanges) => {
    if (Object.keys(changes).length === 0) {
      return;
    }

    this.stateStore.setCurrentValue(
      this.stateStore.participantsSubject,
      this.participants.map((participant) => {
        const change = changes[participant.sessionId];
        if (change) {
          return {
            ...participant,
            videoDimension: change.videoDimension,
          };
        }
        return participant;
      }),
    );

    this.updateSubscriptions(this.participants);
  };

  private updateSubscriptions = (participants: StreamVideoParticipant[]) => {
    const subscriptions: { [key: string]: VideoDimension } = {};
    participants.forEach((p) => {
      if (p.videoDimension && !p.isLoggedInUser) {
        subscriptions[p.user!.id] = p.videoDimension;
      }
    });
    // schedule update
    this.trackSubscriptionsSubject.next(subscriptions);
  };

  /**
   * @deprecated use the `callStatsReport$` state store variable instead
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

      if (trackKind === 'audio') {
        return this.client.updateAudioMuteState(isMute);
      } else if (trackKind === 'video') {
        return this.client.updateVideoMuteState(isMute);
      }
    }
  };

  /**
   * Sets the used audio output device
   *
   * This method only stores the selection, you'll have to implement the audio switching, for more information see: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/sinkId
   *
   * @param deviceId the selected device, `undefined` means the user wants to use the system's default audio output
   */
  setAudioOutputDevice(deviceId?: string) {
    const localParticipant = this.stateStore.getCurrentValue(
      this.stateStore.localParticipant$,
    );
    const allParticipants = this.stateStore.getCurrentValue(
      this.stateStore.participantsSubject,
    );
    this.stateStore.setCurrentValue(
      this.stateStore.participantsSubject,
      allParticipants.map((p) =>
        p.sessionId === localParticipant?.sessionId
          ? { ...localParticipant, audioOutputDeviceId: deviceId }
          : p,
      ),
    );
  }

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
    return this.stateStore.getCurrentValue(this.stateStore.participantsSubject);
  }

  private handleOnTrack = (e: RTCTrackEvent) => {
    console.log('Got remote track:', e.track);
    const [primaryStream] = e.streams;
    const [trackId] = primaryStream.id.split(':');
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
        participantToUpdate.user!.id,
        `${e.track.kind}:${trackId}`,
        e.track,
      );
    });

    e.track.addEventListener('unmute', () => {
      console.log(
        `Track unmuted:`,
        participantToUpdate.user!.id,
        `${e.track.kind}:${trackId}`,
        e.track,
      );
    });

    e.track.addEventListener('ended', () => {
      console.log(
        `Track ended:`,
        participantToUpdate.user!.id,
        `${e.track.kind}:${trackId}`,
        e.track,
      );
    });

    if (e.track.kind === 'video') {
      this.stateStore.setCurrentValue(
        this.stateStore.participantsSubject,
        this.participants.map((participant) => {
          if (participant.trackLookupPrefix === trackId) {
            return {
              // FIXME OL: shallow clone, switch to deep clone
              ...participant,
              videoStream: primaryStream,
            };
          }
          return participant;
        }),
      );
    } else if (e.track.kind === 'audio') {
      this.stateStore.setCurrentValue(
        this.stateStore.participantsSubject,
        this.participants.map((participant) => {
          if (participant.trackLookupPrefix === trackId) {
            return {
              // FIXME OL: shallow clone, switch to deep clone
              ...participant,
              audioStream: primaryStream,
            };
          }
          return participant;
        }),
      );
    }
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
}
