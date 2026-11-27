import type { HlsStatsTracer } from './HlsStatsTracer';
import type { TraceRecord } from '../rtc/types';
import { getSdkName, getSdkVersion } from '../utils';
import { generateUUIDv4, sleep } from '../../coordinator/connection/utils';
import type { StreamClient } from '../../coordinator/connection/client';
import type { ClientDetails } from '../../gen/video/sfu/models/models';
import type {
  HLSPlaybackStats,
  HLSPlayerEvent,
  HLSStatsOptionsShim,
  ReportHLSStatsRequest,
} from '../../gen/shims';
import type { StatsOptions } from '../../gen/coordinator';
import { hasPending, withoutConcurrency } from '../../helpers/concurrency';
import { videoLoggerSystem } from '../../logger';

export type HlsStatsReporterOptions = {
  /** The join response's `stats_options`, as given. */
  options: StatsOptions & HLSStatsOptionsShim;
  /** The join response's `playback.stats_token`. */
  statsToken: string;
  callSessionId: string;
  callType: string;
  callId: string;
  unifiedSessionId: string;
  clientDetails: ClientDetails;
  tracer: HlsStatsTracer;
  /** Reads the `stats` of a report; called each time one is built. */
  sample: () => HLSPlaybackStats;
};

type Report = Pick<
  ReportHLSStatsRequest,
  'type' | 'end_reason' | 'error_code'
> & { stats?: HLSPlaybackStats };

/** The retries of `started` and `ended`. */
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000];

/**
 * The `stats` interval: the HLS one from the join response's stats options,
 * else the WebRTC one, else 10 s.
 */
const getReportingIntervalMs = (options: HlsStatsReporterOptions['options']) =>
  options?.reporting_hls_interval_ms ||
  options?.reporting_interval_ms ||
  10_000;

/**
 * The tracer's records as HLS player events. The tracer marks dropped
 * records with a `traceBufferOverflow` record, which isn't an HLS event.
 */
const toHlsEvents = (records: TraceRecord[]) => {
  const events = records
    .filter(([type]) => type !== 'traceBufferOverflow')
    .map(([type, , data, timestamp]): HLSPlayerEvent => ({
      type,
      timestamp,
      data: (data ?? undefined) as HLSPlayerEvent['data'],
    }));
  return events.length ? events : undefined;
};

/** No response, 408, 429 or 5xx: sending the report again may succeed. */
const isRetryable = (err: unknown) => {
  const { status } = (err ?? {}) as { status?: number };
  return !status || status >= 500 || status === 408 || status === 429;
};

/**
 * Reports one HLS playback session to `hls_stats`:
 * `started` on the first frame, `stats` every interval, and `ended` when it
 * stops.
 *
 * Reports go out one at a time. `started` and `ended` are retried after 1, 2
 * and 4 s. `stats` isn't: its events go out with the next report. A refused
 * stats token (403) stops reporting.
 */
export class HlsStatsReporter {
  private readonly logger = videoLoggerSystem.getLogger('HlsStatsReporter');
  private readonly streamClient: StreamClient;
  private readonly tracer: HlsStatsTracer;
  private readonly sample: () => HLSPlaybackStats;
  private readonly url: string;
  private readonly reportingIntervalMs: number;
  private readonly session: Omit<ReportHLSStatsRequest, 'type'>;
  private readonly concurrencyTag = Symbol('hlsStatsReporter');

  private intervalId: ReturnType<typeof setInterval> | undefined;
  private isEnded = false;
  private isTokenRefused = false;
  /** The code of the failure that stopped playback, if it failed. */
  private errorCode: string | undefined;

  constructor(
    streamClient: StreamClient,
    {
      options,
      statsToken,
      callSessionId,
      callType,
      callId,
      unifiedSessionId,
      clientDetails,
      tracer,
      sample,
    }: HlsStatsReporterOptions,
  ) {
    this.streamClient = streamClient;
    this.tracer = tracer;
    this.sample = sample;
    this.url = `/call/${encodeURIComponent(callType)}/${encodeURIComponent(callId)}/hls_stats`;
    this.reportingIntervalMs = getReportingIntervalMs(options);
    const { sdk, browser, os } = clientDetails;
    this.session = {
      stats_token: statsToken,
      call_session_id: callSessionId,
      user_session_id: generateUUIDv4(),
      unified_session_id: unifiedSessionId,
      sdk: getSdkName(sdk),
      sdk_version: getSdkVersion(sdk),
      browser: browser?.name || undefined,
      browser_version: browser?.version || undefined,
      os: os?.name || undefined,
      os_version: os?.version || undefined,
    };
  }

  /** Starts reporting; `started` goes out when the stream starts playing. */
  start = () => {
    this.tracer.start(() => {
      // stopped meanwhile, e.g. by a state listener on this first play
      if (this.isEnded) return;
      void this.send({ type: 'started' }, true);
      this.intervalId = setInterval(() => {
        // skipped while a report is sending, so they don't pile up; the
        // totals are cumulative and its events go out with the next one
        if (hasPending(this.concurrencyTag)) return;
        void this.send({ type: 'stats', stats: this.sample() });
      }, this.reportingIntervalMs);
    });
  };

  /**
   * Stops reporting and sends `ended`: with `end_reason: 'error'` and the
   * error code when playback failed, `left` otherwise. Sends nothing when
   * the stream never started.
   */
  stop = async () => {
    if (this.isEnded) return;
    this.isEnded = true;
    clearInterval(this.intervalId);
    this.tracer.stop();
    const { errorCode } = this;
    if (!this.tracer.hasPlayed && !errorCode) return;
    await this.send(
      {
        type: 'ended',
        stats: this.sample(),
        end_reason: errorCode ? 'error' : 'left',
        error_code: errorCode,
      },
      true,
    );
  };

  /**
   * Playback failed: records an `error` event and stops counting. `ended`
   * carries the error when the viewer leaves, or at once when the stream
   * never started.
   */
  fail = async (code: string) => {
    if (this.isEnded || this.errorCode) return;
    this.errorCode = code;
    this.tracer.traceError(code);
    this.tracer.stop();
    if (!this.tracer.hasPlayed) await this.stop();
  };

  private send = (report: Report, retry = false) => {
    // when the reported state happened, kept across retries
    const timestamp = Date.now();
    // one report at a time, its retries included, so they arrive in order
    return withoutConcurrency(this.concurrencyTag, async () => {
      for (let attempt = 0; ; attempt++) {
        try {
          return await this.post(report, timestamp);
        } catch (err) {
          if (
            !retry ||
            !isRetryable(err) ||
            attempt >= RETRY_DELAYS_MS.length
          ) {
            this.logger.warn(`Failed to send the ${report.type} report`, err);
            return;
          }
          await sleep(RETRY_DELAYS_MS[attempt]);
        }
      }
    });
  };

  /** Sends one report, with the events not delivered yet. */
  private post = async (report: Report, timestamp: number) => {
    if (this.isTokenRefused) return;
    const events = this.tracer.take();
    try {
      await this.streamClient.doAxiosRequest('post', this.url, {
        ...this.session,
        ...report,
        timestamp,
        events: toHlsEvents(events.snapshot),
      } satisfies ReportHLSStatsRequest);
    } catch (err) {
      if ((err as { status?: number })?.status === 403) {
        this.isTokenRefused = true;
        clearInterval(this.intervalId);
        this.logger.warn('The stats token was refused, HLS stats stopped');
      } else if (isRetryable(err)) {
        // its events go out with the next report
        events.rollback();
      }
      throw err;
    }
  };
}
