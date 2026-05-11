import type { StreamClient } from '../coordinator/connection/client';
import {
  generateUUIDv4,
  retryInterval,
  sleep,
} from '../coordinator/connection/utils';
import { SfuJoinError } from '../errors';
import { ErrorCode } from '../gen/video/sfu/models/models';
import { videoLoggerSystem } from '../logger';

const ENDPOINT = '/call/client_event';

const MAX_ATTEMPTS = 5;
const MAX_CALL_SESSION_ID = 64;
const MAX_SFU_ID = 128;
const MAX_REASON = 2000;
const MAX_CODE = 200;
const MAX_RETRY_COUNT = 1000;

export type ClientEventPeerConnection = 'publish' | 'subscribe';
type PeerConnectionEventContext = {
  wasPreviouslyConnected: boolean;
};
export type ClientEventStage =
  | 'CoordinatorJoin'
  | 'WSJoin'
  | 'PeerConnectionConnect';
export type ClientEventCorrelationKind = 'initial' | 'migration';

/**
 * Standard codes from the client_event spec. The endpoint accepts any string,
 * but dashboards key off these values; prefer them where possible.
 */
export type ClientEventStandardCode =
  | 'CLIENT_ABORTED'
  | 'REQUEST_TIMEOUT'
  | 'NETWORK_OFFLINE';

export type ClientEventReporterOptions = {
  streamClient: StreamClient;
  callType: string;
  callId: string;
  getUserId: () => string;
  getCallSessionId: () => string;
  sdkVersion: string;
  userAgent: string;
};

const truncate = (value: string, max: number) =>
  value.length > max ? value.slice(0, max) : value;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.trunc(value)));

/**
 * Reports client-side join-lifecycle events (`CoordinatorJoin` / `WSJoin`)
 * to the coordinator's `POST /call/client_event` endpoint.
 *
 * Each stage attempt produces a pair: an `initiated` event when the attempt
 * begins, and a `completed` event when it resolves. Both share an
 * `event_session_id` generated on initiation.
 *
 * Posts are fire-and-forget. Transport-level failures are retried in memory
 * with the shared `retryInterval` backoff (up to 5 attempts, ~250 ms-5 s
 * window). Validation failures (4xx) are not retried. Events are not
 * persisted across page reloads — the backend treats absent completions as
 * failures.
 */
/**
 * Severity tiers used by the sticky-priority error capture. Higher = more
 * informative — once a high-severity error is captured for a pair,
 * subsequent lower-severity errors don't override it, so analytics keep
 * the most useful signal (e.g. a 5xx server response) instead of the most
 * recent one (e.g. a generic AbortError on tab-close).
 */
const SEVERITY = {
  CLIENT: 1, // user-triggered or low-information errors (abort, cancellation)
  TRANSPORT: 2, // network-layer failures (offline, timeout, generic failure)
  SERVER: 3, // server returned a meaningful error (5xx, SFU error codes)
} as const;

type StageError = {
  reason: string;
  code: string;
  severity: number;
};

type StagePairState = {
  sid: string;
  attempts: number;
  lastError?: StageError;
};

/**
 * Sticky-priority replacement: only overwrite the captured error if the new
 * one's severity is at least as high. Ensures a server-side cause captured
 * early in the retry sequence isn't masked by a later client-side abort.
 */
const applyError = (pair: StagePairState | undefined, next: StageError) => {
  if (!pair) return;
  const prev = pair.lastError;
  if (!prev || next.severity >= prev.severity) {
    pair.lastError = next;
  }
};

const errorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
};

/**
 * Maps a thrown error from a coordinator HTTP / WS-open path to a
 * `StageError`. 5xx responses get `SERVER` severity; explicit aborts get
 * `CLIENT` severity; everything else (network errors, timeouts, generic
 * failures) gets `TRANSPORT`.
 */
