import { combineLatest } from 'rxjs';
import { StreamSfuClient } from '../StreamSfuClient';
import { OwnCapability, StatsOptions } from '../gen/coordinator';
import { Publisher, Subscriber } from '../rtc';
import { ComputedStats, PendingDelta, Tracer, TraceRecord } from './rtc';
import { flatten, getSdkName, getSdkVersion } from './utils';
import { getDeviceState, getWebRTCInfo } from '../helpers/client-details';
import { hasPending, withoutConcurrency } from '../helpers/concurrency';
import {
  ClientDetails,
  InputDevices,
  WebsocketReconnectStrategy,
} from '../gen/video/sfu/models/models';
import { CameraManager, MicrophoneManager } from '../devices';
import { createSubscription } from '../store/rxUtils';
import { CallState } from '../store';
import { Telemetry } from '../gen/video/sfu/signal_rpc/signal';
import { videoLoggerSystem } from '../logger';

export type SfuStatsReporterOptions = {
  options: StatsOptions;
  clientDetails: ClientDetails;
  subscriber: Subscriber;
  publisher?: Publisher;
  microphone: MicrophoneManager;
  camera: CameraManager;
  state: CallState;
  tracer: Tracer;
  unifiedSessionId: string;
};

export class SfuStatsReporter {
  private readonly logger = videoLoggerSystem.getLogger('SfuStatsReporter');

  readonly options: StatsOptions;

  private readonly sfuClient: StreamSfuClient;
  private readonly subscriber: Subscriber;
  private readonly publisher?: Publisher;
  private readonly microphone: MicrophoneManager;
  private readonly camera: CameraManager;
  private readonly state: CallState;
  private readonly tracer: Tracer;
  private readonly unifiedSessionId: string;

  private intervalId: NodeJS.Timeout | undefined;
  private timeoutId: NodeJS.Timeout | undefined;
  private reportCount: number = 0;
  private unsubscribeDevicePermissionsSubscription?: () => void;
  private unsubscribeListDevicesSubscription?: () => void;
  private readonly sdkName: string;
  private readonly sdkVersion: string;
  private readonly webRTCVersion: string;
  private readonly inputDevices = new Map<'mic' | 'camera', InputDevices>();
  private readonly statsConcurrencyTag = Symbol('sfuStatsReporter');
  private isStopped = false;

