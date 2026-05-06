type GateState = {
  promise: Promise<string | undefined>;
  resolve: (value?: string) => void;
  reject: (err: Error) => void;
  settled: boolean;
};

/**
 * Single source of truth for "is the connection_id available yet?".
 *
 * Lifecycle owners (CoordinatorSocket, StreamClient.openConnection,
 * StreamClient.connectAnonymousUser) call `arm()` to start a new gate cycle.
 * The handshake calls `resolve()` on success or `reject()` on failure. REST
 * callers only ever call `await()`; they MUST NOT call `arm()` so they can
 * never rotate the gate into a fresh pending state with no one to resolve it.
 *
 * F1 fix: `reject()` settles the in-flight promise BEFORE a subsequent
 * `arm()` rotates the state, so previously-captured `await()` references
 * always resolve or reject (never hang).
 */
export class ConnectionIdGate {
  private state: GateState | null = null;

  /** Lifecycle owners only. Idempotent while pending; rotates if settled or absent. */
  arm = (): void => {
    if (this.state && !this.state.settled) return;
    let resolve!: (value?: string) => void;
    let reject!: (err: Error) => void;
    const promise = new Promise<string | undefined>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    this.state = { promise, resolve, reject, settled: false };
  };

  /**
   * Returns the current armed promise. Throws synchronously if the gate has
   * never been armed (programmer error). REST callers should call this only.
   */
  await = (): Promise<string | undefined> => {
    if (!this.state) {
      throw new Error(
        'ConnectionIdGate.await(): gate not armed (call arm() first)',
      );
    }
    return this.state.promise;
  };

  /** Settles the in-flight promise. No-op if absent or already settled. */
  resolve = (connectionId?: string): void => {
    if (!this.state || this.state.settled) return;
    this.state.settled = true;
    this.state.resolve(connectionId);
  };

  /** Settles the in-flight promise with an error. No-op if absent or already settled. */
  reject = (err: Error): void => {
    if (!this.state || this.state.settled) return;
    this.state.settled = true;
    this.state.reject(err);
  };

  /**
   * Discards the gate. Subsequent `await()` throws until a new `arm()`. Used
   * by `StreamClient.disconnectUser()` after the close path has run.
   */
  reset = (): void => {
    this.state = null;
  };

  isPending = (): boolean => !!this.state && !this.state.settled;

  isSettled = (): boolean => !!this.state && this.state.settled;
}