const mapHttpError = (err: unknown): StageError => {
  const reason = errorMessage(err);
  const status = (err as { response?: { status?: number } } | null | undefined)
    ?.response?.status;
  if (typeof status === 'number' && status >= 500) {
    return {
      reason: reason || `Server error ${status}`,
      code: 'REQUEST_TIMEOUT',
      severity: SEVERITY.SERVER,
    };
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      reason: reason || 'Device offline',
      code: 'NETWORK_OFFLINE',
      severity: SEVERITY.TRANSPORT,
    };
  }
  const errorObj = err as { name?: string; code?: string } | null | undefined;
  if (
    errorObj?.name === 'AbortError' ||
    errorObj?.code === 'ERR_CANCELED' ||
    errorObj?.code === 'ABORT_ERR'
  ) {
    return {
      reason: reason || 'Request aborted',
      code: 'CLIENT_ABORTED',
      severity: SEVERITY.CLIENT,
    };
  }
  return {
    reason: reason || 'Request failed',
    code: 'REQUEST_TIMEOUT',
    severity: SEVERITY.TRANSPORT,
  };
};

/**
 * Maps a WS-stage join failure to a `StageError`. SFU-level error codes
 * (e.g. `SFU_FULL`) are server-side signals — tagged with `SERVER`
 * severity. Falls back to `mapHttpError` for non-SFU errors.
 */
const mapWsJoinError = (err: unknown): StageError => {
  if (err instanceof SfuJoinError) {
    const sfuError = err.errorEvent.error;
    const codeName = sfuError
      ? ErrorCode[sfuError.code] || `SFU_ERROR_${sfuError.code}`
      : 'SFU_ERROR';

    return {
      reason: sfuError?.message || err.message || 'SFU rejected join',
      code: codeName,
      severity: SEVERITY.SERVER,
    };
  }
  return mapHttpError(err);
};

export class ClientEventReporter {
  private readonly logger = videoLoggerSystem.getLogger('ClientEventReporter');
  private readonly streamClient: StreamClient;
  private readonly callType: string;
  private readonly callId: string;
  private readonly getUserId: () => string;
  private readonly getCallSessionId: () => string;
  private readonly sdkVersion: string;
  private readonly userAgent: string;
  private disposed = false;

  private coordinatorPair?: StagePairState;
  private wsPair?: StagePairState;
  private peerConnectionPairs: Partial<
    Record<ClientEventPeerConnection, StagePairState>
  > = {};
  private joinSuccessId?: string;

  constructor(options: ClientEventReporterOptions) {
    this.streamClient = options.streamClient;
    this.callType = options.callType;
    this.callId = options.callId;
    this.getUserId = options.getUserId;
    this.getCallSessionId = options.getCallSessionId;
    this.sdkVersion = options.sdkVersion;
    this.userAgent = options.userAgent;
  }

  startCorrelation = (_kind: ClientEventCorrelationKind) => {
    this.joinSuccessId = generateUUIDv4();
    this.clearOpenPairs();
  };

  track = async <T>(stage: ClientEventStage, op: () => Promise<T>) => {
    this.beginAttempt(stage);
    try {
      const result = await op();
      this.succeedAttempt(stage);
      return result;
    } catch (err) {
      this.applyStageError(stage, err);
      throw err;
    }
  };

  migrate = (opts: {
    callSessionId: string;
    sfuId: string;
    error: unknown;
  }) => {
    if (!this.wsPair) return;
    applyError(this.wsPair, mapWsJoinError(opts.error));
    this.failWs({ callSessionId: opts.callSessionId, sfuId: opts.sfuId });
    this.joinSuccessId = generateUUIDv4();
  };

  close = (opts: { callSessionId: string; sfuId: string; error?: unknown }) => {
    if (opts.error !== undefined) {
      if (this.coordinatorPair) {
        applyError(this.coordinatorPair, mapHttpError(opts.error));
      }
      if (this.wsPair) {
        applyError(this.wsPair, mapWsJoinError(opts.error));
      }
    }
    if (this.coordinatorPair) {
      this.failCoordinator({ callSessionId: opts.callSessionId });
    }
    if (this.wsPair) {
      this.failWs({ callSessionId: opts.callSessionId, sfuId: opts.sfuId });
    }
  };

