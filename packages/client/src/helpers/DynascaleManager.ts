import {
  AudioTrackType,
  DebounceType,
  VideoTrackType,
  VisibilityState,
} from '../types';
import { TrackType, VideoDimension } from '../gen/video/sfu/models/models';
import {
  combineLatest,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  map,
  shareReplay,
  skip,
  takeWhile,
} from 'rxjs';
import type { BlockedAudioTracker } from './BlockedAudioTracker';
import {
  MediaPlaybackWatchdog,
  type MediaPlaybackWatchdogOptions,
} from './MediaPlaybackWatchdog';
import { SilentAudioPlayer } from './SilentAudioPlayer';
import { sharedAudioContext } from './SharedAudioContext';
import type { TrackSubscriptionManager } from './TrackSubscriptionManager';
import { isFirefox, isIOS, isSafari } from './browsers';
import { hasScreenShare, hasVideo } from './participantUtils';
import { CallState } from '../store';
import { SpeakerManager } from '../devices';
import { videoLoggerSystem } from '../logger';
import { Tracer } from '../stats';
import { timeboxed } from '../coordinator/connection/utils';

/**
 * A manager class that handles dynascale related tasks like:
 *
 * - binding video elements to session ids
 * - binding audio elements to session ids
 */
export class DynascaleManager {
  private logger = videoLoggerSystem.getLogger('DynascaleManager');
  private callState: CallState;
  private speaker: SpeakerManager;
  private readonly tracer: Tracer;
  private useWebAudio = false;
  private audioContext: AudioContext | undefined;
  private playbackWatchdogs = new Set<MediaPlaybackWatchdog>();
  private silentAudioPlayer: SilentAudioPlayer;
  private restartOnRearm = false;
  private restartTimer: ReturnType<typeof setTimeout> | undefined;
  private silentAudioResumeTimer: ReturnType<typeof setTimeout> | undefined;
  private stopWatchingGestures: (() => void) | undefined;
  private stopWatchingAudioInterruptions: (() => void) | undefined;
  private stopTracingAudioContext: (() => void) | undefined;
  private stopWatchingVisibility: (() => void) | undefined;

  private trackSubscriptionManager: TrackSubscriptionManager;
  private blockedAudioTracker: BlockedAudioTracker;

  /**
   * Creates a new DynascaleManager instance.
   */
  constructor(
    callState: CallState,
    speaker: SpeakerManager,
    tracer: Tracer,
    trackSubscriptionManager: TrackSubscriptionManager,
    blockedAudioTracker: BlockedAudioTracker,
  ) {
    this.callState = callState;
    this.speaker = speaker;
    this.tracer = tracer;
    this.trackSubscriptionManager = trackSubscriptionManager;
    this.blockedAudioTracker = blockedAudioTracker;
    this.silentAudioPlayer = new SilentAudioPlayer(tracer);
  }

  /**
   * Closes the audio context if it was created.
   */
  dispose = async () => {
    this.releaseAudioPlaybackUnlock();
    const context = this.audioContext;
    if (context && context.state !== 'closed') {
      document.removeEventListener('click', this.resumeAudioContext);
      await context.close();
      this.audioContext = undefined;
    }
  };

  /**
   * Keeps a silent audio element playing on iOS, so remote audio can autoplay
   * later without another user gesture, and recovers remote audio after
   * audio interruptions. On iOS and desktop Safari, the next tap plays any
   * paused remote audio. Call it from a user gesture or while audio is
   * playing. On every platform it traces the shared audio context.
   */
  keepAudioPlaybackUnlocked = () => {
    this.stopTracingAudioContext ??= sharedAudioContext.addTracer(this.tracer);
    this.silentAudioPlayer.play();
    if (isIOS()) {
      this.stopWatchingAudioInterruptions ??=
        sharedAudioContext.watchInterruptions(this.onAudioInterruptionChange);
      this.watchPageVisibility();
    }
    if (isIOS() || isSafari()) this.watchGestures();
  };

