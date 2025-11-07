import {
  AudioTrackType,
  DebounceType,
  VideoTrackType,
  VisibilityState,
} from '../types';
import { TrackType, VideoDimension } from '../gen/video/sfu/models/models';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  map,
  shareReplay,
  takeWhile,
} from 'rxjs';
import { ViewportTracker } from './ViewportTracker';
import { isFirefox, isSafari } from './browsers';
import {
  hasScreenShare,
  hasScreenShareAudio,
  hasVideo,
} from './participantUtils';
import type { TrackSubscriptionDetails } from '../gen/video/sfu/signal_rpc/signal';
import type { CallState } from '../store';
import type { StreamSfuClient } from '../StreamSfuClient';
import { SpeakerManager } from '../devices';
import { getCurrentValue, setCurrentValue } from '../store/rxUtils';
import { videoLoggerSystem } from '../logger';

const DEFAULT_VIEWPORT_VISIBILITY_STATE: Record<
  VideoTrackType,
  VisibilityState
> = {
  videoTrack: VisibilityState.UNKNOWN,
  screenShareTrack: VisibilityState.UNKNOWN,
} as const;

type VideoTrackSubscriptionOverride =
  | {
      enabled: true;
      dimension: VideoDimension;
    }
  | { enabled: false };

const globalOverrideKey = Symbol('globalOverrideKey');

interface VideoTrackSubscriptionOverrides {
  [sessionId: string]: VideoTrackSubscriptionOverride | undefined;
  [globalOverrideKey]?: VideoTrackSubscriptionOverride;
}

/**
 * A manager class that handles dynascale related tasks like:
 *
 * - binding video elements to session ids
 * - binding audio elements to session ids
 * - tracking element visibility
 * - updating subscriptions based on viewport visibility
 * - updating subscriptions based on video element dimensions
 * - updating subscriptions based on published tracks
 */
export class DynascaleManager {
  /**
   * The viewport tracker instance.
   */
  readonly viewportTracker = new ViewportTracker();

  private logger = videoLoggerSystem.getLogger('DynascaleManager');
  private callState: CallState;
  private speaker: SpeakerManager;
  private audioContext: AudioContext | undefined;
  private sfuClient: StreamSfuClient | undefined;
  private pendingSubscriptionsUpdate: NodeJS.Timeout | null = null;

  private videoTrackSubscriptionOverridesSubject =
    new BehaviorSubject<VideoTrackSubscriptionOverrides>({});

  videoTrackSubscriptionOverrides$ =
    this.videoTrackSubscriptionOverridesSubject.asObservable();

  incomingVideoSettings$ = this.videoTrackSubscriptionOverrides$.pipe(
    map((overrides) => {
      const { [globalOverrideKey]: globalSettings, ...participants } =
        overrides;
      return {
        enabled: globalSettings?.enabled !== false,
        preferredResolution: globalSettings?.enabled
          ? globalSettings.dimension
          : undefined,
        participants: Object.fromEntries(
          Object.entries(participants).map(
            ([sessionId, participantOverride]) => [
              sessionId,
              {
                enabled: participantOverride?.enabled !== false,
                preferredResolution: participantOverride?.enabled
                  ? participantOverride.dimension
                  : undefined,
              },
            ],
          ),
        ),
        isParticipantVideoEnabled: (sessionId: string) =>
          overrides[sessionId]?.enabled ??
          overrides[globalOverrideKey]?.enabled ??
          true,
      };
    }),
    shareReplay(1),
  );

  /**
   * Creates a new DynascaleManager instance.
   */
  constructor(callState: CallState, speaker: SpeakerManager) {
    this.callState = callState;
    this.speaker = speaker;
  }

  /**
   * Disposes the allocated resources and closes the audio context if it was created.
   */
  dispose = async () => {
    if (this.pendingSubscriptionsUpdate) {
      clearTimeout(this.pendingSubscriptionsUpdate);
    }
    const context = this.getOrCreateAudioContext();
    if (context && context.state !== 'closed') {
      document.removeEventListener('click', this.resumeAudioContext);
      await context.close();
      this.audioContext = undefined;
    }
  };

