import { Call } from '../Call';
import {
  DebounceType,
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
  VisibilityState,
} from '../types';
import { TrackType, VideoDimension } from '../gen/video/sfu/models/models';
import {
  distinctUntilChanged,
  distinctUntilKeyChanged,
  map,
  takeWhile,
} from 'rxjs';
import { ViewportTracker } from './ViewportTracker';
import { getLogger } from '../logger';

const DEFAULT_VIEWPORT_VISIBILITY_STATE = {
  screen: VisibilityState.UNKNOWN,
  video: VisibilityState.UNKNOWN,
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
   * @param videoMode the kind of video.
   * @returns Untrack.
   */
  trackElementVisibility = <T extends HTMLElement>(
    element: T,
    sessionId: string,
    videoMode: 'video' | 'screen',
  ) => {
    const cleanup = this.viewportTracker.observe(element, (entry) => {
      this.call.state.updateParticipant(sessionId, (participant) => ({
        ...participant,
        // observer triggers when the element is "moved" to be a fullscreen element
        // keep it VISIBLE if that happens to prevent fullscreen with placeholder
        viewportVisibilityState: {
          ...(participant.viewportVisibilityState ??
            DEFAULT_VIEWPORT_VISIBILITY_STATE),
          [videoMode]:
            entry.isIntersecting || document.fullscreenElement === element
              ? VisibilityState.VISIBLE
              : VisibilityState.INVISIBLE,
        },
      }));
    });

    return () => {
      cleanup();
      // reset visibility state to UNKNOWN upon cleanup
      // so that the layouts that are not actively observed
      // can still function normally (runtime layout switching)
      this.call.state.updateParticipant(sessionId, (participant) => ({
        ...participant,
        viewportVisibilityState: {
          ...(participant.viewportVisibilityState ??
            DEFAULT_VIEWPORT_VISIBILITY_STATE),
          [videoMode]: VisibilityState.UNKNOWN,
        },
      }));
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
   * @param videoMode the kind of video.
   */
  bindVideoElement = (
    videoElement: HTMLVideoElement,
    sessionId: string,
    videoMode: 'video' | 'screen',
  ) => {
    const boundParticipant =
      this.call.state.findParticipantBySessionId(sessionId);
    if (!boundParticipant) return;

    const requestTrackWithDimensions = (
      debounceType: DebounceType,
      dimension: VideoDimension | undefined,
    ) => {
      this.call.updateSubscriptionsPartial(
        videoMode,
        { [sessionId]: { dimension } },
        debounceType,
      );
    };

    const participant$ = this.call.state.participants$.pipe(
      map(
        (participants) =>
          participants.find(
            (participant) => participant.sessionId === sessionId,
          ) as StreamVideoLocalParticipant | StreamVideoParticipant,
      ),
      takeWhile((participant) => !!participant),
      distinctUntilChanged(),
    );

    // keep copy for resize observer handler
    let viewportVisibilityState: VisibilityState | undefined;
    const viewportVisibilityStateSubscription =
      boundParticipant.isLocalParticipant
        ? null
        : participant$
            .pipe(
              map((p) => p.viewportVisibilityState?.[videoMode]),
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

    const publishedTracksSubscription = boundParticipant.isLocalParticipant
      ? null
      : participant$
          .pipe(
            distinctUntilKeyChanged('publishedTracks'),
            map((p) =>
              p.publishedTracks.includes(
                videoMode === 'video'
                  ? TrackType.VIDEO
                  : TrackType.SCREEN_SHARE,
              ),
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
              requestTrackWithDimensions(DebounceType.IMMEDIATE, undefined);
            }
          });

    const streamSubscription = participant$
      .pipe(
        distinctUntilKeyChanged(
          videoMode === 'video' ? 'videoStream' : 'screenShareStream',
        ),
      )
      .subscribe((p) => {
        const source =
          videoMode === 'video' ? p.videoStream : p.screenShareStream;
        if (videoElement.srcObject === source) return;
        setTimeout(() => {
          videoElement.srcObject = source ?? null;
          if (videoElement.srcObject) {
            videoElement.play().catch((e) => {
              this.logger('warn', `Failed to play stream`, e);
            });
          }
        }, 0);
      });
    videoElement.playsInline = true;
    videoElement.autoplay = true;

    // explicitly marking the element as muted will allow autoplay to work
    // without prior user interaction:
    // https://developer.mozilla.org/en-US/docs/Web/Media/Autoplay_guide
    videoElement.muted = true;

    return () => {
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
   * @returns a cleanup function that will unbind the audio element.
   */
  bindAudioElement = (audioElement: HTMLAudioElement, sessionId: string) => {
    const participant = this.call.state.findParticipantBySessionId(sessionId);
    if (!participant || participant.isLocalParticipant) return;

    const participant$ = this.call.state.participants$.pipe(
      map(
        (participants) =>
          participants.find((p) => p.sessionId === sessionId) as
            | StreamVideoLocalParticipant
            | StreamVideoParticipant,
      ),
      takeWhile((p) => !!p),
      distinctUntilChanged(),
    );

    const updateMediaStreamSubscription = participant$
      .pipe(distinctUntilKeyChanged('audioStream'))
      .subscribe((p) => {
        const source = p.audioStream;
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

    const sinkIdSubscription = this.call.state.localParticipant$.subscribe(
      (p) => {
        if (p && p.audioOutputDeviceId && 'setSinkId' in audioElement) {
          // @ts-expect-error setSinkId is not yet in the lib
          audioElement.setSinkId(p.audioOutputDeviceId);
        }
      },
    );

    audioElement.autoplay = true;

    return () => {
      sinkIdSubscription.unsubscribe();
      updateMediaStreamSubscription.unsubscribe();
    };
  };
}
