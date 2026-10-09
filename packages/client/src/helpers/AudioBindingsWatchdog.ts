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

type AudioElementState = {
  paused: boolean;
  muted: boolean;
  volume: number;
  readyState: number;
  sinkId?: string;
  track: { enabled: boolean; muted: boolean; readyState: string } | null;
};

const toElementState = (element: HTMLAudioElement): AudioElementState => {
  const stream = element.srcObject as MediaStream | null;
  const [track] = stream?.getAudioTracks?.() ?? [];
  return {
    paused: element.paused,
    muted: element.muted,
    volume: Math.round(element.volume * 100) / 100,
    readyState: element.readyState,
    sinkId: element.sinkId,
    track: track
      ? {
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
        }
      : null,
  };
};

/**
 * Tracks audio element bindings and periodically warns about
 * remote participants whose audio streams have no bound element.
 * On the same tick, it traces the playback state of the bound elements,
 * limited to the bindings whose state changed since the previous trace.
 */
export class AudioBindingsWatchdog {
  private bindings = new Map<string, HTMLAudioElement>();
  private tracedStates = new Map<string, string>();
  private enabled = true;
  private watchdogInterval?: NodeJS.Timeout;
  private readonly unsubscribeCallingState: () => void;
  private logger = videoLoggerSystem.getLogger('AudioBindingsWatchdog');

  private readonly state: CallState;
  private readonly tracer: Tracer;

  constructor(state: CallState, tracer: Tracer) {
    this.tracer = tracer;
    this.state = state;
    this.unsubscribeCallingState = createSubscription(
      state.callingState$,
      (callingState) => {
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
    element: HTMLAudioElement,
    sessionId: string,
    trackType: AudioTrackType,
  ) => {
    const key = toBindingKey(sessionId, trackType);
    const existing = this.bindings.get(key);
    if (existing && existing !== element) {
      this.logger.warn(
        `Audio element already bound to ${sessionId} and ${trackType}`,
      );
      this.tracer.trace('audioBinding.alreadyBoundWarning', trackType);
    }
    this.bindings.set(key, element);
  };

  /**
   * Removes the audio element binding for the given session and track type.
   */
  unregister = (sessionId: string, trackType: AudioTrackType) => {
    this.bindings.delete(toBindingKey(sessionId, trackType));
  };

  /**
   * Enables or disables the dangling binding warnings.
   * Bindings are still tracked and their playback state is still traced.
   */
  setEnabled = (enabled: boolean) => {
    this.enabled = enabled;
    if (enabled) {
      this.start();
    } else if (this.state.callingState !== CallingState.JOINED) {
      this.stop();
    }
  };

  /**
   * Stops the watchdog and unsubscribes from callingState changes.
   */
  dispose = () => {
    this.stop();
    this.bindings.clear();
    this.tracedStates.clear();
    this.unsubscribeCallingState();
  };

  private start = () => {
    clearInterval(this.watchdogInterval);
    this.watchdogInterval = setInterval(() => {
      if (this.enabled) this.warnAboutDanglingBindings();
      this.traceBindingStates();
    }, 3000);
  };

  private warnAboutDanglingBindings = () => {
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
  };

  private traceBindingStates = () => {
    const changes: Record<string, AudioElementState | null> = {};
    let hasChanges = false;
    for (const [key, element] of this.bindings) {
      const state = toElementState(element);
      const serialized = JSON.stringify(state);
      if (this.tracedStates.get(key) === serialized) continue;
      this.tracedStates.set(key, serialized);
      changes[key] = state;
      hasChanges = true;
    }
    for (const key of this.tracedStates.keys()) {
      if (this.bindings.has(key)) continue;
      this.tracedStates.delete(key);
      changes[key] = null;
      hasChanges = true;
    }
    if (hasChanges) this.tracer.trace('audioBinding.state', changes);
  };

  private stop = () => {
    clearInterval(this.watchdogInterval);
  };
}
