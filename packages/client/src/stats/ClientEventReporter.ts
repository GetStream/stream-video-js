import { ErrorCode, PeerType, TrackType } from '../gen/video/sfu/models/models';
import type { StreamClient } from '../coordinator/connection/client';
import {
  generateUUIDv4,
  retryInterval,
  sleep,
} from '../coordinator/connection/utils';
import { SfuJoinError } from '../errors';
import { videoLoggerSystem } from '../logger';
import type { PeerConnectionStateChangeEvent } from '../rtc';
import {
  getAudioBrowserPermission,
  getVideoBrowserPermission,
} from '../devices';
import type {
  BrowserPermission,
  BrowserPermissionState,
} from '../devices/BrowserPermission';
import { getCurrentValue } from '../store/rxUtils';

export type ClientEventPeerConnection = 'publish' | 'subscribe';

export type ClientEventStage =
  | 'JoinInitiated'
  | 'CoordinatorWS'
  | 'MediaDevicePermission'
  | 'CoordinatorJoin'
  | 'WSJoin'
  | 'PeerConnectionConnect'
  | 'FirstVideoFrame'
  | 'FirstAudioFrame';

export type MediaPermissionState =
  | 'INITIATED'
  | 'FAILED'
  | 'GRANTED'
  | 'NOT_INITIATED';

export type JoinReason =
  | 'first-attempt'
  | 'network-available'
  | 'migration'
  | 'full-rejoin';

export type ClientEventStandardCode =
  | 'CLIENT_ABORTED'
  | 'BACKEND_LEAVE'
  | 'REQUEST_TIMEOUT'
  | 'ICE_CONNECTIVITY_FAILED'
  | 'DTLS_CONNECTIVITY_FAILED';

export type CallReportContext = {
  callType: string;
  callId: string;
  getSfuId: () => string;
  getCallSessionId: () => string;
  getUserSessionId: () => string;
};

export type ClientEventReporterOptions = {
  streamClient: StreamClient;
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
  joinAttemptIdSnapshot?: string;
  joinReasonSnapshot?: JoinReason;
  userIdSnapshot?: string;
  lastError?: StageError;
  initiatedDelivery?: Promise<boolean>;
};

type PeerConnectionPairState = StagePairState & {
  sfuId: string;
  userSessionId: string;
  wasPreviouslyConnected: boolean;
};

const pcKey = (cid: string, role: ClientEventPeerConnection): string =>
  `${cid}:${role}`;

export class ClientEventReporter {
  private readonly logger = videoLoggerSystem.getLogger('ClientEventReporter');

  private streamClient: StreamClient;
  private disposed = false;

  private coordinatorConnectId?: string;
  private coordinatorWsPair?: StagePairState;

  private callContexts = new Map<string, CallReportContext>();
  private joinAttemptIds = new Map<string, string>();
  private joinReasons = new Map<string, JoinReason>();
  private coordinatorPairs = new Map<string, StagePairState>();
  private wsPairs = new Map<string, StagePairState>();
  private peerConnectionPairs = new Map<string, PeerConnectionPairState>();
  private pcEverConnected = new Map<string, boolean>();
  private firstFrameReported = new Set<string>();

  constructor(options: ClientEventReporterOptions) {
    this.streamClient = options.streamClient;
  }

  mintCoordinatorConnectId = (): string => {
    this.coordinatorConnectId = generateUUIDv4();
    return this.coordinatorConnectId;
  };

  trackCoordinatorWs = async <T>(op: () => Promise<T>): Promise<T> => {
    this.beginCoordinatorWs();
    try {
      const result = await op();
      this.succeedCoordinatorWs();
      return result;
    } catch (err) {
      applyError(this.coordinatorWsPair, mapHttpError(err));
      throw err;
    }
  };

  closeCoordinatorWs = () => {
    const pair = this.coordinatorWsPair;
    if (!pair || !pair.lastError) {
      this.coordinatorWsPair = undefined;
      return;
    }

    const { reason, code } = pair.lastError;
    this.sendCompleted(pair, {
      ...this.buildCoordinatorWsCommon(pair),
      event_type: 'completed',
      outcome: 'failure',
      retry_count_attempt: pair.attempts - 1,
      elapsed_time: Date.now() - pair.startedAt,
      retry_failure_reason: reason,
      retry_failure_code: code,
    });

    this.coordinatorWsPair = undefined;
  };

