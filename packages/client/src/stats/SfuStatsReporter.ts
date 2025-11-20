import { StreamSfuClient } from '../StreamSfuClient';
import { StreamClient } from '../coordinator/connection/client';
import {
  SendStatsRequest,
  SendStatsResponse,
  StatsOptions,
} from '../gen/coordinator';
import { Publisher, Subscriber } from '../rtc';
import { type ComputedStats, Tracer, TraceRecord } from './rtc';
import { flatten, getSdkName, getSdkVersion } from './utils';
import { getDeviceState, getWebRTCInfo } from '../helpers/client-details';
import {
  ClientDetails,
  WebsocketReconnectStrategy,
} from '../gen/video/sfu/models/models';
import {
  SendStatsRequest as SfuSendStatsRequest,
  Telemetry as SfuTelemetry,
} from '../gen/video/sfu/signal_rpc/signal';
import { videoLoggerSystem } from '../logger';

export type SfuStatsReporterOptions = {
  options: StatsOptions;
  clientDetails: ClientDetails;
  subscriber: Subscriber;
  publisher?: Publisher;
  tracer: Tracer;
  unifiedSessionId: string;
  basePath: string;
  useLegacyStats: boolean;
};

export class SfuStatsReporter {
  private readonly logger = videoLoggerSystem.getLogger('SfuStatsReporter');

  readonly options: StatsOptions;

  private readonly sfuClient: StreamSfuClient;
  private readonly streamClient: StreamClient;
  private readonly subscriber: Subscriber;
  private readonly publisher?: Publisher;
  private readonly tracer: Tracer;
  private readonly unifiedSessionId: string;
  private readonly basePath: string;
  private readonly useLegacyStats: boolean;

  private intervalId: NodeJS.Timeout | undefined;
  private timeoutId: NodeJS.Timeout | undefined;
  private readonly sdkName: string;
  private readonly sdkVersion: string;
  private readonly webRTCVersion: string;

  constructor(
    sfuClient: StreamSfuClient,
    streamClient: StreamClient,
    {
      options,
      clientDetails,
      subscriber,
      publisher,
      tracer,
      unifiedSessionId,
      basePath,
      useLegacyStats,
    }: SfuStatsReporterOptions,
  ) {
    this.sfuClient = sfuClient;
    this.streamClient = streamClient;
    this.options = options;
    this.subscriber = subscriber;
    this.publisher = publisher;
    this.tracer = tracer;
    this.unifiedSessionId = unifiedSessionId;
    this.basePath = basePath;
    this.useLegacyStats = useLegacyStats;

    const { sdk, browser } = clientDetails;
    this.sdkName = getSdkName(sdk);
    this.sdkVersion = getSdkVersion(sdk);

    // use the WebRTC version if set by the SDK (React Native) otherwise,
    // use the browser version as a fallback
    const webRTCInfo = getWebRTCInfo();
    this.webRTCVersion =
      webRTCInfo?.version ||
      `${browser?.name || ''}-${browser?.version || ''}` ||
      'N/A';
  }

  sendConnectionTime = (connectionTimeSeconds: number) => {
    this.sendTelemetryData({
      data: {
        oneofKind: 'connectionTimeSeconds',
        connectionTimeSeconds,
      },
    });
  };

  sendReconnectionTime = (
    strategy: WebsocketReconnectStrategy,
    timeSeconds: number,
  ) => {
    this.sendTelemetryData({
      data: {
        oneofKind: 'reconnection',
        reconnection: { strategy, timeSeconds },
      },
    });
  };

  private sendTelemetryData = (telemetryData: SfuTelemetry) => {
    // intentionally not awaiting the promise here
    // to avoid impeding with the ongoing actions.
    this.run(telemetryData).catch((err) => {
      this.logger.warn('Failed to send telemetry data', err);
    });
  };

