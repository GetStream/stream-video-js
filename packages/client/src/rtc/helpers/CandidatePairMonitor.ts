import { videoLoggerSystem } from '../../logger';

/**
 * How long an interface stays "recently used". A migration back to an interface
 * we sat on within this window is treated as a flap and ignored; after it, a
 * return counts as a genuine migration again. Must exceed the period of any
 * real interface oscillation we want to absorb.
 */
export const FLAP_HORIZON_MS = 30_000;

export interface CandidatePairMonitorOptions {
  /**
   * The BUNDLE-shared ICE transport to watch.
   */
  iceTransport: RTCIceTransport;
  /**
   * Returns true when the peer connection is fully established (ICE
   * `connected`/`completed` and connection state `connected`).
   */
  isStable: () => boolean;
  /**
   * Called when a genuine network path migration is detected and an ICE restart
   * should run.
   */
  onMigration: () => void;
}

/**
 * Watches the selected ICE candidate pair and reports a genuine network path
 * migration (e.g. WiFi -> LTE) via `onMigration`, so the publisher can restart
 * ICE and reset the send-side bandwidth estimate.
 *
 * A change is acted on only when it moves to a *new* interface while ICE is
 * healthy. It is ignored when:
 *   - it is the same interface (cosmetic candidate refresh, host -> srflx, the
 *     churn that follows the initial connection, ...);
 *   - ICE is not healthy (`!isStable()`) - the connection-state machinery owns
 *     recovery there, and a restart's own churn lands here;
 *   - the destination is an interface we were on within `FLAP_HORIZON_MS` (a
 *     return/ping-pong between healthy paths, not a new migration).
 *
 * Interfaces are keyed by the Google `network-id` candidate attribute (falling
 * back to the ICE foundation), so the monitor reasons about *paths*, not exact
 * candidate strings.
 *
 * @internal
 */
export class CandidatePairMonitor {
  private readonly logger = videoLoggerSystem.getLogger(
    'ICECandidatePairMonitor',
  );
  private readonly iceTransport: RTCIceTransport;
  private readonly isStable: () => boolean;
  private readonly onMigration: () => void;

  private baseline: RTCIceCandidatePair | null = null;
  private readonly recent = new Map<string, number>();
  private stopped = false;

  constructor(options: CandidatePairMonitorOptions) {
    this.iceTransport = options.iceTransport;
    this.isStable = options.isStable;
    this.onMigration = options.onMigration;
  }

  /**
   * Starts watching the transport for selected-candidate-pair changes.
   */
  start = () => {
    this.baseline = this.iceTransport.getSelectedCandidatePair();
    if (this.baseline) this.remember(this.baseline);
    this.iceTransport.addEventListener(
      'selectedcandidatepairchange',
      this.handleChange,
    );
    this.logger.debug('Watching selected candidate pair');
  };

  /**
   * Stops watching and releases all resources. Idempotent.
   */
  stop = () => {
    this.stopped = true;
    this.recent.clear();
    this.iceTransport.removeEventListener(
      'selectedcandidatepairchange',
      this.handleChange,
    );
  };

  private handleChange = () => {
    if (this.stopped) return;
    const current = this.iceTransport.getSelectedCandidatePair();
    const previous = this.baseline;
    if (!previous) {
      this.baseline = current;
      if (current) this.remember(current);
      return;
    }
    if (!current) return;

    const fromKey = this.pathKey(previous);
    const toKey = this.pathKey(current);
    if (fromKey === toKey) return; // same interface, cosmetic candidate change

    this.baseline = current;
    const healthy = this.isStable();
    const isFlap = this.recentlyOn(toKey); // evaluate before remembering `current`
    this.remember(previous);
    this.remember(current);

    const pair = {
      fromKey,
      toKey,
      from: previous.local.candidate,
      to: current.local.candidate,
    };

    if (!healthy) {
      this.logger.debug('Ignoring change: ICE not healthy yet', pair);
      return;
    }
    if (isFlap) {
      this.logger.debug('Ignoring change: returned to a recent path', pair);
      return;
    }

    this.logger.debug('Selected candidate pair changed, restarting ICE', pair);
    this.onMigration();
  };

  private remember = (pair: RTCIceCandidatePair) => {
    this.recent.set(this.pathKey(pair), Date.now());
  };

  private recentlyOn = (key: string): boolean => {
    const seenAt = this.recent.get(key);
    return seenAt !== undefined && Date.now() - seenAt < FLAP_HORIZON_MS;
  };

  /**
   * Derives a stable "which interface" key from the local candidate: the Google
   * `network-id` extension when present, else the ICE foundation, else the raw
   * candidate string.
   */
  private pathKey = (pair: RTCIceCandidatePair): string => {
    const candidate = pair.local.candidate;
    const networkId = /(?:^| )network-id (\d+)/.exec(candidate);
    if (networkId) return `net:${networkId[1]}`;
    const foundation = /^candidate:(\S+)/.exec(candidate);
    if (foundation) return `fnd:${foundation[1]}`;
    return `raw:${candidate}`;
  };
}
