import { StreamSfuClient } from '../StreamSfuClient';
import { StatsOptions } from '../gen/coordinator';
import { getLogger } from '../logger';
import { Publisher, Subscriber } from '../rtc';
import { ClientDetails, SdkType } from '../gen/video/sfu/models/models';
import { flatten } from './utils';

export type SfuStatsReporterOptions = {
  options: StatsOptions;
  clientDetails: ClientDetails;
  subscriber: Subscriber;
  publisher: Publisher;
};

export class SfuStatsReporter {
  private readonly logger = getLogger(['SfuStatsReporter']);

  readonly options: StatsOptions;

  private readonly sfuClient: StreamSfuClient;
  private readonly subscriber: Subscriber;
  private readonly publisher: Publisher;

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

    const { sdk, browser, device } = clientDetails;

    this.sdkName =
      sdk && sdk.type === SdkType.REACT
        ? 'stream-react'
        : sdk && sdk.type === SdkType.REACT_NATIVE
        ? 'stream-react-native'
        : 'stream-js';

    this.sdkVersion = sdk
      ? `${sdk.major}.${sdk.minor}.${sdk.patch}`
      : '0.0.0-development';

    this.webRTCVersion =
      device?.version ||
      `${browser?.name || ''}-${browser?.version || ''}` ||
      'N/A';
  }

  private run = async () => {
    const [subscriberStats, publisherStats] = await Promise.all([
      this.subscriber.getStats().then(flatten).then(JSON.stringify),
      this.publisher.getStats().then(flatten).then(JSON.stringify),
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
    this.intervalId = setInterval(() => {
      this.run().catch((err) => {
        this.logger('error', 'Failed to report stats', err);
      });
    }, this.options.reporting_interval_ms);
  };

  stop = () => {
    clearInterval(this.intervalId);
    this.intervalId = undefined;
  };
}
