import { ErrorCode, PeerType } from '../gen/video/sfu/models/models';
import type { StreamClient } from '../coordinator/connection/client';
import {
  generateUUIDv4,
  retryInterval,
  sleep,
} from '../coordinator/connection/utils';
import { SfuJoinError } from '../errors';
import { videoLoggerSystem } from '../logger';
import type { PeerConnectionStateChangeEvent } from '../rtc';

export type ClientEventPeerConnection = 'publish' | 'subscribe';

export type ClientEventStage =
  | 'CoordinatorJoin'
  | 'WSJoin'
  | 'PeerConnectionConnect';

export type ClientEventStandardCode =
  | 'CLIENT_ABORTED'
  | 'BACKEND_LEAVE'
  | 'REQUEST_TIMEOUT'
  | 'NETWORK_OFFLINE'
  | 'ICE_GATHERING_FAILED'
  | 'ICE_CONNECTIVITY_FAILED'
  | 'DTLS_CONNECTIVITY_FAILED';

export type ClientEventReporterOptions = {
  streamClient: StreamClient;
  callType: string;
  callId: string;
  getUserId: () => string;
  getCallSessionId: () => string;
  getSfuId: () => string;
  sdkVersion: string;
  userAgent: string;
};

const SEVERITY = {
  CLIENT: 1,
  TRANSPORT: 2,
  SERVER: 3,
} as const;

type StageError = {
  reason: string;
  code: string;
  severity: number;
};

type StagePairState = {
  sid: string;
  attempts: number;
  startedAt: number;
  joinSuccessIdSnapshot?: string;
  lastError?: StageError;
};

type PeerConnectionContext = {
  sfuId: string;
  userSessionId: string;
  wasPreviouslyConnected: boolean;
};

/**
 * Reports client-side join-lifecycle telemetry to
 * `POST /api/v2/video/call_client_event`.
 *
 * Three stages are tracked: `CoordinatorJoin` (HTTP `/join`), `WSJoin`
 * (SFU WebSocket open + join RPC), and `PeerConnectionConnect` (one per
 * publish/subscribe peer connection). Every stage attempt produces a pair of
 * events — an `initiated` event when the attempt begins, and a `completed`
 * event when it resolves — sharing one `event_session_id`. A shared
 * `join_success_id` correlates all pairs from one logical join lifecycle.
 *
 * `CoordinatorJoin` + `WSJoin` use the fold model: one pair is held open
 * across the `Call.join` retry loop. Internal retries within that lifecycle
 * increment `retry_count_attempt`; only the final outcome emits the
 * `completed` event. `PeerConnectionConnect` does not fold: every ICE
 * connect attempt (initial, restart, post-drop reconnect) produces its own
 * pair with a fresh `event_session_id`. `was_previously_connected`
 * distinguishes fresh connects from reconnects.
 *
 * All transports run detached from the caller's promise chain — reporting
 * never blocks or fails the join. Internal POST retries follow the SDK's
 * `retryInterval(attempt)` backoff (up to 5 attempts). Validation failures
 * (HTTP 4xx) are not retried. Events are not persisted across page reloads;
 * the backend treats absent completions as failures after a 60-second
 * grace window.
 */
export class ClientEventReporter {
  private readonly logger = videoLoggerSystem.getLogger('ClientEventReporter');

  private readonly streamClient: StreamClient;
  private readonly callType: string;
  private readonly callId: string;
  private readonly getUserId: () => string;
  private readonly getCallSessionId: () => string;
  private readonly getSfuId: () => string;
  private readonly sdkVersion: string;
  private readonly userAgent: string;
  private disposed = false;

  private joinSuccessId?: string;
  private coordinatorPair?: StagePairState;
  private wsPair?: StagePairState;
  private peerConnectionPairs: Partial<
    Record<ClientEventPeerConnection, StagePairState>
  > = {};
  private peerConnectionContexts: Partial<
    Record<ClientEventPeerConnection, PeerConnectionContext>
  > = {};
  private pcEverConnected: Record<ClientEventPeerConnection, boolean> = {
    publish: false,
    subscribe: false,
  };