  private beginCoordinatorWs = () => {
    if (!this.coordinatorWsPair) {
      this.coordinatorWsPair = {
        sid: generateUUIDv4(),
        attempts: 0,
        startedAt: Date.now(),
        userIdSnapshot: this.streamClient.userID,
      };
      this.coordinatorWsPair.initiatedDelivery = this.sendTracked({
        ...this.buildCoordinatorWsCommon(this.coordinatorWsPair),
        event_type: 'initiated',
      });
    }
    this.coordinatorWsPair.attempts++;
  };

  private succeedCoordinatorWs = () => {
    const pair = this.coordinatorWsPair;
    if (!pair) return;
    this.sendCompleted(pair, {
      ...this.buildCoordinatorWsCommon(pair),
      event_type: 'completed',
      outcome: 'success',
      retry_count_attempt: pair.attempts - 1,
      elapsed_time: Date.now() - pair.startedAt,
    });
    this.coordinatorWsPair = undefined;
  };

  private buildCoordinatorWsCommon = (
    pair: StagePairState,
  ): Record<string, unknown> => ({
    user_id: pair.userIdSnapshot ?? this.streamClient.userID,
    stage: 'CoordinatorWS',
    stage_id: pair.sid,
    ...(this.coordinatorConnectId && {
      coordinator_connect_id: this.coordinatorConnectId,
    }),
    timestamp: new Date().toISOString(),
    user_agent: this.streamClient.getUserAgent(),
    sdk_version: this.streamClient.getSdkVersion(),
  });

  private emitMediaPermission = (cid: string) => {
    if (!this.callContexts.has(cid)) return;

    const pair: StagePairState = {
      sid: generateUUIDv4(),
      attempts: 0,
      startedAt: Date.now(),
      joinAttemptIdSnapshot: this.joinAttemptIds.get(cid),
    };

    this.send({
      ...this.buildCommon(cid, 'MediaDevicePermission', pair),
      ...this.sessionIdField(cid),
      microphone_permission_status: readPermissionStatus(
        getAudioBrowserPermission(),
      ),
      camera_permission_status: readPermissionStatus(
        getVideoBrowserPermission(),
      ),
      event_type: 'initiated',
    });
  };

  reportFirstFrame = (cid: string, trackType: TrackType, trackId: string) => {
    const stage =
      trackType === TrackType.VIDEO
        ? 'FirstVideoFrame'
        : trackType === TrackType.AUDIO
          ? 'FirstAudioFrame'
          : undefined;

    if (!stage) return;
    const key = `${cid}:${stage}`;
    if (this.firstFrameReported.has(key)) return;

    this.firstFrameReported.add(key);

    const pair: StagePairState = {
      sid: generateUUIDv4(),
      attempts: 0,
      startedAt: Date.now(),
      joinAttemptIdSnapshot: this.joinAttemptIds.get(cid),
    };

    const resolvedSfuId = this.getSfuId(cid);
    this.send({
      ...this.buildCommon(cid, stage, pair),
      ...this.sessionIdField(cid),
      ...(resolvedSfuId && { sfu_id: resolvedSfuId }),
      track_id: trackId,
      event_type: 'initiated',
    });
  };

  registerCall = (cid: string, ctx: CallReportContext) => {
    this.callContexts.set(cid, ctx);
  };

  unregisterCall = (cid: string) => {
    this.callContexts.delete(cid);
    this.joinAttemptIds.delete(cid);
    this.joinReasons.delete(cid);
    this.coordinatorPairs.delete(cid);
    this.wsPairs.delete(cid);

    this.firstFrameReported.delete(`${cid}:FirstVideoFrame`);
    this.firstFrameReported.delete(`${cid}:FirstAudioFrame`);

    for (const role of ['publish', 'subscribe'] as const) {
      const key = pcKey(cid, role);
      this.peerConnectionPairs.delete(key);
      this.pcEverConnected.delete(key);
    }
  };

