import { videoLoggerSystem } from '../../logger';

export interface CandidatePairMonitorOptions {
  /**
   * The BUNDLE-shared ICE transport to watch.
   */
  iceTransport: RTCIceTransport;
  /**
   * Returns true when the peer connection is currently fully established.
   */
  isStable: () => boolean;
  /**
   * Called when an organic network path migration is detected, i.e. the
   * selected candidate pair switched while the connection was stable and no
   * ICE restart was in flight.
   */
  onMigration: () => void;
  /**
   * The settle window length in milliseconds.
   *
   * Default 2000ms delay, measured from the moment the connection last looked
   * stable, before a selected-candidate-pair change is treated as an organic
   * network path migration.
   *
   * Kept below `BasePeerConnection.iceRestartDelay` (2500ms) so that, during a
   * flap, the post-restart re-baseline lands before the disconnected-grace
   * restart timer would fire.
   */
  settleDelayMs?: number;
}

/**
 * Watches the selected ICE candidate pair on a peer connection's transport and
 * reports organic network path migrations (e.g. WiFi -> LTE) via `onMigration`.
 *
 * The problem it solves: an ICE restart itself changes the selected candidate
 * pair, and that change lands asynchronously, well after the restart's
 * signaling completes. A naive "pair changed -> restart" therefore loops
 * forever. This monitor suppresses pair-change reporting for a settle window
 * that opens at startup and at every restart (via `suppress`), and lifts only
 * after the connection has been stable and quiet for `settleDelayMs`. Only a
 * pair of changes observed while not suppressed, and while the connection is
 * stable is reported as a migration.
 *
 * @internal
 */
export class CandidatePairMonitor {
  private readonly logger = videoLoggerSystem.getLogger('ICECandidate Monitor');
  private readonly iceTransport: RTCIceTransport;
  private readonly isStable: () => boolean;
  private readonly onMigration: () => void;
  private readonly settleDelayMs: number;

  private baseline?: RTCIceCandidatePair | null;
  private suppressed = false;
  private settleTimeout?: ReturnType<typeof setTimeout>;
  private settleRearms = 0;
  private stopped = false;

  constructor(options: CandidatePairMonitorOptions) {
    this.iceTransport = options.iceTransport;
    this.isStable = options.isStable;
    this.onMigration = options.onMigration;
    this.settleDelayMs = options.settleDelayMs ?? 2000;
  }

  /**
   * Starts watching the transport for selected-candidate-pair changes.
   */
  start = () => {
    this.baseline = this.getSelectedPair();
    this.iceTransport.addEventListener(
      'selectedcandidatepairchange',
      this.handleChange,
    );
    // absorb the candidate churn that follows the initial connection
    this.suppress();
  };

  /**
   * Opens (or resets) the settle window during which candidate-pair changes are
   * absorbed instead of reported. Call this whenever an ICE restart is about to
   * run, from any source, so the restart-induced pair change does not loop back
   * into another restart. Each call resets the window, so overlapping restarts
   * coalesce.
   */
  suppress = () => {
    this.suppressed = true;
    this.settleRearms = 0;
    this.armSettle();
  };

  /**
   * Stops watching and releases all resources. Idempotent.
   */
  stop = () => {
    this.stopped = true;
    clearTimeout(this.settleTimeout);
    this.settleTimeout = undefined;
    this.iceTransport.removeEventListener(
      'selectedcandidatepairchange',
      this.handleChange,
    );
  };

  private getSelectedPair = (): RTCIceCandidatePair | null | undefined => {
    try {
      return this.iceTransport.getSelectedCandidatePair();
    } catch {
      return undefined;
    }
  };

  private handleChange = () => {
    if (this.stopped) return;
    const current = this.getSelectedPair();
    if (!this.baseline) {
      this.baseline = current;
      return;
    }
    if (!current || this.matchingPairs(this.baseline, current)) return;

    this.baseline = current;
    if (this.suppressed) {
      // pair change caused by an in-flight restart or initial-connect churn
      this.armSettle();
      return;
    }
    if (!this.isStable()) {
      // organic change mid-transition: defer the decision until the connection
      // settles. If the new path is dead, the connection-state machinery drives
      // a restart on its own.
      this.armSettle();
      return;
    }
    this.logger.debug('Selected ICE candidate pair migrated, restarting ICE');
    this.onMigration();
  };

  private armSettle = () => {
    clearTimeout(this.settleTimeout);
    this.settleTimeout = setTimeout(() => {
      if (this.stopped) return;
      if (this.isStable()) {
        this.suppressed = false;
        this.settleRearms = 0;
        this.baseline = this.getSelectedPair();
        return;
      }
      // shield from permanently unstable connection ice restart attempts
      if (this.settleRearms >= 10) {
        // stop waiting for stability and lift suppression so a later organic
        // migration can still be reported
        this.suppressed = false;
        this.settleRearms = 0;
        return;
      }
      this.settleRearms++;
      this.armSettle();
    }, this.settleDelayMs);
  };

  /**
   * Checks whether two ICE candidate pairs reference the same local and
   * remote candidates, i.e., they describe the same transport path.
   */
  private matchingPairs = (
    a: RTCIceCandidatePair,
    b: RTCIceCandidatePair,
  ): boolean =>
    a.local.candidate === b.local.candidate &&
    a.remote.candidate === b.remote.candidate;
}
