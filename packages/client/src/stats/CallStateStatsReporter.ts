import type {
  AggregatedStatsReport,
  BaseStats,
  ParticipantsStatsReport,
  RTCMediaSourceStats,
  StatsReport,
} from './types';
import { CallState } from '../store';
import { Publisher, Subscriber } from '../rtc';
import { getLogger } from '../logger';
import { flatten } from './utils';
import { TrackType } from '../gen/video/sfu/models/models';
import { isFirefox } from '../helpers/browsers';

export type StatsReporterOpts = {
  subscriber: Subscriber;
  publisher?: Publisher;
  state: CallState;
  datacenter: string;
  pollingIntervalInMs?: number;
};

export type StatsReporter = {
  /**
   * Will turn on stats reporting for a given sessionId.
   *
   * @param sessionId the session id.
   */
  startReportingStatsFor: (sessionId: string) => void;

  /**
   * Will turn off stats reporting for a given sessionId.
   *
   * @param sessionId the session id.
   */
  stopReportingStatsFor: (sessionId: string) => void;

  /**
   * Helper method for retrieving stats for a given peer connection kind
   * and media stream flowing through it.
   *
   * @param kind the peer connection kind (subscriber or publisher).
   * @param mediaStream the media stream.
   */
  getStatsForStream: (
    kind: 'subscriber' | 'publisher',
    tracks: MediaStreamTrack[],
  ) => Promise<StatsReport[]>;

  /**
   * Helper method for retrieving raw stats for a given peer connection kind.
   *
   * @param kind the peer connection kind (subscriber or publisher).
   * @param selector the track selector. If not provided, stats for all tracks will be returned.
   */
  getRawStatsForTrack: (
    kind: 'subscriber' | 'publisher',
    selector?: MediaStreamTrack,
  ) => Promise<RTCStatsReport | undefined>;

  /**
   * Stops the stats reporter and releases all resources.
   */
  stop: () => void;
};

/**
 * Creates a new StatsReporter instance that collects metrics about the ongoing call and reports them to the state store
 */
export const createStatsReporter = ({
  subscriber,
  publisher,
  state,
  datacenter,
  pollingIntervalInMs = 2000,
}: StatsReporterOpts): StatsReporter => {
  const logger = getLogger(['stats']);
  const getRawStatsForTrack = async (
    kind: 'subscriber' | 'publisher',
    selector?: MediaStreamTrack,
  ) => {
    if (kind === 'subscriber' && subscriber) {
      return subscriber.getStats(selector);
    } else if (kind === 'publisher' && publisher) {
      return publisher.getStats(selector);
    } else {
      return undefined;
    }
  };

  const getStatsForStream = async (
    kind: 'subscriber' | 'publisher',
    tracks: MediaStreamTrack[],
  ) => {
    const pc = kind === 'subscriber' ? subscriber : publisher;
    if (!pc) return [];
    const statsForStream: StatsReport[] = [];
    for (const track of tracks) {
      const report = await pc.getStats(track);
      const stats = transform(report, {
        trackKind: track.kind as 'audio' | 'video',
        kind,
        publisher: undefined,
      });
      statsForStream.push(stats);
    }
    return statsForStream;
  };

  const startReportingStatsFor = (sessionId: string) => {
    sessionIdsToTrack.add(sessionId);
    void run();
  };

  const stopReportingStatsFor = (sessionId: string) => {
    sessionIdsToTrack.delete(sessionId);
    void run();
  };

  const sessionIdsToTrack = new Set<string>();

  /**
   * The main stats reporting loop.
   */
  const run = async () => {
    const participantStats: ParticipantsStatsReport = {};
    if (sessionIdsToTrack.size > 0) {
      const sessionIds = new Set(sessionIdsToTrack);
      for (const participant of state.participants) {
        if (!sessionIds.has(participant.sessionId)) continue;
        const {
          audioStream,
          isLocalParticipant,
          sessionId,
          userId,
          videoStream,
        } = participant;
        const kind = isLocalParticipant ? 'publisher' : 'subscriber';
        try {
          const tracks = isLocalParticipant
            ? publisher?.getPublishedTracks() || []
            : [
                ...(videoStream?.getVideoTracks() || []),
                ...(audioStream?.getAudioTracks() || []),
              ];
          participantStats[sessionId] = await getStatsForStream(kind, tracks);
        } catch (e) {
          logger('warn', `Failed to collect ${kind} stats for ${userId}`, e);
        }
      }
    }

    const [subscriberStats, publisherStats] = await Promise.all([
      subscriber
        .getStats()
        .then((report) =>
          transform(report, {
            kind: 'subscriber',
            trackKind: 'video',
            publisher,
          }),
        )
        .then(aggregate),
      publisher
        ? publisher
            .getStats()
            .then((report) =>
              transform(report, {
                kind: 'publisher',
                trackKind: 'video',
                publisher,
              }),
            )
            .then(aggregate)
        : getEmptyStats(),
    ]);

    const [subscriberRawStats, publisherRawStats] = await Promise.all([
      getRawStatsForTrack('subscriber'),
      publisher ? getRawStatsForTrack('publisher') : undefined,
    ]);

    state.setCallStatsReport({
      datacenter,
      publisherStats,
      subscriberStats,
      subscriberRawStats,
      publisherRawStats,
      participants: participantStats,
      timestamp: Date.now(),
    });
  };

  let timeoutId: NodeJS.Timeout | undefined;
  if (pollingIntervalInMs > 0) {
    const loop = async () => {
      await run().catch((e) => {
        logger('debug', 'Failed to collect stats', e);
      });
      timeoutId = setTimeout(loop, pollingIntervalInMs);
    };
    void loop();
  }

  const stop = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };

  return {
    getRawStatsForTrack,
    getStatsForStream,
    startReportingStatsFor,
    stopReportingStatsFor,
    stop,
  };
};