  startCorrelation = (cid: string, joinReason: JoinReason) => {
    this.closeCallPairs(cid);

    this.joinAttemptIds.set(cid, generateUUIDv4());
    this.joinReasons.set(cid, joinReason);
    this.firstFrameReported.delete(`${cid}:FirstVideoFrame`);
    this.firstFrameReported.delete(`${cid}:FirstAudioFrame`);

    this.emitJoinInitiated(cid);
    this.emitMediaPermission(cid);
  };

  withJoinLifecycle = async <T>(
    cid: string,
    joinReason: JoinReason,
    op: () => Promise<T>,
  ): Promise<T> => {
    this.startCorrelation(cid, joinReason);
    try {
      return await op();
    } catch (err) {
      this.closeCallPairs(cid);
      throw err;
    }
  };

  track = async <T>(
    cid: string,
    stage: 'CoordinatorJoin' | 'WSJoin',
    op: () => Promise<T>,
  ): Promise<T> => {
    this.beginAttempt(cid, stage);
    try {
      const result = await op();
      this.succeedAttempt(cid, stage);
      return result;
    } catch (err) {
      this.applyStageError(cid, stage, err);
      throw err;
    }
  };

  captureWsError = (cid: string, opts: { code: string; reason: string }) => {
    const pair = this.wsPairs.get(cid);
    if (!pair) return;

    applyError(pair, {
      reason: opts.reason,
      code: opts.code,
      severity: SEVERITY.SERVER,
    });
  };

  close = (cid: string) => {
    this.closeCallPairs(cid);
  };

  abort = (
    cid: string,
    opts: { code: 'CLIENT_ABORTED' | 'BACKEND_LEAVE'; reason: string },
  ) => {
    const { code, reason } = opts;
    const stageError: StageError = { code, reason, severity: SEVERITY.CLIENT };

    applyError(this.coordinatorPairs.get(cid), stageError);
    applyError(this.wsPairs.get(cid), stageError);

    this.failCoordinator(cid);
    this.failWs(cid);

    this.emitPeerConnectionFailure(
      cid,
      'publish',
      code,
      reason,
      'NOT_CONNECTED',
    );
    this.emitPeerConnectionFailure(
      cid,
      'subscribe',
      code,
      reason,
      'NOT_CONNECTED',
    );
  };

  private closeCallPairs = (cid: string) => {
    if (this.coordinatorPairs.get(cid)) this.failCoordinator(cid);
    if (this.wsPairs.get(cid)) this.failWs(cid);
  };

  private emitJoinInitiated = (cid: string) => {
    const joinAttemptId = this.joinAttemptIds.get(cid);
    if (!joinAttemptId) return;
    const coordinatorConnectId = this.coordinatorConnectId;
    this.send({
      user_id: this.streamClient.userID,
      stage: 'JoinInitiated',
      join_attempt_id: joinAttemptId,
      ...(coordinatorConnectId && {
        coordinator_connect_id: coordinatorConnectId,
      }),
      timestamp: new Date().toISOString(),
      user_agent: this.streamClient.getUserAgent(),
      sdk_version: this.streamClient.getSdkVersion(),
      event_type: 'initiated',
    });
  };

  private beginAttempt = (cid: string, stage: 'CoordinatorJoin' | 'WSJoin') => {
    if (stage === 'CoordinatorJoin') this.beginCoordinatorAttempt(cid);
    else this.beginWsAttempt(cid);
  };

  private succeedAttempt = (
    cid: string,
    stage: 'CoordinatorJoin' | 'WSJoin',
  ) => {
    if (stage === 'CoordinatorJoin') this.succeedCoordinator(cid);
    else this.succeedWs(cid);
  };

  private applyStageError = (
    cid: string,
    stage: 'CoordinatorJoin' | 'WSJoin',
    err: unknown,
  ) => {
    if (stage === 'CoordinatorJoin') {
      applyError(this.coordinatorPairs.get(cid), mapHttpError(err));
    } else {
      applyError(this.wsPairs.get(cid), mapWsJoinError(err));
    }
  };

