import { HLSPlayer, type HlsPlayerSample } from './HLSPlayer';
import type { HlsJsConstructor, HlsPlayback } from './types';
import { HlsStatsReporter, HlsStatsTracer } from '../stats/hls';
import type { CallState } from '../store';
import type { StreamClient } from '../coordinator/connection/client';
import type { JoinCallResponse, StatsOptions } from '../gen/coordinator';
import { isHttpsUrl } from '../coordinator/connection/utils';
import type { ClientDetails } from '../gen/video/sfu/models/models';
import type {
  HLSPlaybackResponseShim,
  HLSStatsOptionsShim,
  JoinCallResponseShim,
  PlaybackResponse,
} from '../gen/shims';
import type { SpeakerState } from '../devices/SpeakerState';
import type { BlockedAudioTracker } from '../helpers/BlockedAudioTracker';
import { videoLoggerSystem } from '../logger';

export type HlsPlaybackManagerOptions = {
  state: CallState;
  speaker: SpeakerState;
  blockedAudioTracker: BlockedAudioTracker;
  streamClient: StreamClient;
  callType: string;
  callId: string;
};

/** What the HLS stats reports need from the join that sent this viewer to HLS. */
type JoinStats = {
  options: StatsOptions & HLSStatsOptionsShim;
  statsToken: string | undefined;
  callSessionId: string | undefined;
  unifiedSessionId: string | undefined;
  clientDetails: ClientDetails;
};

/** One player, playing one playlist URL. */
type Player = { url: string; hls: unknown; stop: () => void };

/**
 * Plays a call's HLS stream: one player at a time, connected to the call
 * state, the speaker, the blocked-autoplay tracker and the HLS stats.
 */
export class HlsPlaybackManager {
  private readonly logger = videoLoggerSystem.getLogger('HlsPlaybackManager');
  private readonly state: CallState;
  private readonly speaker: SpeakerState;
  private readonly blockedAudioTracker: BlockedAudioTracker;
  private readonly streamClient: StreamClient;
  private readonly callType: string;
  private readonly callId: string;

  /** Kept from the join that sent this viewer to HLS. */
  private joinStats?: JoinStats;
  /** Stops the registered player, if any. */
  private unregisterPlayer?: () => void;

  constructor(options: HlsPlaybackManagerOptions) {
    this.state = options.state;
    this.speaker = options.speaker;
    this.blockedAudioTracker = options.blockedAudioTracker;
    this.streamClient = options.streamClient;
    this.callType = options.callType;
    this.callId = options.callId;
  }

  /**
   * Applies the join that sent this viewer to HLS: moves the call to HLS
   * playback of the granted playlist, and keeps what the HLS stats need.
   *
   * @throws when the playlist URL isn't an https URL.
   */
  join = (
    joinResponse: JoinCallResponse & JoinCallResponseShim,
    clientDetails: ClientDetails,
    unifiedSessionId: string | undefined,
  ) => {
    const playback = joinResponse.playback as
      (PlaybackResponse & HLSPlaybackResponseShim) | undefined;
    const playlistUrl = playback?.playlist_url ?? '';
    // the URL is signed, so the error doesn't echo it
    if (!isHttpsUrl(playlistUrl)) {
      throw new Error('Received an HLS playback grant without an https URL');
    }
    // before the playback type, so a player registered on it reports stats
    this.joinStats = {
      options: joinResponse.stats_options,
      statsToken: playback?.stats_token,
      callSessionId: joinResponse.call.session?.id,
      unifiedSessionId,
      clientDetails,
    };
    this.state.setPlaybackType({ type: 'hls', playlistUrl });
  };

  /**
   * Plays the call's HLS stream in `videoElement`, and follows it to its new
   * URL when the broadcast restarts. A new registration replaces the previous
   * one. See `Call.registerHlsPlayer()`.
   */
  register = <H extends HlsJsConstructor>(
    Hls: H,
    videoElement: HTMLVideoElement,
  ): HlsPlayback<H> => {
    const { playbackType } = this.state;
    if (playbackType.type !== 'hls') {
      throw new Error('The call is not on HLS playback');
    }
    this.unregisterPlayer?.();

    let player = this.play(Hls, videoElement, playbackType.playlistUrl);
    const unbindSpeaker = this.bindSpeaker(videoElement);
    // a restarted broadcast plays from a new URL, in the same <video>
    const subscription = this.state.playbackType$.subscribe((next) => {
      if (next.type !== 'hls' || next.playlistUrl === player.url) return;
      player.stop();
      try {
        player = this.play(Hls, videoElement, next.playlistUrl);
      } catch (err) {
        this.logger.error('Failed to play the restarted HLS stream', err);
      }
    });

    let unregistered = false;
    const unregister = () => {
      if (unregistered) return;
      unregistered = true;
      if (this.unregisterPlayer === unregister) {
        this.unregisterPlayer = undefined;
      }
      subscription.unsubscribe();
      player.stop();
      unbindSpeaker();
    };
    this.unregisterPlayer = unregister;

    return {
      get hls() {
        return player.hls as InstanceType<H> | undefined;
      },
      unregister,
    };
  };

