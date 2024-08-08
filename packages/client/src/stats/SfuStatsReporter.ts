import { StreamSfuClient } from '../StreamSfuClient';
import { StatsOptions } from '../gen/coordinator';
import { getLogger } from '../logger';
import { Publisher, Subscriber } from '../rtc';
import { flatten, getSdkName, getSdkVersion } from './utils';
import { getWebRTCInfo, LocalClientDetailsType } from '../client-details';

export type SfuStatsReporterOptions = {
  options: StatsOptions;
  clientDetails: LocalClientDetailsType;
  subscriber: Subscriber;
  publisher?: Publisher;
};

export class SfuStatsReporter {
  private readonly logger = getLogger(['SfuStatsReporter']);

  readonly options: StatsOptions;

  private readonly sfuClient: StreamSfuClient;
  private readonly subscriber: Subscriber;
  private readonly publisher?: Publisher;

  private intervalId: NodeJS.Timeout | undefined;
  private readonly sdkName: string;
  private readonly sdkVersion: string;
  private readonly webRTCVersion: string;

  constructor(
    sfuClient: StreamSfuClient,
    { options, clientDetails, subscriber, publisher }: SfuStatsReporterOptions,
  ) {
    this.sfuClient = sfuClient;
    this.options = options;
    this.subscriber = subscriber;
    this.publisher = publisher;
    const webRTCInfo = getWebRTCInfo();

    const { sdk, browser } = clientDetails;

    this.sdkName = getSdkName(sdk);
    this.sdkVersion = getSdkVersion(sdk);

    // The WebRTC version if passed from the SDK, it is taken else the browser info is sent.
    this.webRTCVersion =
      webRTCInfo?.version ||
      `${browser?.name || ''}-${browser?.version || ''}` ||
      'N/A';
  }

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
    });
  };

  start = () => {
    if (this.options.reporting_interval_ms <= 0) return;
    clearInterval(this.intervalId);
    this.intervalId = setInterval(() => {
      this.run().catch((err) => {
        this.logger('warn', 'Failed to report stats', err);
      });
    }, this.options.reporting_interval_ms);
  };

  stop = () => {
    clearInterval(this.intervalId);
    this.intervalId = undefined;
  };
}
