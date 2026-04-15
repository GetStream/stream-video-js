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

/**
 * Tracks audio element bindings and periodically warns about
 * remote participants whose audio streams have no bound element.
 */
export class AudioBindingsWatchdog {
  private bindings = new Map<string, HTMLAudioElement>();
  private enabled = true;
  private watchdogInterval?: NodeJS.Timeout;
  private readonly unsubscribeCallingState: () => void;
  private logger = videoLoggerSystem.getLogger('AudioBindingsWatchdog');

  constructor(
    private state: CallState,
    private tracer: Tracer,
  ) {
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
    if (existing && existing !== audioElement) {
      this.logger.warn(
        `Audio element already bound to ${sessionId} and ${trackType}`,
      );
      this.tracer.trace('audioBinding.alreadyBoundWarning', trackType);
    }
    this.bindings.set(key, audioElement);
  };

  /**
   * Removes the audio element binding for the given session and track type.
   */
  unregister = (sessionId: string, trackType: AudioTrackType) => {
    this.bindings.delete(toBindingKey(sessionId, trackType));
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
    this.unsubscribeCallingState();
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
