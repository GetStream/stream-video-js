import {
  AudioTrackType,
  DebounceType,
  VideoTrackType,
  VisibilityState,
} from '../types';
import { VideoDimension } from '../gen/video/sfu/models/models';
import {
  combineLatest,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  map,
  shareReplay,
  takeWhile,
} from 'rxjs';
import { ViewportTracker } from './ViewportTracker';
import type { TrackSubscriptionManager } from './TrackSubscriptionManager';
import { isFirefox, isSafari } from './browsers';
import { hasScreenShare, hasVideo } from './participantUtils';
import { CallState } from '../store';
import { SpeakerManager } from '../devices';
import { videoLoggerSystem } from '../logger';
import { Tracer } from '../stats';
import { timeboxed } from '../coordinator/connection/utils';

const DEFAULT_VIEWPORT_VISIBILITY_STATE: Record<
  VideoTrackType,
  VisibilityState
> = {
  videoTrack: VisibilityState.UNKNOWN,
  screenShareTrack: VisibilityState.UNKNOWN,
} as const;

/**
 * Callback the manager emits whenever `audioElement.play()` is refused
 * with `NotAllowedError` (autoplay policy block; `blocked === true`) or
 * the binding's `srcObject` is cleared so the autoplay-blocked state no
 * longer applies (`blocked === false`). `Call` provides this at
 * construction time to route the signal into `MediaHealthMonitor`
 * without coupling `DynascaleManager` to the monitor's API.
 */
export type OnAutoplayBlockedChange = (
  audioElement: HTMLAudioElement,
  blocked: boolean,
) => void;

/**
 * Callback the manager emits when a bound `<video>` element fires
 * `'pause'` while its `srcObject` still has at least one live video
 * track (`paused === true`), or `'play'` resumes playback
 * (`paused === false`). `Call` provides this at construction time to
 * route the signal into `MediaHealthMonitor` without coupling
 * `DynascaleManager` to the monitor's API.
 */
export type OnVideoElementPausedChange = (
  videoElement: HTMLVideoElement,
  paused: boolean,
) => void;

/**
 * A manager class that handles dynascale related tasks like:
 *
 * - binding video elements to session ids
 * - binding audio elements to session ids
 * - tracking element visibility
 */
export class DynascaleManager {
  private logger = videoLoggerSystem.getLogger('DynascaleManager');
  private callState: CallState;
  private speaker: SpeakerManager;
  private tracer: Tracer;
  private useWebAudio = false;
  private audioContext: AudioContext | undefined;

  readonly viewportTracker = new ViewportTracker();
  private trackSubscriptionManager: TrackSubscriptionManager;
  private readonly onAutoplayBlockedChange: OnAutoplayBlockedChange;
  private readonly onVideoElementPausedChange: OnVideoElementPausedChange;

  /**
   * Creates a new DynascaleManager instance.
   */
  constructor(
    callState: CallState,
    speaker: SpeakerManager,
    tracer: Tracer,
    trackSubscriptionManager: TrackSubscriptionManager,
    onAutoplayBlockedChange: OnAutoplayBlockedChange,
    onVideoElementPausedChange: OnVideoElementPausedChange,
  ) {
    this.callState = callState;
    this.speaker = speaker;
    this.tracer = tracer;
    this.trackSubscriptionManager = trackSubscriptionManager;
    this.onAutoplayBlockedChange = onAutoplayBlockedChange;
    this.onVideoElementPausedChange = onVideoElementPausedChange;
  }

