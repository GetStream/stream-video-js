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
   * @returns a cleanup function that will stop tracking the element.
   */
  trackElementVisibility = <T extends HTMLElement>(
    element: T,
    sessionId: string,
  ) => {
    const cleanup = this.viewportTracker.observe(element, (entry) => {
      this.call.state.updateParticipant(sessionId, (participant) => ({
        ...participant,
        viewportVisibilityState:
          // observer triggers when the element is "moved" to be a fullscreen element
          // keep it VISIBLE if that happens to prevent fullscreen with placeholder
          entry.isIntersecting || document.fullscreenElement === element
            ? VisibilityState.VISIBLE
            : VisibilityState.INVISIBLE,
      }));
    });

    return () => {
      cleanup();
      // reset visibility state to UNKNOWN upon cleanup
      // so that the layouts that are not actively observed
      // can still function normally (runtime layout switching)
      this.call.state.updateParticipant(sessionId, (participant) => ({
        ...participant,
        viewportVisibilityState: VisibilityState.UNKNOWN,
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
   * @param kind the kind of video.
   */
  bindVideoElement = (
    videoElement: HTMLVideoElement,
    sessionId: string,
    kind: 'video' | 'screen',
  ) => {
    const requestVideoWithDimensions = (
      debounceType: DebounceType,
      dimension: VideoDimension | undefined,
    ) => {
      this.call.updateSubscriptionsPartial(
        kind,
        { [sessionId]: { dimension } },
        debounceType,
      );
    };

    const matchedParticipant =
      this.call.state.findParticipantBySessionId(sessionId);
    if (!matchedParticipant) return;

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
      matchedParticipant.isLocalParticipant
        ? null
        : participant$
            .pipe(distinctUntilKeyChanged('viewportVisibilityState'))
            .subscribe((p) => {
              // skip initial trigger
              if (!viewportVisibilityState) {
                viewportVisibilityState =
                  p.viewportVisibilityState ?? VisibilityState.UNKNOWN;
                return;
              }

              if (p.viewportVisibilityState === VisibilityState.INVISIBLE) {
                return requestVideoWithDimensions(
                  DebounceType.MEDIUM,
                  undefined,
                );
              }

              requestVideoWithDimensions(DebounceType.MEDIUM, {
                width: videoElement.clientWidth,
                height: videoElement.clientHeight,
              });
            });

    let lastDimensions: string | undefined;
    const resizeObserver = matchedParticipant.isLocalParticipant
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
          )
            return;

          requestVideoWithDimensions(DebounceType.SLOW, {
            width: videoElement.clientWidth,
            height: videoElement.clientHeight,
          });
          lastDimensions = currentDimensions;
        });
    resizeObserver?.observe(videoElement);

    const publishedTracksSubscription = matchedParticipant.isLocalParticipant
      ? null
      : participant$
          .pipe(
            distinctUntilKeyChanged('publishedTracks'),
            map((p) =>
              p.publishedTracks.includes(
                kind === 'video' ? TrackType.VIDEO : TrackType.SCREEN_SHARE,
              ),
            ),
            distinctUntilChanged(),
          )
          .subscribe((isPublishing) => {
            if (isPublishing) {
              // the participant just started to publish a track
              requestVideoWithDimensions(DebounceType.IMMEDIATE, {
                width: videoElement.clientWidth,
                height: videoElement.clientHeight,
              });
            } else {
              // the participant just stopped publishing a track
              requestVideoWithDimensions(DebounceType.IMMEDIATE, undefined);
            }
          });

    const streamSubscription = participant$
      .pipe(
        distinctUntilKeyChanged(
          kind === 'video' ? 'videoStream' : 'screenShareStream',
        ),
      )
      .subscribe((p) => {
        const source = kind === 'video' ? p.videoStream : p.screenShareStream;
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
        if (audioElement.srcObject === source || !source) return;

        setTimeout(() => {
          audioElement.srcObject = source;
          audioElement.play().catch((e) => {
            this.logger('warn', `Failed to play stream`, e);
          });
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
