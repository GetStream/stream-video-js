import type { StreamClient } from '../coordinator/connection/client';
import type { StreamSfuClient } from '../StreamSfuClient';
import type { Subscriber } from '../rtc';
import { sleep } from '../coordinator/connection/utils';
import { videoLoggerSystem } from '../logger';
import { countInboundPackets } from './inboundPackets';

/**
 * What proved the network reachable: a round trip over the SFU signal
 * connection or the coordinator connection, or inbound media still arriving.
 */
export type NetworkReachability =
  'sfu' | 'coordinator' | 'media' | 'unreachable';

export type NetworkReachabilityCheckerOptions = {
  streamClient: StreamClient;
  /** Returns the call's current SFU client, read at check time. */
  getSfuClient: () => StreamSfuClient | undefined;
  /** Returns the call's current subscriber, read at check time. */
  getSubscriber: () => Subscriber | undefined;
};

/**
 * Checks whether a call's network is reachable. Round trips over the SFU
 * signal connection, round trips over the coordinator connection and inbound
 * media still arriving are checked in parallel; the SFU is preferred, as only
 * it proves the call can resume as is. Concurrent callers share one check.
 */
export class NetworkReachabilityChecker {
  private readonly logger = videoLoggerSystem.getLogger('NetworkReachability');
  private readonly streamClient: StreamClient;
  private readonly getSfuClient: () => StreamSfuClient | undefined;
  private readonly getSubscriber: () => Subscriber | undefined;
  private pendingCheck: Promise<NetworkReachability> | undefined;

  constructor({
    streamClient,
    getSfuClient,
    getSubscriber,
  }: NetworkReachabilityCheckerOptions) {
    this.streamClient = streamClient;
    this.getSfuClient = getSfuClient;
    this.getSubscriber = getSubscriber;
  }

  /**
   * Resolves with what proved the network reachable, or `'unreachable'`.
   * Never rejects.
   */
  check = (): Promise<NetworkReachability> => {
    this.pendingCheck ??= this.runCheck().finally(() => {
      this.pendingCheck = undefined;
    });
    return this.pendingCheck;
  };

  private runCheck = async (): Promise<NetworkReachability> => {
    const sfuClient = this.getSfuClient();
    const [sfu, coordinator, media] = await Promise.all([
      sfuClient?.isHealthy ? sfuClient.probe(2, 1500) : false,
      this.streamClient.probeConnection(),
      this.isReceivingMedia(),
    ]);
    if (sfu) return 'sfu';
    if (coordinator) return 'coordinator';
    if (media) return 'media';
    return 'unreachable';
  };

  /**
   * Whether the subscriber keeps receiving packets, sampled 1 s apart.
   * No inbound streams count as not receiving.
   */
  private isReceivingMedia = async () => {
    const subscriber = this.getSubscriber();
    if (!subscriber) return false;
    try {
      const before = await countInboundPackets(subscriber);
      if (before === 0) return false;
      await sleep(1000);
      return (await countInboundPackets(subscriber)) > before;
    } catch (err) {
      this.logger.debug('Failed to sample inbound media', err);
      return false;
    }
  };
}