  /**
   * Stops the silent audio element and the watchers started by
   * {@link keepAudioPlaybackUnlocked}.
   */
  releaseAudioPlaybackUnlock = () => {
    this.stopWatchingVisibility?.();
    this.stopWatchingVisibility = undefined;
    this.stopTracingAudioContext?.();
    this.stopTracingAudioContext = undefined;
    this.stopWatchingAudioInterruptions?.();
    this.stopWatchingAudioInterruptions = undefined;
    this.stopWatchingGestures?.();
    this.stopWatchingGestures = undefined;
    this.restartOnRearm = false;
    if (this.restartTimer) {
      this.playbackWatchdogs.forEach((watchdog) => {
        if (watchdog.kind === 'audio') watchdog.playNow();
      });
    }
    this.clearRestartTimer();
    clearTimeout(this.silentAudioResumeTimer);
    this.silentAudioResumeTimer = undefined;
    this.silentAudioPlayer.dispose();
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

    const playbackWatchdog = this.createPlaybackWatchdog({
      element: videoElement,
      kind: 'video',
      tracer: this.tracer,
      sessionId,
      trackType,
    });

    const trackKey = isVideoTrack ? 'videoStream' : 'screenShareStream';
    let rebindTimer: ReturnType<typeof setTimeout> | undefined;
    const streamSubscription = participant$
      .pipe(distinctUntilKeyChanged(trackKey))
      .subscribe((p) => {
        const source = isVideoTrack ? p.videoStream : p.screenShareStream;
        if (videoElement.srcObject === source) return;
        videoElement.srcObject = source ?? null;
        if (isSafari() || isFirefox()) {
          clearTimeout(rebindTimer);
          rebindTimer = setTimeout(async () => {
            videoElement.srcObject = source ?? null;
            try {
              await timeboxed([videoElement.play()], 2000);
            } catch (e) {
              this.logger.warn(`Failed to play stream`, e);
            }
          }, 25);
        }
      });

    return () => {
      requestTrackWithDimensions(DebounceType.FAST, undefined);
      viewportVisibilityStateSubscription?.unsubscribe();
      publishedTracksSubscription?.unsubscribe();
      streamSubscription.unsubscribe();
      resizeObserver?.disconnect();
      this.disposePlaybackWatchdog(playbackWatchdog);
      clearTimeout(rebindTimer);
      videoElement.srcObject = null;
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
      if (!this.speaker.state.isDeviceSelectionSupported) return;
      if ('setSinkId' in audioElement && audioElement.sinkId !== deviceId) {
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
    let audioWatchdog: MediaPlaybackWatchdog | undefined = undefined;
    let blockedByGiveUp = false;

    const clearBlockedAudio = () => {
      blockedByGiveUp = false;
      if (!this.blockedAudioTracker.isBlocked(audioElement)) return;
      this.blockedAudioTracker.markBlocked(audioElement, false);
    };
    // Safari fires `playing` (followed by `pause`) even when play() is
    // rejected by the autoplay policy, so only trust it while not paused
    const onPlaying = () => {
      if (audioElement.paused) return;
      this.silentAudioPlayer.resume();
      clearBlockedAudio();
    };
    audioElement.addEventListener('playing', onPlaying);

    const playAudioElement = () => {
      audioElement.play().catch((e) => {
        this.tracer.trace('audioPlaybackError', e.message);
        if (e.name === 'NotAllowedError') {
          this.tracer.trace('audioPlaybackBlocked', null);
          blockedByGiveUp = false;
          this.blockedAudioTracker.markBlocked(audioElement, true, sessionId);
        }
        this.logger.warn(`Failed to play audio stream`, e);
      });
    };

    const isAudioTrack = trackType === 'audioTrack';
    const trackKey = isAudioTrack ? 'audioStream' : 'screenShareAudioStream';
    let sourceChangeTimer: ReturnType<typeof setTimeout> | undefined;
    const updateMediaStreamSubscription = participant$
      .pipe(distinctUntilKeyChanged(trackKey))
      .subscribe((p) => {
        const source = isAudioTrack ? p.audioStream : p.screenShareAudioStream;
        if (audioElement.srcObject === source) return;

        clearTimeout(sourceChangeTimer);
        sourceChangeTimer = setTimeout(() => {
          sourceChangeTimer = undefined;
          audioElement.srcObject = source ?? null;
          this.disposePlaybackWatchdog(audioWatchdog);
          audioWatchdog = undefined;
          if (!source) {
            clearBlockedAudio();
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
            playAudioElement();
            audioWatchdog = this.createPlaybackWatchdog({
              element: audioElement,
              kind: 'audio',
              tracer: this.tracer,
              sessionId,
              trackType,
              // only an autoplay-policy block needs a user gesture; a give-up
              // block is for the UI and must not stop a re-armed cycle
              isBlocked: () =>
                !blockedByGiveUp &&
                this.blockedAudioTracker.isBlocked(audioElement),
              onGiveUp: () => {
                blockedByGiveUp = true;
                this.blockedAudioTracker.markBlocked(
                  audioElement,
                  true,
                  sessionId,
                );
              },
              onPlayBlocked: () => {
                blockedByGiveUp = false;
                this.blockedAudioTracker.markBlocked(
                  audioElement,
                  true,
                  sessionId,
                );
              },
            });
          }

          const { selectedDevice } = this.speaker.state;
          if (selectedDevice) updateSinkId(selectedDevice, audioContext);
        });
      });

    // the element stays bound while the participant is muted, so retry a
    // paused (e.g., autoplay-blocked) element once the track is published again
    const publishedTrackType = isAudioTrack
      ? TrackType.AUDIO
      : TrackType.SCREEN_SHARE_AUDIO;
    const republishSubscription = participant$
      .pipe(
        map((p) => p.publishedTracks.includes(publishedTrackType)),
        distinctUntilChanged(),
        skip(1),
        filter((isPublished) => isPublished),
      )
      .subscribe(() => {
        if (sourceChangeTimer || !audioElement.srcObject) return;
        if (sourceNode) return this.resumeAudioContext();
        if (audioElement.paused) playAudioElement();
      });

    const sinkIdSubscription = !this.speaker.state.isDeviceSelectionSupported
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
      audioElement.removeEventListener('playing', onPlaying);
      clearBlockedAudio();
      sinkIdSubscription?.unsubscribe();
      volumeSubscription.unsubscribe();
      updateMediaStreamSubscription.unsubscribe();
      republishSubscription.unsubscribe();
      clearTimeout(sourceChangeTimer);
      audioElement.srcObject = null;
      sourceNode?.disconnect();
      gainNode?.disconnect();
      this.disposePlaybackWatchdog(audioWatchdog);
      audioWatchdog = undefined;
    };
  };

  /**
   * Creates a playback watchdog that is re-armed whenever a media
   * interruption (backgrounding, phone call, Siri) ends.
   */
  private createPlaybackWatchdog = (opts: MediaPlaybackWatchdogOptions) => {
    const watchdog = new MediaPlaybackWatchdog({
      ...opts,
      isInterrupted: this.isPlaybackInterrupted,
      retryOnPause: !isIOS(),
      rearmDelay: isIOS() ? 1000 : 0,
    });
    this.playbackWatchdogs.add(watchdog);
    this.watchPageVisibility();
    return watchdog;
  };

  private disposePlaybackWatchdog = (watchdog?: MediaPlaybackWatchdog) => {
    if (!watchdog) return;
    watchdog.dispose();
    this.playbackWatchdogs.delete(watchdog);
  };

  /**
   * On iOS, a `play()` during an interruption (a phone call, an alarm,
   * another app holding the audio session, a hidden page) either takes the
   * session from that app or leaves the element silent, so recovery waits.
   */
  private isPlaybackInterrupted = () =>
    isIOS() && (sharedAudioContext.isInterrupted() || document.hidden);

  /**
   * After a phone call or an alarm, WebKit may resume a remote element whose
   * audio output failed to start, so the next rearm restarts every element.
   * An interruption that ends while the page stays visible produces no
   * visibility change, so its end re-arms playback itself.
   */
  private onAudioInterruptionChange = (
    interrupted: boolean,
    state: AudioContextState,
  ) => {
    this.tracer.trace('audioContext.interruption', { interrupted, state });
    if (interrupted) {
      this.restartOnRearm = true;
      return;
    }
    if (!document.hidden) this.rearmPlayback();
  };

  /**
   * Returning to the page ends the interruptions a hidden page causes.
   */
  private watchPageVisibility = () => {
    if (this.stopWatchingVisibility) return;
    const controller = new AbortController();
    document.addEventListener('visibilitychange', this.onPageVisibilityChange, {
      signal: controller.signal,
    });
    this.stopWatchingVisibility = () => controller.abort();
  };

  private onPageVisibilityChange = () => {
    if (!document.hidden) return this.rearmPlayback();
    if (isIOS()) this.silentAudioPlayer.pause();
  };

  /**
   * Audio rejected outside a user gesture starts on the next one: the silent
   * element and any paused or autoplay-blocked remote audio. A tap on the
   * visible page means the user is back, so it also lifts an interruption
   * WebKit never ended. A pending restart waits for the shared context to
   * run again. Skipped while a restart is in progress, which plays the
   * elements itself.
   */
  private watchGestures = () => {
    if (this.stopWatchingGestures) return;
    const onGesture = () => {
      if (document.hidden || this.restartTimer) return;
      sharedAudioContext.clearInterruption();
      this.silentAudioPlayer.resume();
      this.playbackWatchdogs.forEach((watchdog) => {
        if (watchdog.kind === 'audio') watchdog.playOnGesture();
      });
    };
    const controller = new AbortController();
    const options = { capture: true, passive: true, signal: controller.signal };
    ['click', 'touchend', 'keydown'].forEach((type) =>
      document.addEventListener(type, onGesture, options),
    );
    this.stopWatchingGestures = () => controller.abort();
  };

  private rearmPlayback = () => {
    const restart = this.restartOnRearm && sharedAudioContext.isRunning();
    sharedAudioContext.clearInterruption();
    this.tracer.trace('mediaPlayback.rearm', {
      count: this.playbackWatchdogs.size,
      restart,
    });
    if (restart) {
      this.clearRestartTimer();
      clearTimeout(this.silentAudioResumeTimer);
      this.silentAudioResumeTimer = undefined;
      this.restartTimer = setTimeout(this.restartAudioPlayback, 1000);
    } else if (isIOS()) {
      clearTimeout(this.silentAudioResumeTimer);
      this.silentAudioResumeTimer = setTimeout(() => {
        this.silentAudioResumeTimer = undefined;
        if (!this.isPlaybackInterrupted()) this.silentAudioPlayer.resume();
      }, 1000);
    }
    this.playbackWatchdogs.forEach((watchdog) => {
      if (restart && watchdog.kind === 'audio') return watchdog.cancel();
      watchdog.rearm();
    });
  };

  /**
   * After a phone call or an alarm, WebKit may resume remote audio whose
   * output failed to start, and only rebuilds that output once every
   * MediaStream audio element of the page has stopped: they all share one
   * output unit. So the silent element and every remote audio element
   * pause together, then play again. A hidden page or a new interruption
   * keeps the restart pending for the next rearm.
   */
  private restartAudioPlayback = () => {
    this.restartTimer = undefined;
    if (this.isPlaybackInterrupted()) return;
    this.restartOnRearm = false;
    const watchdogs = [...this.playbackWatchdogs].filter(
      (watchdog) => watchdog.kind === 'audio',
    );

    this.tracer.trace('mediaPlayback.restart', { count: watchdogs.length });
    this.silentAudioPlayer.hold();
    watchdogs.forEach((watchdog) => watchdog.pauseForRestart());
    this.restartTimer = setTimeout(() => {
      watchdogs.forEach((watchdog) => watchdog.playNow());
      this.restartTimer = setTimeout(() => {
        this.restartTimer = undefined;
        this.silentAudioPlayer.release();
        if (!this.isPlaybackInterrupted()) this.silentAudioPlayer.resume();
      }, 500);
    }, 100);
  };

  private clearRestartTimer = () => {
    if (!this.restartTimer) return;
    clearTimeout(this.restartTimer);
    this.restartTimer = undefined;
    this.silentAudioPlayer.release();
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