  /** Stops the player, if one plays, and forgets the stats options. */
  dispose = () => {
    this.unregisterPlayer?.();
    this.joinStats = undefined;
    if (this.state.playbackType.type === 'hls') {
      this.state.setPlaybackType({ type: 'webrtc' });
    }
  };

  /** Starts a player on `url`, with its own stats session. */
  private play = (
    Hls: HlsJsConstructor,
    videoElement: HTMLVideoElement,
    url: string,
  ): Player => {
    const stats = this.createStats(() => player.sample());

    const player = new HLSPlayer(Hls, videoElement, url, {
      onStateChange: (state) => {
        stats?.tracer.onState(state);
        if (state === 'playing') {
          // started some other way, e.g. by the app's own play button
          unmarkBlocked();
          this.state.setHlsPlaybackError(undefined);
        }
        // the stream ended: stop reporting, the viewer stays on the last frame
        if (state === 'ended') void stats?.reporter.stop();
        this.state.setHlsPlaybackState(state);
      },
      onError: (error) => {
        this.logger.error(error.message, error);
        unmarkBlocked(); // nothing left to resume
        void stats?.reporter.fail(error.code);
        // the player is stopped: its last state no longer holds
        this.state.setHlsPlaybackState(undefined);
        this.state.setHlsPlaybackError(error);
      },
      onAutoplayBlocked: () => {
        // The same signal as blocked WebRTC audio: `autoplayBlocked$` turns
        // true, and `call.resumeAudio()` or any tap on the page starts it.
        this.blockedAudioTracker.markBlocked(
          videoElement,
          true,
          undefined,
          () => videoElement.play(),
        );
      },
    });
    const unmarkBlocked = () => {
      if (this.blockedAudioTracker.isBlocked(videoElement)) {
        this.blockedAudioTracker.markBlocked(videoElement, false);
      }
    };

    this.state.setHlsPlaybackState('loading');
    stats?.reporter.start();

    let stopped = false;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      // the final stats report samples the player, so before it is destroyed
      void stats?.reporter.stop();
      player.destroy();
      unmarkBlocked();
      this.state.setHlsPlaybackState(undefined);
      this.state.setHlsPlaybackError(undefined);
    };

    try {
      player.start();
    } catch (err) {
      stop(); // the caller gets no `unregister` to clean up with
      throw err;
    }

    return { url, hls: player.getHls(), stop };
  };

  /**
   * The stats tracer and reporter of a player, or undefined when HLS stats
   * are off or the join didn't sign a stats token.
   */
  private createStats = (samplePlayer: () => HlsPlayerSample) => {
    const { joinStats } = this;
    if (
      !joinStats ||
      joinStats.options?.enable_hls_stats === false ||
      !joinStats.statsToken ||
      !joinStats.callSessionId ||
      !joinStats.unifiedSessionId
    ) {
      return undefined;
    }
    const tracer = new HlsStatsTracer();
    const reporter = new HlsStatsReporter(this.streamClient, {
      ...joinStats,
      statsToken: joinStats.statsToken,
      callSessionId: joinStats.callSessionId,
      unifiedSessionId: joinStats.unifiedSessionId,
      callType: this.callType,
      callId: this.callId,
      tracer,
      sample: () => ({ ...tracer.sample(), ...samplePlayer() }),
    });
    return { tracer, reporter };
  };

  /**
   * Plays the stream on the call's speaker, as participants' audio is on
   * WebRTC: the output device of `call.speaker.select()` and the volume of
   * `call.speaker.setVolume()`.
   *
   * @returns a function that stops following the speaker.
   */
  private bindSpeaker = (videoElement: HTMLVideoElement) => {
    const { speaker } = this;
    const sinkSubscription = speaker.isDeviceSelectionSupported
      ? speaker.selectedDevice$.subscribe((deviceId) => {
          if (!('setSinkId' in videoElement)) return;
          if (videoElement.sinkId === deviceId) return;
          videoElement.setSinkId(deviceId).catch((err) => {
            this.logger.warn(`Can't set the HLS output device`, err);
          });
        })
      : undefined;
    const volumeSubscription = speaker.volume$.subscribe((volume) => {
      videoElement.volume = volume;
    });
    return () => {
      sinkSubscription?.unsubscribe();
      volumeSubscription.unsubscribe();
    };
  };
}