export type StatsTransformOpts = {
  /**
   * The kind of track we are transforming stats for.
   */
  trackKind: 'audio' | 'video';
  /**
   * The kind of peer connection we are transforming stats for.
   */
  kind: 'subscriber' | 'publisher';
  /**
   * The publisher instance.
   */
  publisher: Publisher | undefined;
};

/**
 * Transforms raw RTC stats into a slimmer and uniform across browsers format.
 *
 * @param report the report to transform.
 * @param opts the transform options.
 */
const transform = (
  report: RTCStatsReport,
  opts: StatsTransformOpts,
): StatsReport => {
  const { trackKind, kind, publisher } = opts;
  const direction = kind === 'subscriber' ? 'inbound-rtp' : 'outbound-rtp';
  const stats = flatten(report);
  const streams = stats
    .filter(
      (stat) =>
        stat.type === direction &&
        (stat as RTCRtpStreamStats).kind === trackKind,
    )
    .map((stat): BaseStats => {
      const rtcStreamStats = stat as RTCInboundRtpStreamStats &
        RTCOutboundRtpStreamStats;

      const codec = stats.find(
        (s) => s.type === 'codec' && s.id === rtcStreamStats.codecId,
      ) as RTCRtpCodec | undefined;

      const transport = stats.find(
        (s) => s.type === 'transport' && s.id === rtcStreamStats.transportId,
      ) as RTCTransportStats | undefined;

      let roundTripTime: number | undefined;
      if (transport && transport.dtlsState === 'connected') {
        const candidatePair = stats.find(
          (s) =>
            s.type === 'candidate-pair' &&
            s.id === transport.selectedCandidatePairId,
        ) as RTCIceCandidatePairStats | undefined;
        roundTripTime = candidatePair?.currentRoundTripTime;
      }

      let trackType: TrackType | undefined;
      if (kind === 'publisher' && publisher) {
        const firefox = isFirefox();
        const mediaSource = stats.find(
          (s) =>
            s.type === 'media-source' &&
            // Firefox doesn't have mediaSourceId, so we need to guess the media source
            (firefox ? true : s.id === rtcStreamStats.mediaSourceId),
        ) as RTCMediaSourceStats | undefined;
        if (mediaSource) {
          trackType = publisher.getTrackType(mediaSource.trackIdentifier);
        }
      }

      return {
        bytesSent: rtcStreamStats.bytesSent,
        bytesReceived: rtcStreamStats.bytesReceived,
        codec: codec?.mimeType,
        currentRoundTripTime: roundTripTime,
        frameHeight: rtcStreamStats.frameHeight,
        frameWidth: rtcStreamStats.frameWidth,
        framesPerSecond: rtcStreamStats.framesPerSecond,
        jitter: rtcStreamStats.jitter,
        kind: rtcStreamStats.kind,
        mediaSourceId: rtcStreamStats.mediaSourceId,
        qualityLimitationReason: rtcStreamStats.qualityLimitationReason,
        rid: rtcStreamStats.rid,
        ssrc: rtcStreamStats.ssrc,
        trackType,
      };
    });

  return {
    rawStats: report,
    streams,
    timestamp: Date.now(),
  };
};