  setSfuClient(sfuClient: StreamSfuClient | undefined) {
    this.sfuClient = sfuClient;
  }

  get trackSubscriptions() {
    const subscriptions: TrackSubscriptionDetails[] = [];
    for (const p of this.callState.remoteParticipants) {
      // NOTE: audio tracks don't have to be requested explicitly
      // as the SFU will implicitly subscribe us to all of them,
      // once they become available.
      if (p.videoDimension && hasVideo(p)) {
        const override =
          this.videoTrackSubscriptionOverrides[p.sessionId] ??
          this.videoTrackSubscriptionOverrides[globalOverrideKey];

        if (override?.enabled !== false) {
          subscriptions.push({
            userId: p.userId,
            sessionId: p.sessionId,
            trackType: TrackType.VIDEO,
            dimension: override?.dimension ?? p.videoDimension,
          });
        }
      }
      if (p.screenShareDimension && hasScreenShare(p)) {
        subscriptions.push({
          userId: p.userId,
          sessionId: p.sessionId,
          trackType: TrackType.SCREEN_SHARE,
          dimension: p.screenShareDimension,
        });
      }
      if (hasScreenShareAudio(p)) {
        subscriptions.push({
          userId: p.userId,
          sessionId: p.sessionId,
          trackType: TrackType.SCREEN_SHARE_AUDIO,
        });
      }
    }
    return subscriptions;
  }

  get videoTrackSubscriptionOverrides() {
    return getCurrentValue(this.videoTrackSubscriptionOverrides$);
  }

  setVideoTrackSubscriptionOverrides = (
    override: VideoTrackSubscriptionOverride | undefined,
    sessionIds?: string[],
  ) => {
    if (!sessionIds) {
      return setCurrentValue(
        this.videoTrackSubscriptionOverridesSubject,
        override ? { [globalOverrideKey]: override } : {},
      );
    }

    return setCurrentValue(
      this.videoTrackSubscriptionOverridesSubject,
      (overrides) => ({
        ...overrides,
        ...Object.fromEntries(sessionIds.map((id) => [id, override])),
      }),
    );
  };

  applyTrackSubscriptions = (
    debounceType: DebounceType = DebounceType.SLOW,
  ) => {
    if (this.pendingSubscriptionsUpdate) {
      clearTimeout(this.pendingSubscriptionsUpdate);
    }

    const updateSubscriptions = () => {
      this.pendingSubscriptionsUpdate = null;
      this.sfuClient
        ?.updateSubscriptions(this.trackSubscriptions)
        .catch((err: unknown) => {
          this.logger.debug(`Failed to update track subscriptions`, err);
        });
    };

    if (debounceType) {
      this.pendingSubscriptionsUpdate = setTimeout(
        updateSubscriptions,
        debounceType,
      );
    } else {
      updateSubscriptions();
    }
  };

  /**
   * Will begin tracking the given element for visibility changes within the
   * configured viewport element (`call.setViewport`).
   *
   * @param element the element to track.
   * @param sessionId the session id.
   * @param trackType the kind of video.
   * @returns Untrack.
   */
  trackElementVisibility = <T extends HTMLElement>(
    element: T,
    sessionId: string,
    trackType: VideoTrackType,
  ) => {
    const cleanup = this.viewportTracker.observe(element, (entry) => {
      this.callState.updateParticipant(sessionId, (participant) => {
        const previousVisibilityState =
          participant.viewportVisibilityState ??
          DEFAULT_VIEWPORT_VISIBILITY_STATE;

        // observer triggers when the element is "moved" to be a fullscreen element
        // keep it VISIBLE if that happens to prevent fullscreen with placeholder
        const isVisible =
          entry.isIntersecting || document.fullscreenElement === element
            ? VisibilityState.VISIBLE
            : VisibilityState.INVISIBLE;
        return {
          ...participant,
          viewportVisibilityState: {
            ...previousVisibilityState,
            [trackType]: isVisible,
          },
        };
      });
    });

    return () => {
      cleanup();
      // reset visibility state to UNKNOWN upon cleanup
      // so that the layouts that are not actively observed
      // can still function normally (runtime layout switching)
      this.callState.updateParticipant(sessionId, (participant) => {
        const previousVisibilityState =
          participant.viewportVisibilityState ??
          DEFAULT_VIEWPORT_VISIBILITY_STATE;
        return {
          ...participant,
          viewportVisibilityState: {
            ...previousVisibilityState,
            [trackType]: VisibilityState.UNKNOWN,
          },
        };
      });
    };
  };