  constructor(options: ClientEventReporterOptions) {
    this.streamClient = options.streamClient;
    this.callType = options.callType;
    this.callId = options.callId;
    this.getUserId = options.getUserId;
    this.getCallSessionId = options.getCallSessionId;
    this.getSfuId = options.getSfuId;
    this.sdkVersion = options.sdkVersion;
    this.userAgent = options.userAgent;
  }

  startCorrelation = () => {
    this.close();
    this.joinSuccessId = generateUUIDv4();
  };

  withJoinLifecycle = async <T>(op: () => Promise<T>): Promise<T> => {
    this.startCorrelation();
    try {
      return await op();
    } catch (err) {
      this.close();
      throw err;
    }
  };

  track = async <T>(
    stage: 'CoordinatorJoin' | 'WSJoin',
    op: () => Promise<T>,
  ): Promise<T> => {
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

  captureWsError = (opts: { code: string; reason: string }) => {
    if (!this.wsPair) return;
    applyError(this.wsPair, {
      reason: opts.reason,
      code: opts.code,
      severity: SEVERITY.SERVER,
    });
  };

  close = () => {
    if (this.coordinatorPair) this.failCoordinator();
    if (this.wsPair) this.failWs();
  };

  abort = (opts: {
    code: 'CLIENT_ABORTED' | 'BACKEND_LEAVE';
    reason: string;
  }) => {
    const { code, reason } = opts;
    const stageError: StageError = { code, reason, severity: SEVERITY.CLIENT };

    applyError(this.coordinatorPair, stageError);
    applyError(this.wsPair, stageError);

    this.failCoordinator();
    this.failWs();

    this.emitPeerConnectionFailure('publish', code, reason, 'NOT_CONNECTED');
    this.emitPeerConnectionFailure('subscribe', code, reason, 'NOT_CONNECTED');
  };

  dispose = () => {
    this.disposed = true;
  };

  onPeerConnectionStateChange = (event: PeerConnectionStateChangeEvent) => {
    const role: ClientEventPeerConnection =
      event.peerType === PeerType.SUBSCRIBER ? 'subscribe' : 'publish';

    if (event.peerConnectionState === 'failed') {
      this.emitPeerConnectionFailure(
        role,
        'DTLS_CONNECTIVITY_FAILED',
        'DTLS connectivity checks failed',
        'CONNECTED',
      );
      return;
    }

    switch (event.iceConnectionState) {
      case 'checking':
        this.openOrSupersedePeerConnectionPair(role, {
          sfuId: event.sfuId,
          userSessionId: event.userSessionId,
        });
        break;
      case 'connected':
      case 'completed':
        this.emitPeerConnectionSuccess(role);
        this.pcEverConnected[role] = true;
        break;
      case 'failed':
        this.emitPeerConnectionFailure(
          role,
          'ICE_CONNECTIVITY_FAILED',
          'ICE connectivity checks failed',
          'FAILED',
        );
        break;
      default:
        break;
    }
  };

  private openOrSupersedePeerConnectionPair = (
    role: ClientEventPeerConnection,
    ctx: { sfuId: string; userSessionId: string },
  ) => {
    if (this.peerConnectionPairs[role]) {
      this.emitPeerConnectionFailure(
        role,
        'ICE_CONNECTIVITY_FAILED',
        'Superseded by new ICE attempt',
        'NOT_CONNECTED',
      );
    }
    const pcContext: PeerConnectionContext = {
      sfuId: ctx.sfuId,
      userSessionId: ctx.userSessionId,
      wasPreviouslyConnected: this.pcEverConnected[role],
    };
    this.peerConnectionContexts[role] = pcContext;
    this.peerConnectionPairs[role] = {
      sid: generateUUIDv4(),
      attempts: 0,
      startedAt: Date.now(),
      joinSuccessIdSnapshot: this.joinSuccessId,
    };
    this.send({
      ...this.buildCommon(
        'PeerConnectionConnect',
        this.peerConnectionPairs[role]!,
      ),
      peer_connection: role,
      was_previously_connected: pcContext.wasPreviouslyConnected,
      ...(pcContext.userSessionId && {
        user_session_id: pcContext.userSessionId,
      }),
      event_type: 'initiated',
    });
  };

  private emitPeerConnectionSuccess = (role: ClientEventPeerConnection) => {
    const pair = this.peerConnectionPairs[role];
    const pcContext = this.peerConnectionContexts[role];
    if (!pair || !pcContext) return;

    this.send({
      ...this.buildCommon('PeerConnectionConnect', pair),
      peer_connection: role,
      was_previously_connected: pcContext.wasPreviouslyConnected,
      ...(pcContext.userSessionId && {
        user_session_id: pcContext.userSessionId,
      }),
      event_type: 'completed',
      outcome: 'success',
      retry_count_attempt: 0,
      elapsed_time: Date.now() - pair.startedAt,
    });
    delete this.peerConnectionPairs[role];
    delete this.peerConnectionContexts[role];
  };

  private emitPeerConnectionFailure = (
    role: ClientEventPeerConnection,
    code: ClientEventStandardCode,
    reason: string,
    iceState: 'CONNECTED' | 'FAILED' | 'NOT_CONNECTED',
  ) => {
    const pair = this.peerConnectionPairs[role];
    const pcContext = this.peerConnectionContexts[role];
    if (!pair || !pcContext) return;

    applyError(pair, { reason, code, severity: SEVERITY.SERVER });
    const finalReason = pair.lastError?.reason ?? reason;
    const finalCode = pair.lastError?.code ?? code;

    this.send({
      ...this.buildCommon('PeerConnectionConnect', pair),
      peer_connection: role,
      was_previously_connected: pcContext.wasPreviouslyConnected,
      ...(pcContext.userSessionId && {
        user_session_id: pcContext.userSessionId,
      }),
      ...(pcContext.sfuId && { sfu_id: pcContext.sfuId }),
      event_type: 'completed',
      outcome: 'failure',
      retry_count_attempt: 0,
      elapsed_time: Date.now() - pair.startedAt,
      ice_state: iceState,
      retry_failure_reason: finalReason,
      retry_failure_code: finalCode,
    });
    delete this.peerConnectionPairs[role];
    delete this.peerConnectionContexts[role];
  };

  private beginAttempt = (stage: 'CoordinatorJoin' | 'WSJoin') => {
    if (stage === 'CoordinatorJoin') {
      this.beginCoordinatorAttempt();
    } else {
      this.beginWsAttempt();
    }
  };

  private succeedAttempt = (stage: 'CoordinatorJoin' | 'WSJoin') => {
    if (stage === 'CoordinatorJoin') {
      this.succeedCoordinator();
    } else {
      this.succeedWs();
    }
  };

  private applyStageError = (
    stage: 'CoordinatorJoin' | 'WSJoin',
    err: unknown,
  ) => {
    if (stage === 'CoordinatorJoin') {
      applyError(this.coordinatorPair, mapHttpError(err));
    } else {
      applyError(this.wsPair, mapWsJoinError(err));
    }
  };

  private beginCoordinatorAttempt = () => {
    if (!this.coordinatorPair) {
      this.coordinatorPair = {
        sid: generateUUIDv4(),
        attempts: 0,
        startedAt: Date.now(),
        joinSuccessIdSnapshot: this.joinSuccessId,
      };

      this.send({
        ...this.buildCommon('CoordinatorJoin', this.coordinatorPair),
        event_type: 'initiated',
      });
    }
    this.coordinatorPair.attempts++;
  };

  private succeedCoordinator = () => {
    const pair = this.coordinatorPair;
    if (!pair) return;
    this.send({
      ...this.buildCommon('CoordinatorJoin', pair),
      event_type: 'completed',
      outcome: 'success',
      retry_count_attempt: pair.attempts - 1,
      elapsed_time: Date.now() - pair.startedAt,
    });
    this.coordinatorPair = undefined;
  };

  private failCoordinator = () => {
    const pair = this.coordinatorPair;
    if (!pair || !pair.lastError) {
      this.coordinatorPair = undefined;
      return;
    }
    const { reason, code } = pair.lastError;
    this.send({
      ...this.buildCommon('CoordinatorJoin', pair),
      event_type: 'completed',
      outcome: 'failure',
      retry_count_attempt: pair.attempts - 1,
      elapsed_time: Date.now() - pair.startedAt,
      retry_failure_reason: reason,
      retry_failure_code: code,
    });
    this.coordinatorPair = undefined;
  };

  private beginWsAttempt = () => {
    if (!this.wsPair) {
      this.wsPair = {
        sid: generateUUIDv4(),
        attempts: 0,
        startedAt: Date.now(),
        joinSuccessIdSnapshot: this.joinSuccessId,
      };
      this.send({
        ...this.buildCommon('WSJoin', this.wsPair),
        event_type: 'initiated',
      });
    }
    this.wsPair.attempts++;
  };

  private succeedWs = () => {
    const pair = this.wsPair;
    if (!pair) return;
    this.send({
      ...this.buildCommon('WSJoin', pair),
      event_type: 'completed',
      outcome: 'success',
      retry_count_attempt: pair.attempts - 1,
      elapsed_time: Date.now() - pair.startedAt,
    });
    this.wsPair = undefined;
  };

  private failWs = () => {
    const pair = this.wsPair;
    if (!pair || !pair.lastError) {
      this.wsPair = undefined;
      return;
    }
    const { reason, code } = pair.lastError;
    const sfuId = this.getSfuId();
    this.send({
      ...this.buildCommon('WSJoin', pair),
      event_type: 'completed',
      outcome: 'failure',
      retry_count_attempt: pair.attempts - 1,
      elapsed_time: Date.now() - pair.startedAt,
      ...(sfuId && { sfu_id: sfuId }),
      retry_failure_reason: reason,
      retry_failure_code: code,
    });
    this.wsPair = undefined;
  };

  private buildCommon = (
    stage: ClientEventStage,
    pair: StagePairState,
  ): Record<string, unknown> => {
    const callSessionId = this.getCallSessionId();
    return {
      user_id: this.getUserId(),
      type: this.callType,
      id: this.callId,
      call_cid: `${this.callType}:${this.callId}`,
      stage,
      event_session_id: pair.sid,
      ...(callSessionId && { call_session_id: callSessionId }),
      ...(pair.joinSuccessIdSnapshot && {
        join_success_id: pair.joinSuccessIdSnapshot,
      }),
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
    for (let attempt = 0; attempt < 5; attempt++) {
      if (this.disposed) return;
      try {
        await this.streamClient.post('/call_client_event', { events: [body] });
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
        if (attempt === 4) {
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

const errorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);

const applyError = (pair: StagePairState | undefined, next: StageError) => {
  if (!pair) return;

  if (!pair.lastError || next.severity >= pair.lastError.severity) {
    pair.lastError = next;
  }
};

const mapHttpError = (err: unknown): StageError => {
  const reason = errorMessage(err);
  const status = (err as { response?: { status?: number } })?.response?.status;
  if (typeof status === 'number' && status >= 500) {
    return { reason, code: 'REQUEST_TIMEOUT', severity: SEVERITY.SERVER };
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      reason: 'Device offline',
      code: 'NETWORK_OFFLINE',
      severity: SEVERITY.TRANSPORT,
    };
  }

  return { reason, code: 'REQUEST_TIMEOUT', severity: SEVERITY.TRANSPORT };
};

const mapWsJoinError = (err: unknown): StageError => {
  if (err instanceof SfuJoinError) {
    const sfuError = err.errorEvent.error;

    return {
      reason: sfuError?.message || err.message,
      code: sfuError ? ErrorCode[sfuError.code] : 'SFU_ERROR',
      severity: SEVERITY.SERVER,
    };
  }
  return mapHttpError(err);
};
