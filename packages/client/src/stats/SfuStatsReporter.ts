import { combineLatest } from 'rxjs';
import { StreamSfuClient } from '../StreamSfuClient';
import { OwnCapability, StatsOptions } from '../gen/coordinator';
import { Publisher, Subscriber } from '../rtc';
import { Tracer, TraceRecord } from './rtc';
import { flatten, getSdkName, getSdkVersion } from './utils';
import { getDeviceState, getWebRTCInfo } from '../helpers/client-details';
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
  private unsubscribeDevicePermissionsSubscription?: () => void;
  private unsubscribeListDevicesSubscription?: () => void;
  private readonly sdkName: string;
  private readonly sdkVersion: string;
  private readonly webRTCVersion: string;
  private readonly inputDevices = new Map<'mic' | 'camera', InputDevices>();

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

  private run = async (telemetry?: Telemetry) => {
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
    const sfuTrace = this.sfuClient.getTrace();
    const traces: TraceRecord[] = [
      ...tracer.snapshot,
      ...(sfuTrace?.snapshot ?? []),
      ...(publisherTrace?.snapshot ?? []),
      ...(subscriberTrace?.snapshot ?? []),
    ];

    try {
      await this.sfuClient.sendStats({
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
    } catch (err) {
      publisherTrace?.rollback();
      subscriberTrace?.rollback();
      tracer.rollback();
      sfuTrace?.rollback();
      throw err;
    }
  };

  start = () => {
    if (this.options.reporting_interval_ms <= 0) return;

    this.observeDevice(this.microphone, 'mic');
    this.observeDevice(this.camera, 'camera');

    clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      this.run().catch((err) => {
        this.logger.warn('Failed to report stats', err);
      });
    }, this.options.reporting_interval_ms);
  };

  stop = () => {
    this.unsubscribeDevicePermissionsSubscription?.();
    this.unsubscribeDevicePermissionsSubscription = undefined;
    this.unsubscribeListDevicesSubscription?.();
    this.unsubscribeListDevicesSubscription = undefined;

    this.inputDevices.clear();
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
