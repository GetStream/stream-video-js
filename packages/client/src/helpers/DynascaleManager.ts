import { Call } from '../Call';
import {
  AudioTrackType,
  DebounceType,
  StreamVideoParticipant,
  VideoTrackType,
  VisibilityState,
} from '../types';
import { TrackType, VideoDimension } from '../gen/video/sfu/models/models';
import {
  distinctUntilChanged,
  distinctUntilKeyChanged,
  map,
  shareReplay,
  takeWhile,
} from 'rxjs';
import { ViewportTracker } from './ViewportTracker';
import { getLogger } from '../logger';
import { isFirefox, isSafari } from './browsers';

const DEFAULT_VIEWPORT_VISIBILITY_STATE: Record<
  VideoTrackType,
  VisibilityState
> = {
  videoTrack: VisibilityState.UNKNOWN,
  screenShareTrack: VisibilityState.UNKNOWN,
} as const;

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

  private logger = getLogger(['DynascaleManager']);
  private call: Call;

  /**
   * Creates a new DynascaleManager instance.
   *
   * @param call the call to manage.
   */
  constructor(call: Call) {
    this.call = call;
  }

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
      this.call.state.updateParticipant(sessionId, (participant) => {
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
      this.call.state.updateParticipant(sessionId, (participant) => {
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
      this.call.state.findParticipantBySessionId(sessionId);
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
        this.logger('debug', `Ignoring 0x0 dimension`, boundParticipant);
        dimension = undefined;
      }
      this.call.updateSubscriptionsPartial(
        trackType,
        { [sessionId]: { dimension } },
        debounceType,
      );
    };

    const participant$ = this.call.state.participants$.pipe(
      map(
        (participants) =>
          participants.find(
            (participant) => participant.sessionId === sessionId,
          ) as StreamVideoParticipant,
      ),
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

    let lastDimensions: string | undefined;
    const resizeObserver = boundParticipant.isLocalParticipant
      ? null
      : new ResizeObserver(() => {
          const currentDimensions = `${videoElement.clientWidth},${videoElement.clientHeight}`;

          // skip initial trigger
          if (!lastDimensions) {
            lastDimensions = currentDimensions;
            return;
          }

          if (
            lastDimensions === currentDimensions ||
            viewportVisibilityState === VisibilityState.INVISIBLE
          ) {
            return;
          }

          requestTrackWithDimensions(DebounceType.SLOW, {
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
              p.publishedTracks.includes(
                trackType === 'videoTrack'
                  ? TrackType.VIDEO
                  : TrackType.SCREEN_SHARE,
              ),
            ),
            distinctUntilChanged(),
          )
          .subscribe((isPublishing) => {
            if (isPublishing) {
              // the participant just started to publish a track
              requestTrackWithDimensions(DebounceType.FAST, {
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
              this.logger('warn', `Failed to play stream`, e);
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
    const participant = this.call.state.findParticipantBySessionId(sessionId);
    if (!participant || participant.isLocalParticipant) return;

    const participant$ = this.call.state.participants$.pipe(
      map(
        (participants) =>
          participants.find(
            (p) => p.sessionId === sessionId,
          ) as StreamVideoParticipant,
      ),
      takeWhile((p) => !!p),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

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
          if (audioElement.srcObject) {
            audioElement.play().catch((e) => {
              this.logger('warn', `Failed to play stream`, e);
            });
          }
        });
      });

    const sinkIdSubscription = !('setSinkId' in audioElement)
      ? null
      : this.call.speaker.state.selectedDevice$.subscribe((deviceId) => {
          if (deviceId) {
            // @ts-expect-error setSinkId is not yet in the lib
            audioElement.setSinkId(deviceId);
          }
        });

    const volumeSubscription = this.call.speaker.state.volume$.subscribe(
      (volume) => {
        audioElement.volume = volume;
      },
    );

    audioElement.autoplay = true;

    return () => {
      sinkIdSubscription?.unsubscribe();
      volumeSubscription.unsubscribe();
      updateMediaStreamSubscription.unsubscribe();
    };
  };
}