  constructor(
    sfuClient: StreamSfuClient,
    {
      options,
      clientDetails,
      subscriber,
      publisher,
      microphone,
      camera,
      state,
      tracer,
      unifiedSessionId,
    }: SfuStatsReporterOptions,
  ) {
    this.sfuClient = sfuClient;
    this.options = options;
    this.subscriber = subscriber;
    this.publisher = publisher;
    this.microphone = microphone;
    this.camera = camera;
    this.state = state;
    this.tracer = tracer;
    this.unifiedSessionId = unifiedSessionId;

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

  private observeDevice = (
    device: CameraManager | MicrophoneManager,
    kind: 'mic' | 'camera',
  ) => {
    const { browserPermissionState$ } = device.state;
    this.unsubscribeDevicePermissionsSubscription?.();
    this.unsubscribeDevicePermissionsSubscription = createSubscription(
      combineLatest([browserPermissionState$, this.state.ownCapabilities$]),
      ([browserPermissionState, ownCapabilities]) => {
        // cleanup the previous listDevices() subscription in case
        // permissions or capabilities have changed.
        // we will subscribe again if everything is in order.
        this.unsubscribeListDevicesSubscription?.();
        const hasCapability =
          kind === 'mic'
            ? ownCapabilities.includes(OwnCapability.SEND_AUDIO)
            : ownCapabilities.includes(OwnCapability.SEND_VIDEO);
        if (browserPermissionState !== 'granted' || !hasCapability) {
          this.inputDevices.set(kind, {
            currentDevice: '',
            availableDevices: [],
            isPermitted: false,
          });
          return;
        }
        this.unsubscribeListDevicesSubscription = createSubscription(
          combineLatest([device.listDevices(), device.state.selectedDevice$]),
          ([devices, deviceId]) => {
            const selected = devices.find((d) => d.deviceId === deviceId);
            this.inputDevices.set(kind, {
              currentDevice: selected?.label || deviceId || '',
              availableDevices: devices.map((d) => d.label),
              isPermitted: true,
            });
          },
        );
      },
    );
  };

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

  private sendTelemetryData = (telemetryData: Telemetry) => {
    // intentionally not awaiting the promise here
    // to avoid impeding with the ongoing actions.
    this.run(telemetryData).catch((err) => {
      this.logger.warn('Failed to send telemetry data', err);
    });
  };

  /**
   * Samples both peer connections. Each `StatsTracer.get()` is serialized
   * internally, so this is safe even if it overlaps another sample (e.g. the
   * connection-state-change handler). Kept separate from `send()` so an
   * explicit flush can capture the sample from live peer connections before
   * they are disposed, without waiting for an in-flight send.
   */
  private sample = (): Promise<[ComputedStats, ComputedStats | undefined]> =>
    Promise.all([this.subscriber.stats.get(), this.publisher?.stats.get()]);

  private send = (
    subscriberStats: ComputedStats,
    publisherStats: ComputedStats | undefined,
    telemetry?: Telemetry,
  ) => {
    // serialize sends so overlapping ones can't race on the trace buffers or
    // deliver an older delta after a newer one already succeeded. Not gated by
    // `isStopped`: an explicit final flush must still deliver after stop().
    return withoutConcurrency(this.statsConcurrencyTag, async () => {
      // The delta chain is delivered only when delta tracing is enabled
      // (the peer-connection tracer exists). Otherwise we drop the chain so it
      // can't grow unbounded.
      const subTracer = this.subscriber.tracer;
      const pubTracer = this.publisher?.tracer;
      let subPending: PendingDelta[] = [];
      if (subTracer) {
        subPending = this.subscriber.stats.getPendingDeltas();
      } else {
        this.subscriber.stats.clearPendingDeltas();
      }
      let pubPending: PendingDelta[] = [];
      if (pubTracer && publisherStats) {
        pubPending = this.publisher?.stats.getPendingDeltas() ?? [];
      } else {
        this.publisher?.stats.clearPendingDeltas();
      }

      const subscriberTrace = subTracer?.take();
      const publisherTrace = pubTracer?.take();
      const tracer = this.tracer.take();
      const sfuTrace = this.sfuClient.getTrace();
      const traces: TraceRecord[] = [
        ...tracer.snapshot,
        ...(sfuTrace?.snapshot ?? []),
        ...(publisherTrace?.snapshot ?? []),
        ...(subscriberTrace?.snapshot ?? []),
        ...toGetStatsRecords(subPending, subTracer?.traceId),
        ...toGetStatsRecords(pubPending, pubTracer?.traceId),
      ];

      try {
        const { response } = await this.sfuClient.sendStats({
          sdk: this.sdkName,
          sdkVersion: this.sdkVersion,
          webrtcVersion: this.webRTCVersion,
          subscriberStats: JSON.stringify(flatten(subscriberStats.stats)),
          publisherStats: publisherStats
            ? JSON.stringify(flatten(publisherStats.stats))
            : '[]',
          subscriberRtcStats: '',
          publisherRtcStats: '',
          rtcStats: JSON.stringify(traces),
          encodeStats: publisherStats?.performanceStats ?? [],
          decodeStats: subscriberStats.performanceStats,
          audioDevices: this.inputDevices.get('mic'),
          videoDevices: this.inputDevices.get('camera'),
          unifiedSessionId: this.unifiedSessionId,
          deviceState: getDeviceState(),
          telemetry,
        });
        // An SFU application-layer error means the stats were not accepted.
        // Treat it like a transport failure: retain the chain and roll back the
        // RTC traces (handled by the catch below) instead of committing.
        if (response?.error) {
          throw new Error(`SFU rejected stats: ${response.error.message}`);
        }
        // delivery confirmed: advance the delivery baseline for each chain.
        if (subTracer) this.subscriber.stats.commitDeltas(subPending);
        if (pubTracer && publisherStats) {
          this.publisher?.stats.commitDeltas(pubPending);
        }
      } catch (err) {
        // keep the delta chains (re-sent next interval); only the append-only
        // RTC event traces are rolled back so they aren't lost.
        publisherTrace?.rollback();
        subscriberTrace?.rollback();
        tracer.rollback();
        sfuTrace?.rollback();
        throw err;
      }
    });
  };

  /**
   * Samples and sends one report. Used by the scheduler and the telemetry path.
   * Bails if the reporter has been stopped so it never samples disposed peer
   * connections.
   */
  private run = async (telemetry?: Telemetry) => {
    if (this.isStopped) return;
    const [subscriberStats, publisherStats] = await this.sample();
    await this.send(subscriberStats, publisherStats, telemetry);
  };

  private scheduleNextReport = () => {
    const intervals = [1500, 3000, 3000, 5000];
    if (this.reportCount < intervals.length) {
      this.timeoutId = setTimeout(() => {
        this.scheduledFlush();
        this.reportCount++;
        this.scheduleNextReport();
      }, intervals[this.reportCount]);
    } else {
      clearInterval(this.intervalId);
      this.intervalId = setInterval(() => {
        this.scheduledFlush();
      }, this.options.reporting_interval_ms);
    }
  };

  start = () => {
    if (this.options.reporting_interval_ms <= 0) return;

    this.observeDevice(this.microphone, 'mic');
    this.observeDevice(this.camera, 'camera');

    this.isStopped = false;
    this.reportCount = 0;
    clearInterval(this.intervalId);
    clearTimeout(this.timeoutId);

    this.scheduleNextReport();
  };

  stop = () => {
    this.isStopped = true;
    this.unsubscribeDevicePermissionsSubscription?.();
    this.unsubscribeDevicePermissionsSubscription = undefined;
    this.unsubscribeListDevicesSubscription?.();
    this.unsubscribeListDevicesSubscription = undefined;

    this.inputDevices.clear();
    clearInterval(this.intervalId);
    this.intervalId = undefined;
    clearTimeout(this.timeoutId);
    this.timeoutId = undefined;
    this.reportCount = 0;
  };

  /**
   * Explicit/final flush (leave, migration, re-init). Awaits only the fast
   * sampling step so callers can capture the final sample from live peer
   * connections before disposing of them, then fires the send-best-effort. The
   * returned promise resolves once the sample is taken, not when the sending
   * completes. No-op once the reporter has been stopped.
   */
  flush = async (): Promise<void> => {
    if (this.isStopped) return;
    const [subscriberStats, publisherStats] = await this.sample();
    this.send(subscriberStats, publisherStats).catch((err) => {
      this.logger.warn('Failed to flush report stats', err);
    });
  };

  /**
   * Flush entry for the periodic scheduler. Skips when the reporter is stopped
   * or a send is already in flight so ticks can't pile up under slow sends (the
   * next sample's delta spans the skipped interval).
   */
  private scheduledFlush = () => {
    if (this.isStopped || hasPending(this.statsConcurrencyTag)) return;
    this.run().catch((err) => {
      this.logger.warn('Failed to flush report stats', err);
    });
  };
}

/**
 * Wraps un-acked, delta-compressed samples into the legacy `getstats` trace
 * record shape so the chain rides inside `rtcStats`, wire-compatible with the
 * server's existing decoder.
 */
const toGetStatsRecords = (
  pending: PendingDelta[],
  id: string | null = null,
): TraceRecord[] => pending.map(({ delta, ts }) => ['getstats', id, delta, ts]);