  abort = (opts: { callSessionId: string; sfuId: string }) => {
    const aborted: StageError = {
      reason: 'Aborted: user left during retry',
      code: 'CLIENT_ABORTED',
      severity: SEVERITY.CLIENT,
    };
    if (this.coordinatorPair) {
      applyError(this.coordinatorPair, aborted);
      this.failCoordinator({ callSessionId: opts.callSessionId });
    }
    if (this.wsPair) {
      applyError(this.wsPair, aborted);
      this.failWs(opts);
    }
  };

  dispose = () => {
    this.disposed = true;
  };

  beginPeerConnectionAttempt = (
    peerConnection: ClientEventPeerConnection,
    context: PeerConnectionEventContext,
  ) => {
    const pair = this.peerConnectionPairs[peerConnection];
    if (pair) return;
    const sid = generateUUIDv4();
    this.peerConnectionPairs[peerConnection] = { sid, attempts: 0 };
    this.send({
      ...this.buildCommon('PeerConnectionConnect', sid),
      peer_connection: peerConnection,
      was_previously_connected: context.wasPreviouslyConnected,
      event_type: 'initiated',
    });
  };

  succeedPeerConnection = (
    peerConnection: ClientEventPeerConnection,
    context: PeerConnectionEventContext,
  ) => {
    const pair = this.peerConnectionPairs[peerConnection];
    if (!pair) return;
    this.send({
      ...this.buildCommon('PeerConnectionConnect', pair.sid),
      peer_connection: peerConnection,
      was_previously_connected: context.wasPreviouslyConnected,
      event_type: 'completed',
      outcome: 'success',
      retry_count_attempt: clamp(pair.attempts - 1, 0, MAX_RETRY_COUNT),
    });
    delete this.peerConnectionPairs[peerConnection];
  };

  private clearOpenPairs = () => {
    this.coordinatorPair = undefined;
    this.wsPair = undefined;
    this.peerConnectionPairs = {};
  };

  private beginAttempt = (stage: ClientEventStage) => {
    switch (stage) {
      case 'CoordinatorJoin':
        this.beginCoordinatorAttempt();
        break;
      case 'WSJoin':
        this.beginWsAttempt();
        break;
    }
  };

  private succeedAttempt = (stage: ClientEventStage) => {
    switch (stage) {
      case 'CoordinatorJoin':
        this.succeedCoordinator();
        break;
      case 'WSJoin':
        this.succeedWs();
        break;
    }
  };

  private applyStageError = (stage: ClientEventStage, err: unknown) => {
    switch (stage) {
      case 'CoordinatorJoin':
        applyError(this.coordinatorPair, mapHttpError(err));
        break;
      case 'WSJoin':
        applyError(this.wsPair, mapWsJoinError(err));
        break;
    }
  };

  private beginCoordinatorAttempt = () => {
    if (!this.coordinatorPair) {
      const sid = generateUUIDv4();
      this.coordinatorPair = { sid, attempts: 0 };
      this.send({
        ...this.buildCommon('CoordinatorJoin', sid),
        event_type: 'initiated',
      });
    }
    this.coordinatorPair.attempts++;
  };

  /** Closes the open `CoordinatorJoin` pair as success. */
  private succeedCoordinator = () => {
    const pair = this.coordinatorPair;
    if (!pair) return;
    this.send({
      ...this.buildCommon('CoordinatorJoin', pair.sid),
      event_type: 'completed',
      outcome: 'success',
      retry_count_attempt: clamp(pair.attempts - 1, 0, MAX_RETRY_COUNT),
    });
    this.coordinatorPair = undefined;
  };