  private run = async (telemetry?: SfuTelemetry) => {
    const [subscriberStats, publisherStats] = await Promise.all([
      this.subscriber.stats.get(),
      this.publisher?.stats.get(),
    ]);

    this.subscriber.tracer?.trace('getstats', subscriberStats.delta);
    if (publisherStats) {
      this.publisher?.tracer?.trace('getstats', publisherStats.delta);
    }

    const subscriberTrace = this.subscriber.tracer?.take();
    const publisherTrace = this.publisher?.tracer?.take();
    const tracer = this.tracer.take();
    const sfuTrace = this.sfuClient.tracer?.take();

    // not sorted, our backend will take care of it
    const traces: TraceRecord[] = [
      ...tracer.snapshot,
      ...(sfuTrace?.snapshot ?? []),
      ...(publisherTrace?.snapshot ?? []),
      ...(subscriberTrace?.snapshot ?? []),
    ];

    try {
      const baseStats = SfuSendStatsRequest.create({
        sessionId: this.sfuClient.sessionId,
        sdk: this.sdkName,
        sdkVersion: this.sdkVersion,
        webrtcVersion: this.webRTCVersion,
        unifiedSessionId: this.unifiedSessionId,
        rtcStats: JSON.stringify(traces),
        telemetry,
      });

      if (this.useLegacyStats) {
        const encodeStats =
          publisherStats && this.publisher
            ? this.publisher.stats.getEncodeStats(publisherStats.currentStats)
            : undefined;
        const decodeStats = this.subscriber.stats.getDecodeStats(
          subscriberStats.currentStats,
        );
        await this.sfuClient.sendStats(
          SfuSendStatsRequest.create({
            ...baseStats,
            encodeStats,
            decodeStats,
            deviceState: getDeviceState(),
            subscriberStats: JSON.stringify(flatten(subscriberStats.stats)),
            publisherStats: publisherStats
              ? JSON.stringify(flatten(publisherStats.stats))
              : '[]',
          }),
        );
      } else {
        await this.sendCoordinatorStats(baseStats).catch((err) => {
          this.logger.warn('Failed to send stats to coordinator', err);
        });
        await this.sendMetrics(subscriberStats, publisherStats).catch((err) => {
          this.logger.warn('Failed to send metrics to sfu', err);
        });
      }
    } catch (err) {
      publisherTrace?.rollback();
      subscriberTrace?.rollback();
      tracer.rollback();
      sfuTrace?.rollback();
      throw err;
    }
  };

  private sendCoordinatorStats = async (stats: SfuSendStatsRequest) => {
    const payload: SendStatsRequest = {
      sdk: stats.sdk,
      sdk_version: stats.sdkVersion,
      sfu_id: this.sfuClient.edgeName,
      unified_session_id: stats.unifiedSessionId,
      user_session_id: stats.sessionId,
      webrtc_version: stats.webrtcVersion,
    };
    if (stats.telemetry) {
      const { data } = stats.telemetry;
      payload.telemetry = {
        ...(data.oneofKind === 'connectionTimeSeconds' && {
          connection_time_seconds: data.connectionTimeSeconds,
        }),
        ...(data.oneofKind === 'reconnection' && {
          reconnection: {
            strategy: WebsocketReconnectStrategy[data.reconnection.strategy],
            time_seconds: data.reconnection.timeSeconds,
          },
        }),
      };
    }

    // must be last entry in the payload
    payload.rtc_stats = new Blob([stats.rtcStats], { type: 'application/json' });

    return this.streamClient.doAxiosRequest<
      SendStatsResponse,
      SendStatsRequest
    >('post', `${this.basePath}/stats`, payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

  private sendMetrics = async (
    subscriberStats: ComputedStats,
    publisherStats: ComputedStats | undefined,
  ) => {
    const subscriberMetrics = this.subscriber.stats.getSubscriberMetrics(
      subscriberStats.currentStats,
      subscriberStats.previousStats,
    );
    const publisherMetrics =
      publisherStats && this.publisher
        ? this.publisher.stats.getPublisherMetrics(
            publisherStats.currentStats,
            publisherStats.previousStats,
          )
        : { outbound: [], remoteInbound: [] };
    await this.sfuClient.sendMetrics({
      unifiedSessionId: this.unifiedSessionId,
      ...subscriberMetrics,
      ...publisherMetrics,
    });
  };

  start = () => {
    if (this.options.reporting_interval_ms <= 0) return;

    clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      this.run().catch((err) => {
        this.logger.warn('Failed to report stats', err);
      });
    }, this.options.reporting_interval_ms);
  };

  stop = () => {
    clearInterval(this.intervalId);
    this.intervalId = undefined;
    clearTimeout(this.timeoutId);
    this.timeoutId = undefined;
  };

  flush = () => {
    this.run().catch((err) => {
      this.logger.warn('Failed to flush report stats', err);
    });
  };

  scheduleOne = (timeout: number) => {
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      this.run().catch((err) => {
        this.logger.warn('Failed to report stats', err);
      });
    }, timeout);
  };
}