  /**
   * Sets the viewport element to track bound video elements for visibility.
   *
   * @param element the viewport element.
   */
  setViewport = <T extends HTMLElement>(element: T) => {
    return this.viewportTracker.setViewport(element);
  };

  /**
   * Binds a DOM <video> element to the given session id.
   * This method will make sure that the video element will play
   * the correct video stream for the given session id.
   *
   * Under the hood, it would also keep track of the video element dimensions
   * and update the subscription accordingly in order to optimize the bandwidth.
   *
   * If a "viewport" is configured, the video element will be automatically
   * tracked for visibility and the subscription will be updated accordingly.
   *
   * @param videoElement the video element to bind to.
   * @param sessionId the session id.
   * @param trackType the kind of video.
   */
  bindVideoElement = (
    videoElement: HTMLVideoElement,
    sessionId: string,
    trackType: VideoTrackType,
  ) => {
    const boundParticipant =
      this.callState.findParticipantBySessionId(sessionId);
    if (!boundParticipant) return;

    const requestTrackWithDimensions = (
      debounceType: DebounceType,
      dimension: VideoDimension | undefined,
    ) => {
      if (dimension && (dimension.width === 0 || dimension.height === 0)) {
        // ignore 0x0 dimensions. this can happen when the video element
        // is not visible (e.g., has display: none).
        // we treat this as "unsubscription" as we don't want to keep
        // consuming bandwidth for a video that is not visible on the screen.
        this.logger.debug(`Ignoring 0x0 dimension`, boundParticipant);
        dimension = undefined;
      }
      this.callState.updateParticipantTracks(trackType, {
        [sessionId]: { dimension },
      });
      this.applyTrackSubscriptions(debounceType);
    };

    const participant$ = this.callState.participants$.pipe(
      map((ps) => ps.find((p) => p.sessionId === sessionId)),
      takeWhile((participant) => !!participant),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    /**
     * Since the video elements are now being removed from the DOM (React SDK) upon
     * visibility change, this subscription is not in use an stays here only for the
     * plain JS integrations where integrators might choose not to remove the video
     * elements from the DOM.
     */
    // keep copy for resize observer handler
    let viewportVisibilityState: VisibilityState | undefined;
    const viewportVisibilityStateSubscription =
      boundParticipant.isLocalParticipant
        ? null
        : participant$
            .pipe(
              map((p) => p.viewportVisibilityState?.[trackType]),
              distinctUntilChanged(),
            )
            .subscribe((nextViewportVisibilityState) => {
              // skip initial trigger
              if (!viewportVisibilityState) {
                viewportVisibilityState =
                  nextViewportVisibilityState ?? VisibilityState.UNKNOWN;
                return;
              }
              viewportVisibilityState =
                nextViewportVisibilityState ?? VisibilityState.UNKNOWN;

              if (nextViewportVisibilityState === VisibilityState.INVISIBLE) {
                return requestTrackWithDimensions(
                  DebounceType.MEDIUM,
                  undefined,
                );
              }

              requestTrackWithDimensions(DebounceType.MEDIUM, {
                width: videoElement.clientWidth,
                height: videoElement.clientHeight,
              });
            });

    let lastDimensions: VideoDimension | undefined;
    const resizeObserver = boundParticipant.isLocalParticipant
      ? null
      : new ResizeObserver(() => {
          const currentDimensions = {
            width: videoElement.clientWidth,
            height: videoElement.clientHeight,
          };

          // skip initial trigger
          if (!lastDimensions) {
            lastDimensions = currentDimensions;
            return;
          }

          if (
            (lastDimensions.width === currentDimensions.width &&
              lastDimensions.height === currentDimensions.height) ||
            viewportVisibilityState === VisibilityState.INVISIBLE
          ) {
            return;
          }

          const relativeDelta = Math.max(
            currentDimensions.width / lastDimensions.width,
            currentDimensions.height / lastDimensions.height,
          );
          // Low quality video in an upscaled video element is very noticable.
          // We try to upscale faster, and downscale slower. We also update debounce
          // more if the size change is not significant, gurading against fast-firing
          // resize events.
          const debounceType =
            relativeDelta > 1.2 ? DebounceType.IMMEDIATE : DebounceType.MEDIUM;
          requestTrackWithDimensions(debounceType, {
            width: videoElement.clientWidth,
            height: videoElement.clientHeight,
          });
          lastDimensions = currentDimensions;
        });
    resizeObserver?.observe(videoElement);

    // element renders and gets bound - track subscription gets
    // triggered first other ones get skipped on initial subscriptions
    const publishedTracksSubscription = boundParticipant.isLocalParticipant
      ? null
      : participant$
          .pipe(
            distinctUntilKeyChanged('publishedTracks'),
            map((p) =>
              trackType === 'videoTrack' ? hasVideo(p) : hasScreenShare(p),
            ),
            distinctUntilChanged(),
          )
          .subscribe((isPublishing) => {
            if (isPublishing) {
              // the participant just started to publish a track
              requestTrackWithDimensions(DebounceType.IMMEDIATE, {
                width: videoElement.clientWidth,
                height: videoElement.clientHeight,
              });
            } else {
              // the participant just stopped publishing a track
              requestTrackWithDimensions(DebounceType.FAST, undefined);
            }
          });

    videoElement.autoplay = true;
    videoElement.playsInline = true;

    // explicitly marking the element as muted will allow autoplay to work
    // without prior user interaction:
    // https://developer.mozilla.org/en-US/docs/Web/Media/Autoplay_guide
    videoElement.muted = true;

    const streamSubscription = participant$
      .pipe(
        distinctUntilKeyChanged(
          trackType === 'videoTrack' ? 'videoStream' : 'screenShareStream',
        ),
      )
      .subscribe((p) => {
        const source =
          trackType === 'videoTrack' ? p.videoStream : p.screenShareStream;
        if (videoElement.srcObject === source) return;
        videoElement.srcObject = source ?? null;
        if (isSafari() || isFirefox()) {
          setTimeout(() => {
            videoElement.srcObject = source ?? null;
            videoElement.play().catch((e) => {
              this.logger.warn(`Failed to play stream`, e);
            });
            // we add extra delay until we attempt to force-play
            // the participant's media stream in Firefox and Safari,
            // as they seem to have some timing issues
          }, 25);
        }
      });

    return () => {
      requestTrackWithDimensions(DebounceType.FAST, undefined);
      viewportVisibilityStateSubscription?.unsubscribe();
      publishedTracksSubscription?.unsubscribe();
      streamSubscription.unsubscribe();
      resizeObserver?.disconnect();
    };
  };

  /**
   * Binds a DOM <audio> element to the given session id.
   *
   * This method will make sure that the audio element will
   * play the correct audio stream for the given session id.
   *
   * @param audioElement the audio element to bind to.
   * @param sessionId the session id.
   * @param trackType the kind of audio.
   * @returns a cleanup function that will unbind the audio element.
   */
  bindAudioElement = (
    audioElement: HTMLAudioElement,
    sessionId: string,
    trackType: AudioTrackType,
  ) => {
    const participant = this.callState.findParticipantBySessionId(sessionId);
    if (!participant || participant.isLocalParticipant) return;

    const participant$ = this.callState.participants$.pipe(
      map((ps) => ps.find((p) => p.sessionId === sessionId)),
      takeWhile((p) => !!p),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    const updateSinkId = (
      deviceId: string,
      audioContext: AudioContext | undefined,
    ) => {
      if (!deviceId) return;
      if ('setSinkId' in audioElement) {
        audioElement.setSinkId(deviceId).catch((e) => {
          this.logger.warn(`Can't to set AudioElement sinkId`, e);
        });
      }

      if (audioContext && 'setSinkId' in audioContext) {
        // @ts-expect-error setSinkId is not available in all browsers
        audioContext.setSinkId(deviceId).catch((e) => {
          this.logger.warn(`Can't to set AudioContext sinkId`, e);
        });
      }
    };

    let sourceNode: MediaStreamAudioSourceNode | undefined = undefined;
    let gainNode: GainNode | undefined = undefined;

    const updateMediaStreamSubscription = participant$
      .pipe(
        distinctUntilKeyChanged(
          trackType === 'screenShareAudioTrack'
            ? 'screenShareAudioStream'
            : 'audioStream',
        ),
      )
      .subscribe((p) => {
        const source =
          trackType === 'screenShareAudioTrack'
            ? p.screenShareAudioStream
            : p.audioStream;
        if (audioElement.srcObject === source) return;

        setTimeout(() => {
          audioElement.srcObject = source ?? null;
          if (!source) return;

          // Safari has a special quirk that prevents playing audio until the user
          // interacts with the page or focuses on the tab where the call happens.
          // This is a workaround for the issue where:
          // - A and B are in a call
          // - A switches to another tab
          // - B mutes their microphone and unmutes it
          // - A does not hear B's unmuted audio until they focus the tab
          const audioContext = this.getOrCreateAudioContext();
          if (audioContext) {
            // we will play audio through the audio context in Safari
            audioElement.muted = true;
            sourceNode?.disconnect();
            sourceNode = audioContext.createMediaStreamSource(source);
            gainNode ??= audioContext.createGain();
            gainNode.gain.value = p.audioVolume ?? this.speaker.state.volume;
            sourceNode.connect(gainNode).connect(audioContext.destination);
            this.resumeAudioContext();
          } else {
            // we will play audio directly through the audio element in other browsers
            audioElement.muted = false;
            audioElement.play().catch((e) => {
              this.logger.warn(`Failed to play audio stream`, e);
            });
          }

          const { selectedDevice } = this.speaker.state;
          if (selectedDevice) updateSinkId(selectedDevice, audioContext);
        });
      });

    const sinkIdSubscription = !('setSinkId' in audioElement)
      ? null
      : this.speaker.state.selectedDevice$.subscribe((deviceId) => {
          const audioContext = this.getOrCreateAudioContext();
          updateSinkId(deviceId, audioContext);
        });

    const volumeSubscription = combineLatest([
      this.speaker.state.volume$,
      participant$.pipe(distinctUntilKeyChanged('audioVolume')),
    ]).subscribe(([volume, p]) => {
      const participantVolume = p.audioVolume ?? volume;
      audioElement.volume = participantVolume;
      if (gainNode) gainNode.gain.value = participantVolume;
    });

    audioElement.autoplay = true;

    return () => {
      sinkIdSubscription?.unsubscribe();
      volumeSubscription.unsubscribe();
      updateMediaStreamSubscription.unsubscribe();
      audioElement.srcObject = null;
      sourceNode?.disconnect();
      gainNode?.disconnect();
    };
  };

  private getOrCreateAudioContext = (): AudioContext | undefined => {
    if (this.audioContext || !isSafari()) return this.audioContext;
    const context = new AudioContext();
    if (context.state === 'suspended') {
      document.addEventListener('click', this.resumeAudioContext);
    }
    // @ts-expect-error audioSession is available in Safari only
    const audioSession = navigator.audioSession;
    if (audioSession) {
      // https://github.com/w3c/audio-session/blob/main/explainer.md
      audioSession.type = 'play-and-record';
    }
    return (this.audioContext = context);
  };

  private resumeAudioContext = () => {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext
        .resume()
        .catch((err) => this.logger.warn(`Can't resume audio context`, err))
        .then(() => {
          document.removeEventListener('click', this.resumeAudioContext);
        });
    }
  };
}