  /**
   * Closes the open `CoordinatorJoin` pair as failure. Optionally stamps
   * `call_session_id` when the caller knows it (e.g. REJOIN/MIGRATE
   * failures where a session was already established); omitted on the
   * initial-join path where no session exists yet. Backend treats
   * `call_session_id` as allowed-but-not-required for CoordinatorJoin
   * failures.
   */
  private failCoordinator = (opts?: { callSessionId?: string }) => {
    const pair = this.coordinatorPair;
    if (!pair) return;
    const reason = pair.lastError?.reason ?? 'join lifecycle abandoned';
    const code = pair.lastError?.code ?? 'REQUEST_TIMEOUT';
    this.send({
      ...this.buildCommon('CoordinatorJoin', pair.sid),
      event_type: 'completed',
      outcome: 'failure',
      retry_count_attempt: clamp(pair.attempts - 1, 0, MAX_RETRY_COUNT),
      ...(opts?.callSessionId && {
        call_session_id: truncate(opts.callSessionId, MAX_CALL_SESSION_ID),
      }),
      retry_failure_reason: truncate(reason, MAX_REASON),
      retry_failure_code: truncate(code, MAX_CODE),
    });
    this.coordinatorPair = undefined;
  };

  private beginWsAttempt = () => {
    if (!this.wsPair) {
      const sid = generateUUIDv4();
      this.wsPair = { sid, attempts: 0 };
      this.send({
        ...this.buildCommon('WSJoin', sid),
        event_type: 'initiated',
      });
    }
    this.wsPair.attempts++;
  };

  private succeedWs = () => {
    const pair = this.wsPair;
    if (!pair) return;
    this.send({
      ...this.buildCommon('WSJoin', pair.sid),
      event_type: 'completed',
      outcome: 'success',
      retry_count_attempt: clamp(pair.attempts - 1, 0, MAX_RETRY_COUNT),
    });
    this.wsPair = undefined;
  };

  private failWs = (opts: { callSessionId: string; sfuId: string }) => {
    const pair = this.wsPair;
    if (!pair) return;
    const reason = pair.lastError?.reason ?? 'WS lifecycle abandoned';
    const code = pair.lastError?.code ?? 'REQUEST_TIMEOUT';
    this.send({
      ...this.buildCommon('WSJoin', pair.sid),
      event_type: 'completed',
      outcome: 'failure',
      retry_count_attempt: clamp(pair.attempts - 1, 0, MAX_RETRY_COUNT),
      call_session_id: truncate(opts.callSessionId, MAX_CALL_SESSION_ID),
      sfu_id: truncate(opts.sfuId, MAX_SFU_ID),
      retry_failure_reason: truncate(reason, MAX_REASON),
      retry_failure_code: truncate(code, MAX_CODE),
    });
    this.wsPair = undefined;
  };

  private buildCommon = (
    stage: ClientEventStage,
    eventSessionId: string,
  ): Record<string, unknown> => {
    const callSessionId = this.getCallSessionId();
    return {
      user_id: this.getUserId(),
      type: this.callType,
      id: this.callId,
      stage,
      event_session_id: eventSessionId,
      ...(callSessionId && { call_session_id: callSessionId }),
      ...(this.joinSuccessId && { join_success_id: this.joinSuccessId }),
      timestamp: new Date().toISOString(),
      user_agent: this.userAgent,
      sdk_version: this.sdkVersion,
    };
  };

  private send = (body: Record<string, unknown>) => {
    if (this.disposed) return;
    void this.sendWithRetry(body);
  };

  private sendWithRetry = async (body: Record<string, unknown>) => {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (this.disposed) return;
      try {
        await this.streamClient.post(ENDPOINT, body);
        return;
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (typeof status === 'number' && status >= 400 && status < 500) {
          this.logger.debug(
            `Client event rejected (${status}), not retrying`,
            body.stage,
            body.event_type,
          );
          return;
        }
        if (attempt === MAX_ATTEMPTS - 1) {
          this.logger.debug(
            'Client event delivery failed after retries',
            body.stage,
            body.event_type,
            err,
          );
          return;
        }
        await sleep(retryInterval(attempt));
      }
    }
  };
}