  private beginCoordinatorAttempt = (cid: string) => {
    let pair = this.coordinatorPairs.get(cid);
    if (!pair) {
      pair = {
        sid: generateUUIDv4(),
        attempts: 0,
        startedAt: Date.now(),
        joinAttemptIdSnapshot: this.joinAttemptIds.get(cid),
        joinReasonSnapshot: this.joinReasons.get(cid),
      };
      this.coordinatorPairs.set(cid, pair);
      pair.initiatedDelivery = this.sendTracked({
        ...this.buildCommon(cid, 'CoordinatorJoin', pair),
        ...(pair.joinReasonSnapshot && {
          join_reason: pair.joinReasonSnapshot,
        }),
        event_type: 'initiated',
      });
    }
    pair.attempts++;
  };

  private succeedCoordinator = (cid: string) => {
    const pair = this.coordinatorPairs.get(cid);
    if (!pair) return;
    this.sendCompleted(pair, {
      ...this.buildCommon(cid, 'CoordinatorJoin', pair),
      ...this.sessionIdField(cid),
      ...(pair.joinReasonSnapshot && { join_reason: pair.joinReasonSnapshot }),
      event_type: 'completed',
      outcome: 'success',
      retry_count_attempt: pair.attempts - 1,
      elapsed_time: Date.now() - pair.startedAt,
    });
    this.coordinatorPairs.delete(cid);
  };

  private failCoordinator = (cid: string) => {
    const pair = this.coordinatorPairs.get(cid);
    if (!pair || !pair.lastError) {
      this.coordinatorPairs.delete(cid);
      return;
    }
    const { reason, code } = pair.lastError;
    this.sendCompleted(pair, {
      ...this.buildCommon(cid, 'CoordinatorJoin', pair),
      ...this.sessionIdField(cid),
      ...(pair.joinReasonSnapshot && { join_reason: pair.joinReasonSnapshot }),
      event_type: 'completed',
      outcome: 'failure',
      retry_count_attempt: pair.attempts - 1,
      elapsed_time: Date.now() - pair.startedAt,
      retry_failure_reason: reason,
      retry_failure_code: code,
    });
    this.coordinatorPairs.delete(cid);
  };

  private beginWsAttempt = (cid: string) => {
    let pair = this.wsPairs.get(cid);
    if (!pair) {
      pair = {
        sid: generateUUIDv4(),
        attempts: 0,
        startedAt: Date.now(),
        joinAttemptIdSnapshot: this.joinAttemptIds.get(cid),
      };
      this.wsPairs.set(cid, pair);
      const sfuId = this.getSfuId(cid);
      pair.initiatedDelivery = this.sendTracked({
        ...this.buildCommon(cid, 'WSJoin', pair),
        ...this.sessionIdField(cid),
        ...(sfuId && { sfu_id: sfuId }),
        event_type: 'initiated',
      });
    }
    pair.attempts++;
  };

  private succeedWs = (cid: string) => {
    const pair = this.wsPairs.get(cid);
    if (!pair) return;
    const sfuId = this.getSfuId(cid);
    this.sendCompleted(pair, {
      ...this.buildCommon(cid, 'WSJoin', pair),
      ...this.sessionIdField(cid),
      ...(sfuId && { sfu_id: sfuId }),
      event_type: 'completed',
      outcome: 'success',
      retry_count_attempt: pair.attempts - 1,
      elapsed_time: Date.now() - pair.startedAt,
    });
    this.wsPairs.delete(cid);
  };

  private failWs = (cid: string) => {
    const pair = this.wsPairs.get(cid);
    if (!pair || !pair.lastError) {
      this.wsPairs.delete(cid);
      return;
    }
    const { reason, code } = pair.lastError;
    const sfuId = this.getSfuId(cid);
    this.sendCompleted(pair, {
      ...this.buildCommon(cid, 'WSJoin', pair),
      ...this.sessionIdField(cid),
      event_type: 'completed',
      outcome: 'failure',
      retry_count_attempt: pair.attempts - 1,
      elapsed_time: Date.now() - pair.startedAt,
      ...(sfuId && { sfu_id: sfuId }),
      retry_failure_reason: reason,
      retry_failure_code: code,
    });
    this.wsPairs.delete(cid);
  };

