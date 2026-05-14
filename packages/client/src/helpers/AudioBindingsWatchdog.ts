import type { AudioTrackType } from '../types';
import { CallingState, CallState } from '../store';
import { createSubscription } from '../store/rxUtils';
import { videoLoggerSystem } from '../logger';
import { Tracer } from '../stats';
import { TrackType } from '../gen/video/sfu/models/models';

const toBindingKey = (
  sessionId: string,
  trackType: AudioTrackType = 'audioTrack',
) => `${sessionId}/${trackType}`;

type Binding = {
  element: HTMLAudioElement;
  onPause: () => void;
  onPlay: () => void;
};

export type OnElementPausedChange = (
  audioElement: HTMLAudioElement,
  paused: boolean,
) => void;

/**
 * Tracks audio element bindings and periodically warns about
 * remote participants whose audio streams have no bound element.
 */
export class AudioBindingsWatchdog {
  private bindings = new Map<string, Binding>();
  private enabled = true;
  private watchdogInterval?: NodeJS.Timeout;
  private readonly unsubscribeCallingState: () => void;
  private logger = videoLoggerSystem.getLogger('AudioBindingsWatchdog');

  private readonly state: CallState;
  private readonly tracer: Tracer;
  private readonly onElementPausedChange: OnElementPausedChange;

  constructor(
    state: CallState,
    tracer: Tracer,
    onElementPausedChange: OnElementPausedChange,
  ) {
    this.tracer = tracer;
    this.state = state;
    this.onElementPausedChange = onElementPausedChange;
    this.unsubscribeCallingState = createSubscription(
      state.callingState$,
      (callingState) => {
        if (!this.enabled) return;
        if (callingState !== CallingState.JOINED) {
          this.stop();
        } else {
          this.start();
        }
      },
    );
  }

  /**
   * Registers an audio element binding for the given session and track type.
   * Warns if a different element is already bound to the same key.
   */
  register = (
    audioElement: HTMLAudioElement,
    sessionId: string,
    trackType: AudioTrackType,
  ) => {
    const key = toBindingKey(sessionId, trackType);
    const existing = this.bindings.get(key);
    if (existing && existing.element !== audioElement) {
      this.logger.warn(
        `Audio element already bound to ${sessionId} and ${trackType}`,
      );
      this.tracer.trace('audioBinding.alreadyBoundWarning', trackType);
      this.detachPlaybackListeners(existing);
      // The replaced element may have last reported paused=true; clear it so
      // downstream audio-health doesn't stay stuck until the new element
      // happens to fire `play`.
      this.onElementPausedChange(existing.element, false);
    } else if (existing && existing.element === audioElement) {
      // Same element re-registered - drop stale listeners before re-binding.
      this.detachPlaybackListeners(existing);
    }
    const onPause = () => {
      // Benign pauses (unbind sets `srcObject = null`, end-of-stream
      // leaves only ended tracks) shouldn't reach the consumer.
      // They would cause a brief unhealthy flap that immediately
      // gets cleared by the subsequent `unregister`.
      const srcObject = audioElement.srcObject as MediaStream | null;
      const tracks = srcObject?.getTracks();
      if (!tracks?.some((t) => t.readyState === 'live')) return;
      this.onElementPausedChange(audioElement, true);
    };
    const onPlay = () => {
      this.onElementPausedChange(audioElement, false);
    };
    audioElement.addEventListener('pause', onPause);
    audioElement.addEventListener('play', onPlay);
    this.bindings.set(key, { element: audioElement, onPause, onPlay });
    // `pause` only fires on transitions, so an element that's already
    // paused at register time (e.g., re-register during an iOS audio
    // session interruption, or a fresh element bound while the session
    // is still recovering) would never reach MediaHealthMonitor. Cover
    // that case by handing the element to the tracker directly.
    if (audioElement.paused) {
      const srcObject = audioElement.srcObject as MediaStream | null;
      const tracks = srcObject?.getTracks();
      if (tracks?.some((t) => t.readyState === 'live')) {
        this.onElementPausedChange(audioElement, true);
      }
    }
  };

  /**
   * Removes the audio element binding for the given session and track type.
   */
  unregister = (sessionId: string, trackType: AudioTrackType) => {
    const key = toBindingKey(sessionId, trackType);
    const existing = this.bindings.get(key);
    if (existing) {
      this.detachPlaybackListeners(existing);
      this.onElementPausedChange(existing.element, false);
    }
    this.bindings.delete(key);
  };

  /**
   * Enables or disables the watchdog.
   * When disabled, the periodic check stops but bindings are still tracked.
   */
  setEnabled = (enabled: boolean) => {
    this.enabled = enabled;
    if (enabled) {
      this.start();
    } else {
      this.stop();
    }
  };

  /**
   * Stops the watchdog and unsubscribes from callingState changes.
   */
  dispose = () => {
    this.stop();
    for (const binding of this.bindings.values()) {
      this.detachPlaybackListeners(binding);
      this.onElementPausedChange(binding.element, false);
    }
    this.bindings.clear();
    this.unsubscribeCallingState();
  };

  private detachPlaybackListeners = (binding: Binding) => {
    const { onPause, element, onPlay } = binding;
    element.removeEventListener('pause', onPause);
    element.removeEventListener('play', onPlay);
  };

  private start = () => {
    clearInterval(this.watchdogInterval);
    this.watchdogInterval = setInterval(() => {
      const danglingUserIds: string[] = [];
      for (const p of this.state.participants) {
        if (p.isLocalParticipant) continue;
        const {
          audioStream,
          screenShareAudioStream,
          sessionId,
          userId,
          publishedTracks,
        } = p;
        if (
          audioStream &&
          publishedTracks.includes(TrackType.AUDIO) &&
          !this.bindings.has(toBindingKey(sessionId))
        ) {
          danglingUserIds.push(userId);
        }
        if (
          screenShareAudioStream &&
          publishedTracks.includes(TrackType.SCREEN_SHARE_AUDIO) &&
          !this.bindings.has(toBindingKey(sessionId, 'screenShareAudioTrack'))
        ) {
          danglingUserIds.push(userId);
        }
      }
      if (danglingUserIds.length > 0) {
        const key = 'audioBinding.danglingWarning';
        this.tracer.traceOnce(key, key, danglingUserIds);
        this.logger.warn(
          `Dangling audio bindings detected. Did you forget to bind the audio element? user_ids: ${danglingUserIds}.`,
        );
      }
    }, 3000);
  };

  private stop = () => {
    clearInterval(this.watchdogInterval);
  };
}
