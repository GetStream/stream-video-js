import { combineLatest } from 'rxjs';
import { StreamSfuClient } from '../StreamSfuClient';
import { StatsOptions } from '../gen/coordinator';
import { getLogger } from '../logger';
import { Publisher, Subscriber } from '../rtc';
import { flatten, getSdkName, getSdkVersion } from './utils';
import { getWebRTCInfo, LocalClientDetailsType } from '../client-details';
import { InputDevices } from '../gen/video/sfu/models/models';
import { CameraManager, MicrophoneManager } from '../devices';
import { createSubscription } from '../store/rxUtils';

export type SfuStatsReporterOptions = {
  options: StatsOptions;
  clientDetails: LocalClientDetailsType;
  subscriber: Subscriber;
  publisher?: Publisher;
  microphone: MicrophoneManager;
  camera: CameraManager;
};

export class SfuStatsReporter {
  private readonly logger = getLogger(['SfuStatsReporter']);

  readonly options: StatsOptions;

  private readonly sfuClient: StreamSfuClient;
  private readonly subscriber: Subscriber;
  private readonly publisher?: Publisher;
  private readonly microphone: MicrophoneManager;
  private readonly camera: CameraManager;

  private intervalId: NodeJS.Timeout | undefined;
  private subscriptions: Array<() => void> = [];
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
    }: SfuStatsReporterOptions,
  ) {
    this.sfuClient = sfuClient;
    this.options = options;
    this.subscriber = subscriber;
    this.publisher = publisher;
    this.microphone = microphone;
    this.camera = camera;

    const { sdk, browser } = clientDetails;
    this.sdkName = getSdkName(sdk);
    this.sdkVersion = getSdkVersion(sdk);

    // The WebRTC version if passed from the SDK, it is taken else the browser info is sent.
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
    const { hasBrowserPermission$ } = device.state;
    const sub = createSubscription(hasBrowserPermission$, (hasPermission) => {
      if (!hasPermission) {
        this.inputDevices.set(kind, {
          currentDevice: '',
          availableDevices: [],
          isPermitted: false,
        });
        return;
      }
      const subscription = createSubscription(
        combineLatest([device.listDevices(), device.state.selectedDevice$]),
        ([devices, selectedDeviceId]) => {
          const selected = devices.find((d) => d.deviceId === selectedDeviceId);
          this.inputDevices.set(kind, {
            currentDevice: selected?.label || selectedDeviceId || '',
            availableDevices: devices.map((d) => d.label),
            isPermitted: true,
          });
        },
      );
      this.subscriptions.push(subscription);
    });
    this.subscriptions.push(sub);
  };

  private run = async () => {
    const [subscriberStats, publisherStats] = await Promise.all([
      this.subscriber.getStats().then(flatten).then(JSON.stringify),
      this.publisher?.getStats().then(flatten).then(JSON.stringify) ?? '[]',
    ]);

    await this.sfuClient.sendStats({
      sdk: this.sdkName,
      sdkVersion: this.sdkVersion,
      webrtcVersion: this.webRTCVersion,
      subscriberStats,
      publisherStats,
      audioDevices: this.inputDevices.get('mic'),
      videoDevices: this.inputDevices.get('camera'),
      deviceState: { oneofKind: undefined },
    });
  };

  start = () => {
    this.observeDevice(this.microphone, 'mic');
    this.observeDevice(this.camera, 'camera');

    if (this.options.reporting_interval_ms <= 0) return;
    clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      this.run().catch((err) => {
        this.logger('warn', 'Failed to report stats', err);
      });
    }, this.options.reporting_interval_ms);
  };

  stop = () => {
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
    this.subscriptions = [];
    clearInterval(this.intervalId);
    this.intervalId = undefined;
  };
}
