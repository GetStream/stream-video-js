import {
  AudioTrackType,
  DebounceType,
  VideoTrackType,
  VisibilityState,
} from '../types';
import { VideoDimension } from '../gen/video/sfu/models/models';
import type { BlockedAudioTracker } from './BlockedAudioTracker';
import { MediaPlaybackWatchdog } from './MediaPlaybackWatchdog';
import type { TrackSubscriptionManager } from './TrackSubscriptionManager';
import { isFirefox, isSafari } from './browsers';
import { hasScreenShare, hasVideo } from './participantUtils';
import { CallState, type CallStateShape } from '../store';
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

    const { isLocalParticipant } = boundParticipant;
    const isVideoTrack = trackType === 'videoTrack';
    const trackKey = isVideoTrack ? 'videoStream' : 'screenShareStream';

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

    const elementDimensions = (): VideoDimension => ({
      width: videoElement.clientWidth,
      height: videoElement.clientHeight,
    });

    const attachStream = (source: MediaStream | undefined) => {
      videoElement.srcObject = source ?? null;
      if (!isSafari() && !isFirefox()) return;
      setTimeout(async () => {
        videoElement.srcObject = source ?? null;
        try {
          await timeboxed([videoElement.play()], 2000);
        } catch (e) {
          this.logger.warn(`Failed to play stream`, e);
        }
      }, 25);
    };

    // What we last acted on. Comparing against these is the job a deduplicating
    // stream per concern used to do; keeping them here lets the whole binding
    // run off a single store subscription instead of one per concern.
    //
    // Assigning before acting also matters: `requestTrackWithDimensions` writes
    // to the call state, which re-enters this handler synchronously. The
    // comparisons are what stop that recursing.
    let stream: MediaStream | undefined;
    let isPublishing: boolean | undefined;
    let viewportVisibilityState: VisibilityState | undefined;

    // Every bound element subscribes to the whole store, so an unrelated write
    // (a stats report, a closed caption) would otherwise wake all of them. The
    // index only changes when the participant list does, which is the only
    // thing this binding reacts to.
    let lastIndex: CallStateShape['participantsBySessionId'] | undefined;

    const onCallStateChange = (state: CallStateShape) => {
      if (state.participantsBySessionId === lastIndex) return;
      lastIndex = state.participantsBySessionId;
      // constant-time lookup; the index is maintained by the call state, so
      // binding many elements does not turn each update into a full array scan
      const participant = state.participantsBySessionId[sessionId];
      // the participant left - the caller unbinds us
      if (!participant) return;

      const nextStream = participant[trackKey];
      if (nextStream !== stream) {
        stream = nextStream;
        attachStream(nextStream);
      }

      // the rest is bandwidth management, which does not apply to our own video
      if (isLocalParticipant) return;

      const nextIsPublishing = isVideoTrack
        ? hasVideo(participant)
        : hasScreenShare(participant);
      if (nextIsPublishing !== isPublishing) {
        isPublishing = nextIsPublishing;
        if (nextIsPublishing) {
          // the participant just started to publish a track
          requestTrackWithDimensions(
            DebounceType.IMMEDIATE,
            elementDimensions(),
          );
        } else {
          // the participant just stopped publishing a track
          requestTrackWithDimensions(DebounceType.FAST, undefined);
        }
      }

      // Visibility only matters for plain-JS integrations: the React SDK
      // removes the element from the DOM on visibility change, which unbinds
      // it before this can fire.
      const nextVisibility =
        participant.viewportVisibilityState?.[trackType] ??
        VisibilityState.UNKNOWN;
      if (nextVisibility !== viewportVisibilityState) {
        const isInitialValue = viewportVisibilityState === undefined;
        viewportVisibilityState = nextVisibility;
        if (!isInitialValue) {
          requestTrackWithDimensions(
            DebounceType.MEDIUM,
            nextVisibility === VisibilityState.INVISIBLE
              ? undefined
              : elementDimensions(),
          );
        }
      }
    };

    let lastDimensions: VideoDimension | undefined;
    const resizeObserver = isLocalParticipant
      ? null
      : new ResizeObserver(() => {
          const currentDimensions = elementDimensions();

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
          requestTrackWithDimensions(debounceType, currentDimensions);
          lastDimensions = currentDimensions;
        });
    resizeObserver?.observe(videoElement);

    videoElement.autoplay = true;
    videoElement.playsInline = true;

    // explicitly marking the element as muted will allow autoplay to work
    // without prior user interaction:
    // https://developer.mozilla.org/en-US/docs/Web/Media/Autoplay_guide
    videoElement.muted = true;

    const playbackWatchdog = new MediaPlaybackWatchdog({
      element: videoElement,
      kind: 'video',
      tracer: this.tracer,
    });

    const unsubscribe = this.callState.store.subscribe(onCallStateChange);

    return () => {
      requestTrackWithDimensions(DebounceType.FAST, undefined);
      unsubscribe();
      resizeObserver?.disconnect();
      playbackWatchdog.dispose();
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
    // a snapshot, used only to decide whether this element is worth binding;
    // everything below re-reads the participant from the store
    const boundParticipant =
      this.callState.findParticipantBySessionId(sessionId);
    if (!boundParticipant || boundParticipant.isLocalParticipant) return;

    const isAudioTrack = trackType === 'audioTrack';
    const trackKey = isAudioTrack ? 'audioStream' : 'screenShareAudioStream';

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
    let audioWatchdog: MediaPlaybackWatchdog | undefined = undefined;

    const clearBlockedAudio = () => {
      if (!this.blockedAudioTracker.isBlocked(audioElement)) return;
      this.blockedAudioTracker.markBlocked(audioElement, false);
    };
    audioElement.addEventListener('playing', clearBlockedAudio);

    const attachStream = (source: MediaStream | undefined) => {
      setTimeout(() => {
        audioElement.srcObject = source ?? null;
        audioWatchdog?.dispose();
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
          gainNode.gain.value = currentVolume();
          sourceNode.connect(gainNode).connect(audioContext.destination);
          this.resumeAudioContext();
        } else {
          // we will play audio directly through the audio element in other browsers
          audioElement.muted = false;
          audioElement.play().catch((e) => {
            this.tracer.trace('audioPlaybackError', e.message);
            if (e.name === 'NotAllowedError') {
              this.tracer.trace('audioPlaybackBlocked', null);
              this.blockedAudioTracker.markBlocked(
                audioElement,
                true,
                sessionId,
              );
            }
            this.logger.warn(`Failed to play audio stream`, e);
          });
          audioWatchdog = new MediaPlaybackWatchdog({
            element: audioElement,
            kind: 'audio',
            tracer: this.tracer,
            isBlocked: () => this.blockedAudioTracker.isBlocked(audioElement),
          });
        }

        const { selectedDevice } = this.speaker.state;
        if (selectedDevice) updateSinkId(selectedDevice, audioContext);
      });
    };

    // A per-participant override wins over the speaker-wide volume. Both live
    // in stores, so this reads them directly rather than combining two sources
    // into a third.
    //
    // Note this re-reads the participant rather than closing over the one
    // captured above: that one is a snapshot taken when the element was bound,
    // and `audioVolume` changes over the life of the call.
    const currentVolume = () => {
      const { participantsBySessionId } = this.callState.store.getLatestValue();
      return (
        participantsBySessionId[sessionId]?.audioVolume ??
        this.speaker.state.volume
      );
    };

    // What we last acted on - see the note in `bindVideoElement`.
    let stream: MediaStream | undefined;
    let appliedVolume: number | undefined;
    let appliedSinkId: string | undefined;

    const applyVolume = () => {
      const volume = currentVolume();
      if (volume === appliedVolume) return;
      appliedVolume = volume;
      audioElement.volume = volume;
      if (gainNode) gainNode.gain.value = volume;
    };

    // see the note in `bindVideoElement`: skip wakes that cannot have moved a
    // participant, since every bound element sees every store write
    let lastIndex: CallStateShape['participantsBySessionId'] | undefined;
    const unsubscribeCallState = this.callState.store.subscribe((state) => {
      if (state.participantsBySessionId === lastIndex) return;
      lastIndex = state.participantsBySessionId;
      const participant = state.participantsBySessionId[sessionId];
      const nextStream = participant?.[trackKey];
      if (nextStream !== stream) {
        stream = nextStream;
        attachStream(nextStream);
      }
      applyVolume();
    });

    const canSetSinkId = 'setSinkId' in audioElement;
    const unsubscribeSpeaker = this.speaker.state.store.subscribe(
      ({ selectedDevice }) => {
        if (canSetSinkId && selectedDevice !== appliedSinkId) {
          appliedSinkId = selectedDevice;
          updateSinkId(selectedDevice, this.getOrCreateAudioContext());
        }
        applyVolume();
      },
    );

    audioElement.autoplay = true;

    return () => {
      audioElement.removeEventListener('playing', clearBlockedAudio);
      clearBlockedAudio();
      unsubscribeCallState();
      unsubscribeSpeaker();
      audioElement.srcObject = null;
      sourceNode?.disconnect();
      gainNode?.disconnect();
      audioWatchdog?.dispose();
      audioWatchdog = undefined;
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