const getEmptyStats = (stats?: StatsReport): AggregatedStatsReport => {
  return {
    rawReport: stats ?? { streams: [], timestamp: Date.now() },
    totalBytesSent: 0,
    totalBytesReceived: 0,
    averageJitterInMs: 0,
    averageRoundTripTimeInMs: 0,
    qualityLimitationReasons: 'none',
    highestFrameWidth: 0,
    highestFrameHeight: 0,
    highestFramesPerSecond: 0,
    codec: '',
    codecPerTrackType: {},
    timestamp: Date.now(),
  };
};

/**
 * Aggregates generic stats.
 *
 * @param stats the stats to aggregate.
 */
const aggregate = (stats: StatsReport): AggregatedStatsReport => {
  const aggregatedStats = getEmptyStats(stats);

  let maxArea = -1;
  const area = (w: number, h: number) => w * h;

  const qualityLimitationReasons = new Set<string>();
  const streams = stats.streams;
  const report = streams.reduce((acc, stream) => {
    acc.totalBytesSent += stream.bytesSent || 0;
    acc.totalBytesReceived += stream.bytesReceived || 0;
    acc.averageJitterInMs += stream.jitter || 0;
    acc.averageRoundTripTimeInMs += stream.currentRoundTripTime || 0;

    // naive calculation of the highest resolution
    const streamArea = area(stream.frameWidth || 0, stream.frameHeight || 0);
    if (streamArea > maxArea) {
      acc.highestFrameWidth = stream.frameWidth || 0;
      acc.highestFrameHeight = stream.frameHeight || 0;
      acc.highestFramesPerSecond = stream.framesPerSecond || 0;
      maxArea = streamArea;
    }

    qualityLimitationReasons.add(stream.qualityLimitationReason || '');
    return acc;
  }, aggregatedStats);

  if (streams.length > 0) {
    report.averageJitterInMs = Math.round(
      (report.averageJitterInMs / streams.length) * 1000,
    );
    report.averageRoundTripTimeInMs = Math.round(
      (report.averageRoundTripTimeInMs / streams.length) * 1000,
    );
    // we take the first codec we find, as it should be the same for all streams
    report.codec = streams[0].codec || '';
    report.codecPerTrackType = streams.reduce(
      (acc, stream) => {
        if (stream.trackType) {
          acc[stream.trackType] = stream.codec || '';
        }
        return acc;
      },
      {} as Record<TrackType, string>,
    );
  }

  const qualityLimitationReason = [
    qualityLimitationReasons.has('cpu') && 'cpu',
    qualityLimitationReasons.has('bandwidth') && 'bandwidth',
    qualityLimitationReasons.has('other') && 'other',
  ]
    .filter(Boolean)
    .join(', ');
  if (qualityLimitationReason) {
    report.qualityLimitationReasons = qualityLimitationReason;
  }

  return report;
};