  /**
   * Closes the audio context if it was created.
   */
  dispose = async () => {
    const context = this.audioContext;
    if (context && context.state !== 'closed') {
      document.removeEventListener('click', this.resumeAudioContext);
      await context.close();
      this.audioContext = undefined;
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
   * Sets whether to use WebAudio API for audio playback.
   * Must be set before joining the call.
   *
   * @internal
   *
   * @param useWebAudio whether to use WebAudio API.
   */
  setUseWebAudio = (useWebAudio: boolean) => {
    this.tracer.trace('setUseWebAudio', useWebAudio);
    this.useWebAudio = useWebAudio;
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
      this.trackSubscriptionManager.apply(debounceType);
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

    const isVideoTrack = trackType === 'videoTrack';
    // element renders and gets bound - track subscription gets
    // triggered first other ones get skipped on initial subscriptions
    const publishedTracksSubscription = boundParticipant.isLocalParticipant
      ? null
      : participant$
          .pipe(
            distinctUntilKeyChanged('publishedTracks'),
            map((p) => (isVideoTrack ? hasVideo(p) : hasScreenShare(p))),
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

    // Forward pause/suspend/play to MediaHealthMonitor so stalled-live
    // videos (iOS WebView audio-session interruption symptom) get
    // auto-resumed. `suspend` is also covered because the UA can stop
    // advancing a `<video>` (NETWORK_IDLE) without flipping `paused`,
    // and `pause` alone misses that case. Benign transitions (unbind,
    // end-of-stream) leave only ended tracks and are filtered here so
    // the recovery loop doesn't churn.
    const onPauseOrSuspend = () => {
      const srcObject = videoElement.srcObject as MediaStream | null;
      const tracks = srcObject?.getVideoTracks();
      if (!tracks?.some((t) => t.readyState === 'live')) return;
      this.onVideoElementPausedChange(videoElement, true);
    };
    const onPlay = () => {
      this.onVideoElementPausedChange(videoElement, false);
    };
    // `pause`/`suspend` only fire on transitions, so an element that's
    // already paused at bind time (React re-mount during an iOS
    // audio-session interruption, a rebind onto the same DOM element
    // with an unchanged srcObject, or a `play()` rejection from the
    // force-play path below) would never reach MediaHealthMonitor's
    // recovery loop. Call this wherever the element could legitimately
    // end up paused-with-live to hand it off to the tracker.
    const registerIfPausedLive = () => {
      if (!videoElement.paused) return;
      const tracks = (
        videoElement.srcObject as MediaStream | null
      )?.getVideoTracks();
      if (!tracks?.some((t) => t.readyState === 'live')) return;
      this.onVideoElementPausedChange(videoElement, true);
    };
    videoElement.addEventListener('pause', onPauseOrSuspend);
    videoElement.addEventListener('suspend', onPauseOrSuspend);
    videoElement.addEventListener('play', onPlay);

    const trackKey = isVideoTrack ? 'videoStream' : 'screenShareStream';
    const streamSubscription = participant$
      .pipe(distinctUntilKeyChanged(trackKey))
      .subscribe((p) => {
        const source = isVideoTrack ? p.videoStream : p.screenShareStream;
        if (videoElement.srcObject === source) return;
        videoElement.srcObject = source ?? null;
        if (isSafari() || isFirefox()) {
          setTimeout(async () => {
            videoElement.srcObject = source ?? null;
            try {
              await timeboxed([videoElement.play()], 2000);
            } catch (e) {
              this.logger.warn(`Failed to play stream`, e);
            }
            // we add extra delay until we attempt to force-play
            // the participant's media stream in Firefox and Safari,
            // as they seem to have some timing issues
            registerIfPausedLive();
          }, 25);
        }
      });
    registerIfPausedLive();

    return () => {
      requestTrackWithDimensions(DebounceType.FAST, undefined);
      viewportVisibilityStateSubscription?.unsubscribe();
      publishedTracksSubscription?.unsubscribe();
      streamSubscription.unsubscribe();
      resizeObserver?.disconnect();
      videoElement.removeEventListener('pause', onPauseOrSuspend);
      videoElement.removeEventListener('suspend', onPauseOrSuspend);
      videoElement.removeEventListener('play', onPlay);
      this.onVideoElementPausedChange(videoElement, false);
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
    // Captured by every async handler below so a `play().catch` arriving
    // after cleanup can't re-register the now-detached element as
    // autoplay-blocked. Without this guard the element gets stuck in
    // `MediaHealthMonitor.blockedAudioElementsSubject` forever.
    let isDisposed = false;

    const isAudioTrack = trackType === 'audioTrack';
    const trackKey = isAudioTrack ? 'audioStream' : 'screenShareAudioStream';
    const updateMediaStreamSubscription = participant$
      .pipe(distinctUntilKeyChanged(trackKey))
      .subscribe((p) => {
        const source = isAudioTrack ? p.audioStream : p.screenShareAudioStream;
        if (audioElement.srcObject === source) return;

        setTimeout(() => {
          audioElement.srcObject = source ?? null;
          if (!source) {
            this.onAutoplayBlockedChange(audioElement, false);
            return;
          }

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
            audioElement.play().then(
              () => {
                if (isDisposed) return;
                // Clear any prior autoplay-blocked state for this element.
                this.onAutoplayBlockedChange(audioElement, false);
              },
              (e) => {
                if (isDisposed) return;
                this.tracer.trace('audioPlaybackError', e.message);
                if (e.name === 'NotAllowedError') {
                  this.tracer.trace('audioPlaybackBlocked', null);
                  this.onAutoplayBlockedChange(audioElement, true);
                }
                this.logger.warn(`Failed to play audio stream`, e);
              },
            );
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
      isDisposed = true;
      this.onAutoplayBlockedChange(audioElement, false);
      sinkIdSubscription?.unsubscribe();
      volumeSubscription.unsubscribe();
      updateMediaStreamSubscription.unsubscribe();
      audioElement.srcObject = null;
      sourceNode?.disconnect();
      gainNode?.disconnect();
    };
  };

  private getOrCreateAudioContext = (): AudioContext | undefined => {
    if (!this.useWebAudio) return;
    if (this.audioContext) return this.audioContext;
    const context = new AudioContext();
    this.tracer.trace('audioContext.create', context.state);
    if (context.state === 'suspended') {
      document.addEventListener('click', this.resumeAudioContext);
    }
    context.addEventListener('statechange', () => {
      this.tracer.trace('audioContext.state', context.state);
      if (context.state === 'interrupted') {
        this.resumeAudioContext();
      }
    });

    const audioSession = navigator.audioSession;
    if (audioSession) {
      // https://github.com/w3c/audio-session/blob/main/explainer.md
      audioSession.type = 'play-and-record';

      let isSessionInterrupted = false;
      audioSession.addEventListener('statechange', () => {
        this.tracer.trace('audioSession.state', audioSession.state);
        if (audioSession.state === 'interrupted') {
          isSessionInterrupted = true;
        } else if (isSessionInterrupted) {
          this.resumeAudioContext();
          isSessionInterrupted = false;
        }
      });
    }
    return (this.audioContext = context);
  };

  private resumeAudioContext = () => {
    if (!this.audioContext) return;
    const { state } = this.audioContext;
    if (state === 'suspended' || state === 'interrupted') {
      const tag = 'audioContext.resume';
      this.audioContext.resume().then(
        () => {
          this.tracer.trace(tag, this.audioContext?.state);
          document.removeEventListener('click', this.resumeAudioContext);
        },
        (err) => {
          this.tracer.trace(`${tag}Error`, this.audioContext?.state);
          this.logger.warn(`Can't resume audio context`, err);
        },
      );
    }
  };
}
