import type { StreamClient } from '../coordinator/connection/client';
import type { StreamSfuClient } from '../StreamSfuClient';
import type { Subscriber } from '../rtc';
import type { Tracer } from '../stats';
import { CallingState, CallState } from '../store';
import { sleep } from '../coordinator/connection/utils';
import { ScopedLogger, videoLoggerSystem } from '../logger';
import { countInboundPackets } from './inboundPackets';
import { isBrowserOnline, scheduleOfflineRechecks } from './offlineRechecks';
import { PromiseWithResolvers, promiseWithResolvers } from './promise';

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

export type CallOfflineStateOptions = {
  state: CallState;
  tracer: Tracer;
  logger: ScopedLogger;
  reachability: NetworkReachabilityChecker;
  /** Whether the call is being left. Going offline is skipped then. */
  isLeaving: () => boolean;
  /** Whether a reconnect is queued or running. */
  hasPendingReconnect: () => boolean;
  /**
   * Whether the call's peer connections still have ICE connected. ICE
   * changes are ignored while offline, so a connection that dropped then
   * would not recover by itself and the call has to reconnect.
   */
  connectionsIntact: () => boolean;
  /** Closes the SFU socket that the coming reconnect replaces. */
  discardSfuConnection: () => void;
  /** Reconnects once the network is back, after `offlineMs` offline. */
  reconnect: (offlineMs: number) => void;
  /** Pauses or resumes the SFU stats reporting. */
  setStatsPaused: (paused: boolean) => void;
};

/**
 * Owns a call's OFFLINE state. An `offline` event that the browser
 * contradicts is checked before the call goes offline, as a resumed page can
 * receive `online` and `offline` out of order. While offline, the network is
 * re-checked so the call can leave OFFLINE without an `online` event: it
 * resumes as is when nothing broke in the meantime, otherwise it reconnects.
 */
export class CallOfflineState {
  private readonly state: CallState;
  private readonly tracer: Tracer;
  private readonly logger: ScopedLogger;
  private readonly reachability: NetworkReachabilityChecker;
  private readonly isLeaving: () => boolean;
  private readonly hasPendingReconnect: () => boolean;
  private readonly connectionsIntact: () => boolean;
  private readonly discardSfuConnection: () => void;
  private readonly reconnect: (offlineMs: number) => void;
  private readonly setStatsPaused: (paused: boolean) => void;

  /** Set while offline; resolves with whether to reconnect. */
  private networkAvailableTask: PromiseWithResolvers<boolean> | undefined;
  private callingStateBeforeOffline: CallingState | undefined;
  private offlineSince = 0;
  private verifyingOfflineEvent = false;
  private stopRechecks?: () => void;
  /** Bumped on `dispose()`, so checks started before it are ignored. */
  private generation = 0;

  constructor(options: CallOfflineStateOptions) {
    this.state = options.state;
    this.tracer = options.tracer;
    this.logger = options.logger;
    this.reachability = options.reachability;
    this.isLeaving = options.isLeaving;
    this.hasPendingReconnect = options.hasPendingReconnect;
    this.connectionsIntact = options.connectionsIntact;
    this.discardSfuConnection = options.discardSfuConnection;
    this.reconnect = options.reconnect;
    this.setStatsPaused = options.setStatsPaused;
  }

  /**
   * Settles once the call is not offline anymore. `undefined` while the call
   * isn't offline.
   */
  get networkAvailable(): Promise<boolean> | undefined {
    return this.networkAvailableTask?.promise;
  }

  /**
   * Handles a `network.changed` event. An `offline` event while the browser
   * still reports being online may be stale, so the network is checked
   * before going offline.
   */
  handleNetworkChanged = (online: boolean) => {
    if (online) {
      this.goOnline();
    } else if (isBrowserOnline()) {
      this.verifyOfflineEvent();
    } else {
      this.goOffline();
    }
  };

  /**
   * Moves the call to OFFLINE until the network is back, which the next
   * `online` event or a successful re-check confirms.
   */
  goOffline = () => {
    // `leave()` releases the OFFLINE state early and then tears the call down
    if (this.networkAvailableTask || this.isLeaving()) return;
    this.offlineSince = Date.now();
    this.callingStateBeforeOffline = this.state.callingState;
    const networkAvailableTask = promiseWithResolvers<boolean>();
    networkAvailableTask.promise.then((shouldReconnect) => {
      if (shouldReconnect) this.reconnect(Date.now() - this.offlineSince);
    });
    this.networkAvailableTask = networkAvailableTask;
    this.setStatsPaused(true);
    this.state.setCallingState(CallingState.OFFLINE);
    this.stopRechecks?.();
    this.stopRechecks = scheduleOfflineRechecks({
      check: this.recheck,
      logger: this.logger,
    });
  };

  /**
   * Leaves OFFLINE without reconnecting and ignores checks still running.
   * A reconnect waiting for the network is released and sees the leave.
   */
  dispose = () => {
    this.generation++;
    this.end(false);
  };

  private verifyOfflineEvent = () => {
    if (this.networkAvailableTask || this.verifyingOfflineEvent) return;
    this.verifyingOfflineEvent = true;
    const generation = this.generation;
    this.reachability
      .check()
      .then((reachability) => {
        if (this.generation !== generation) return;
        this.tracer.trace('network.offlineChecked', { reachability });
        if (reachability === 'unreachable') this.goOffline();
      })
      .catch((err) => {
        this.logger.warn('[Reconnect] Failed to check an offline event', err);
        if (this.generation === generation) this.goOffline();
      })
      .finally(() => {
        this.verifyingOfflineEvent = false;
      });
  };

  private goOnline = () => {
    if (!this.networkAvailableTask) return;
    this.logger.debug('[Reconnect] Going online');
    // Only discard the socket when no reconnect is already in flight. A
    // running reconnect owns the SFU-client lifecycle (`doJoin` closes
    // the previous client once the new session is up). Closing here would
    // tear down the socket it's mid-join on, leaving the in-flight rejoin
    // to spin on SIGNAL_LOST.
    if (!this.hasPendingReconnect()) this.discardSfuConnection();
    this.end(true);
    this.setStatsPaused(false);
  };

  private end = (shouldReconnect: boolean) => {
    this.stopRechecks?.();
    this.stopRechecks = undefined;
    this.callingStateBeforeOffline = undefined;
    this.networkAvailableTask?.resolve(shouldReconnect);
    this.networkAvailableTask = undefined;
  };

  private recheck = async () => {
    const networkAvailableTask = this.networkAvailableTask;
    if (!networkAvailableTask) return;
    const reachability = await this.reachability.check();
    if (networkAvailableTask !== this.networkAvailableTask) return;
    if (reachability === 'unreachable') return;
    this.tracer.trace('network.offlineCleared', { reachability });
    if (this.state.callingState !== CallingState.OFFLINE) {
      // a reconnect moved the call on while it was marked offline
      this.end(false);
      this.setStatsPaused(false);
      return;
    }
    const canResume =
      reachability === 'sfu' &&
      this.callingStateBeforeOffline === CallingState.JOINED &&
      !this.hasPendingReconnect() &&
      this.connectionsIntact();
    if (canResume) {
      this.logger.debug('[Reconnect] Network reachable, resuming the call');
      this.state.setCallingState(CallingState.JOINED);
      this.end(false);
      this.setStatsPaused(false);
    } else {
      this.goOnline();
    }
  };
}