  onPeerConnectionStateChange = (
    cid: string,
    event: PeerConnectionStateChangeEvent,
  ) => {
    const role: ClientEventPeerConnection =
      event.peerType === PeerType.SUBSCRIBER ? 'subscribe' : 'publish';

    if (event.stateType === 'ice' && event.state === 'failed') {
      this.emitPeerConnectionFailure(
        cid,
        role,
        'ICE_CONNECTIVITY_FAILED',
        'ICE connectivity checks failed',
        'FAILED',
      );
      return;
    }

    if (event.stateType === 'peerConnection' && event.state === 'failed') {
      this.emitPeerConnectionFailure(
        cid,
        role,
        'DTLS_CONNECTIVITY_FAILED',
        'DTLS connectivity checks failed',
        'CONNECTED',
      );
      return;
    }

    if (event.stateType !== 'peerConnection') return;

    switch (event.state) {
      case 'connecting':
        if (this.peerConnectionPairs.has(pcKey(cid, role))) return;
        this.openPeerConnectionPair(cid, role);
        break;
      case 'connected':
        this.emitPeerConnectionSuccess(cid, role);
        this.pcEverConnected.set(pcKey(cid, role), true);
        break;
      default:
        break;
    }
  };

  private openPeerConnectionPair = (
    cid: string,
    role: ClientEventPeerConnection,
  ) => {
    const key = pcKey(cid, role);
    const pair: PeerConnectionPairState = {
      sid: generateUUIDv4(),
      attempts: 0,
      startedAt: Date.now(),
      joinAttemptIdSnapshot: this.joinAttemptIds.get(cid),
      sfuId: this.getSfuId(cid),
      userSessionId: this.getUserSessionId(cid),
      wasPreviouslyConnected: this.pcEverConnected.get(key) === true,
    };
    this.peerConnectionPairs.set(key, pair);

    pair.initiatedDelivery = this.sendTracked({
      ...this.buildCommon(cid, 'PeerConnectionConnect', pair),
      ...this.sessionIdField(cid),
      peer_connection: role,
      was_previously_connected: pair.wasPreviouslyConnected,
      ...(pair.sfuId && { sfu_id: pair.sfuId }),
      ...(pair.userSessionId && {
        user_session_id: pair.userSessionId,
      }),
      event_type: 'initiated',
    });
  };

  private emitPeerConnectionSuccess = (
    cid: string,
    role: ClientEventPeerConnection,
  ) => {
    const key = pcKey(cid, role);
    const pair = this.peerConnectionPairs.get(key);
    if (!pair) return;

    this.sendCompleted(pair, {
      ...this.buildCommon(cid, 'PeerConnectionConnect', pair),
      ...this.sessionIdField(cid),
      peer_connection: role,
      was_previously_connected: pair.wasPreviouslyConnected,
      ...(pair.sfuId && { sfu_id: pair.sfuId }),
      ...(pair.userSessionId && {
        user_session_id: pair.userSessionId,
      }),
      event_type: 'completed',
      outcome: 'success',
      retry_count_attempt: 0,
      elapsed_time: Date.now() - pair.startedAt,
    });
    this.peerConnectionPairs.delete(key);
  };

  private emitPeerConnectionFailure = (
    cid: string,
    role: ClientEventPeerConnection,
    code: ClientEventStandardCode,
    reason: string,
    iceState: 'CONNECTED' | 'FAILED' | 'NOT_CONNECTED',
  ) => {
    const key = pcKey(cid, role);
    const pair = this.peerConnectionPairs.get(key);
    if (!pair) return;

    this.sendCompleted(pair, {
      ...this.buildCommon(cid, 'PeerConnectionConnect', pair),
      ...this.sessionIdField(cid),
      peer_connection: role,
      was_previously_connected: pair.wasPreviouslyConnected,
      ...(pair.userSessionId && {
        user_session_id: pair.userSessionId,
      }),
      ...(pair.sfuId && { sfu_id: pair.sfuId }),
      event_type: 'completed',
      outcome: 'failure',
      retry_count_attempt: 0,
      elapsed_time: Date.now() - pair.startedAt,
      ice_state: iceState,
      retry_failure_reason: reason,
      retry_failure_code: code,
    });
    this.peerConnectionPairs.delete(key);
  };

  private getSfuId = (cid: string): string =>
    this.callContexts.get(cid)?.getSfuId() ?? '';

  private getUserSessionId = (cid: string): string =>
    this.callContexts.get(cid)?.getUserSessionId() ?? '';

