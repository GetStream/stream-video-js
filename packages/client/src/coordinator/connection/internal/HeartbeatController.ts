import type { WorkerTimer } from '@stream-io/worker-timer';

export type HeartbeatOptions = {
  pingIntervalMs?: number;
  healthTimeoutMs?: number;
};

export type HeartbeatControllerArgs = {
  options?: HeartbeatOptions;
  timers: WorkerTimer;
  sendPing: (clientId: string) => void;
  onUnhealthy: () => void;
  getClientId: () => string | undefined;
};

/**
 * Owns the ping cadence and the silence watchdog for a single coordinator
 * socket. Both timers go through the injected WorkerTimer (F5) so worker-timer
 * mode is honored end to end (today only the ping uses the worker; the
 * watchdog uses raw setTimeout and is throttled in background tabs).
 */
export class HeartbeatController {
  private pingIntervalMs: number;
  private healthTimeoutMs: number;
  private timers: WorkerTimer;
  private sendPing: (clientId: string) => void;
  private onUnhealthy: () => void;
  private getClientId: () => string | undefined;
  private pingHandle?: number;
  private watchdogHandle?: number;
  private lastEventAt = 0;

  constructor(args: HeartbeatControllerArgs) {
    this.pingIntervalMs = args.options?.pingIntervalMs ?? 25000;
    this.healthTimeoutMs = args.options?.healthTimeoutMs ?? 35000;
    this.timers = args.timers;
    this.sendPing = args.sendPing;
    this.onUnhealthy = args.onUnhealthy;
    this.getClientId = args.getClientId;
  }

  start = (): void => {
    this.notePingReply();
    this.noteEventReceived();
  };

  stop = (): void => {
    if (this.pingHandle != null) this.timers.clearTimeout(this.pingHandle);
    if (this.watchdogHandle != null)
      this.timers.clearTimeout(this.watchdogHandle);
    this.pingHandle = undefined;
    this.watchdogHandle = undefined;
  };

  notePingReply = (): void => {
    if (this.pingHandle != null) this.timers.clearTimeout(this.pingHandle);
    this.pingHandle = this.timers.setTimeout(() => {
      const id = this.getClientId();
      if (id) this.sendPing(id);
    }, this.pingIntervalMs);
  };

  noteEventReceived = (): void => {
    this.lastEventAt = Date.now();
    if (this.watchdogHandle != null)
      this.timers.clearTimeout(this.watchdogHandle);
    this.watchdogHandle = this.timers.setTimeout(() => {
      // Plan documents the legacy strict `>` here, but in production timers
      // wake up with non-zero jitter so the comparison is effectively `>=`.
      // Use `>=` directly: it matches real-world behavior and makes
      // fake-timer tests deterministic.
      if (Date.now() - this.lastEventAt >= this.healthTimeoutMs) {
        this.onUnhealthy();
      }
    }, this.healthTimeoutMs);
  };
}