  private sessionIdField = (cid: string): Record<string, unknown> => {
    const callSessionId = this.callContexts.get(cid)?.getCallSessionId() ?? '';
    return callSessionId ? { call_session_id: callSessionId } : {};
  };

  private buildCommon = (
    cid: string,
    stage: ClientEventStage,
    pair: StagePairState,
  ): Record<string, unknown> => {
    const ctx = this.callContexts.get(cid);
    const coordinatorConnectId = this.coordinatorConnectId;
    return {
      user_id: this.streamClient.userID,
      type: ctx?.callType ?? '',
      id: ctx?.callId ?? '',
      call_cid: cid,
      stage,
      stage_id: pair.sid,
      ...(pair.joinAttemptIdSnapshot && {
        join_attempt_id: pair.joinAttemptIdSnapshot,
      }),
      ...(coordinatorConnectId && {
        coordinator_connect_id: coordinatorConnectId,
      }),
      timestamp: new Date().toISOString(),
      user_agent: this.streamClient.getUserAgent(),
      sdk_version: this.streamClient.getSdkVersion(),
    };
  };

  private send = (body: Record<string, unknown>) => {
    if (this.disposed) return;

    void this.sendWithRetry(body);
  };

  private sendTracked = (body: Record<string, unknown>): Promise<boolean> => {
    if (this.disposed) return Promise.resolve(false);
    return this.sendWithRetry(body);
  };

  private sendCompleted = (
    pair: StagePairState,
    body: Record<string, unknown>,
  ) => {
    const gate = pair.initiatedDelivery ?? Promise.resolve(true);
    void gate.then((delivered) => {
      if (delivered) {
        this.send(body);
      } else {
        this.logger.debug(
          'Skipping completed event; its initiated was not delivered',
          body.stage,
        );
      }
    });
  };

  private sendWithRetry = async (
    body: Record<string, unknown>,
  ): Promise<boolean> => {
    for (let attempt = 0; attempt < 5; attempt++) {
      if (this.disposed) return false;

      try {
        await this.streamClient.doAxiosRequest(
          'post',
          '/call_client_event',
          { events: [body] },
          { publicEndpoint: true },
        );
        return true;
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response
          ?.status;
        if (typeof status === 'number' && status >= 400 && status < 500) {
          this.logger.debug(
            `Client event rejected (${status}), not retrying`,
            body.stage,
            body.event_type,
          );
          return false;
        }
        if (attempt === 4) {
          this.logger.debug(
            'Client event delivery failed after retries',
            body.stage,
            body.event_type,
            err,
          );
          return false;
        }
        await sleep(retryInterval(attempt));
      }
    }
    return false;
  };
}

const readPermissionStatus = (
  permission: BrowserPermission,
): MediaPermissionState => {
  const state = getCurrentValue<BrowserPermissionState>(
    permission.asStateObservable(),
  );

  switch (state) {
    case 'granted':
      return 'GRANTED';
    case 'denied':
      return 'FAILED';
    case 'prompting':
      return 'INITIATED';
    case 'prompt':
    default:
      return 'NOT_INITIATED';
  }
};

const errorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);

const isTimeout = (err: unknown): boolean => {
  const e = err as { code?: string; name?: string; message?: string } | null;

  return (
    e?.code === 'ECONNABORTED' ||
    e?.name === 'TimeoutError' ||
    /timed out|timeout/i.test(e?.message ?? '')
  );
};

const applyError = (pair: StagePairState | undefined, next: StageError) => {
  if (!pair) return;

  if (!pair.lastError || next.severity >= pair.lastError.severity) {
    pair.lastError = next;
  }
};

const mapHttpError = (err: unknown): StageError => {
  const reason = errorMessage(err);
  const status = (err as { response?: { status?: number } })?.response?.status;

  if (isTimeout(err)) {
    return { reason, code: 'REQUEST_TIMEOUT', severity: SEVERITY.TRANSPORT };
  }
  if (typeof status === 'number' && status >= 500) {
    return { reason, code: `HTTP_${status}`, severity: SEVERITY.SERVER };
  }

  return { reason, code: 'NETWORK_ERROR', severity: SEVERITY.TRANSPORT };
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
