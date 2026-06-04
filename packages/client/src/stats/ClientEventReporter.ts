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
import type { BrowserPermission } from '../devices/BrowserPermission';
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

export type MediaPermissionState = 'GRANTED' | 'NOT_GRANTED';

export type ClientEventStandardCode =
  | 'CLIENT_ABORTED'
  | 'BACKEND_LEAVE'
  | 'REQUEST_TIMEOUT'
  | 'NETWORK_OFFLINE'
  | 'ICE_CONNECTIVITY_FAILED'
  | 'DTLS_CONNECTIVITY_FAILED';

export type CallReportContext = {
  callType: string;
  callId: string;
  getCallSessionId: () => string;
  getSfuId: () => string;
};

export type ClientEventReporterOptions = {
  streamClient: StreamClient;
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
  joinAttemptIdSnapshot?: string;
  userIdSnapshot?: string;
  lastError?: StageError;
};

type PeerConnectionContext = {
  sfuId: string;
  userSessionId: string;
  wasPreviouslyConnected: boolean;
};

const pcKey = (callId: string, role: ClientEventPeerConnection): string =>
  `${callId}:${role}`;

export class ClientEventReporter {
  private readonly logger = videoLoggerSystem.getLogger('ClientEventReporter');

  private readonly streamClient: StreamClient;
  private readonly sdkVersion: string;
  private readonly userAgent: string;
  private disposed = false;

  private coordinatorConnectId?: string;
  private coordinatorWsPair?: StagePairState;

  private callContexts = new Map<string, CallReportContext>();
  private joinAttemptIds = new Map<string, string>();
  private coordinatorPairs = new Map<string, StagePairState>();
  private wsPairs = new Map<string, StagePairState>();
  private peerConnectionPairs = new Map<string, StagePairState>();
  private peerConnectionContexts = new Map<string, PeerConnectionContext>();
  private pcEverConnected = new Map<string, boolean>();
  private firstFrameReported = new Set<string>();

  constructor(options: ClientEventReporterOptions) {
    this.streamClient = options.streamClient;
    this.sdkVersion = options.sdkVersion;
    this.userAgent = options.userAgent;
  }

  private getUserId = (): string => this.streamClient.userID ?? '';

  getCoordinatorConnectId = (): string => this.coordinatorConnectId ?? '';

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
    this.send({
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
        userIdSnapshot: this.getUserId(),
      };
      this.send({
        ...this.buildCoordinatorWsCommon(this.coordinatorWsPair),
        event_type: 'initiated',
      });
    }
    this.coordinatorWsPair.attempts++;
  };

  private succeedCoordinatorWs = () => {
    const pair = this.coordinatorWsPair;
    if (!pair) return;
    this.send({
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
    user_id: pair.userIdSnapshot ?? this.getUserId(),
    stage: 'CoordinatorWS',
    stage_id: pair.sid,
    ...(this.coordinatorConnectId && {
      coordinator_connect_id: this.coordinatorConnectId,
    }),
    timestamp: new Date().toISOString(),
    user_agent: this.userAgent,
    sdk_version: this.sdkVersion,
  });

  private emitMediaPermission = (callId: string) => {
    if (!this.callContexts.has(callId)) return;

    const pair: StagePairState = {
      sid: generateUUIDv4(),
      attempts: 0,
      startedAt: Date.now(),
      joinAttemptIdSnapshot: this.joinAttemptIds.get(callId),
    };

    this.send({
      ...this.buildCommon(callId, 'MediaDevicePermission', pair),
      ...this.sessionIdField(callId),
      microphone_permission_status: readPermissionStatus(
        getAudioBrowserPermission(),
      ),
      camera_permission_status: readPermissionStatus(
        getVideoBrowserPermission(),
      ),
      event_type: 'initiated',
    });
  };

  reportFirstFrame = (
    callId: string,
    trackType: TrackType,
    trackId: string,
  ) => {
    const stage =
      trackType === TrackType.VIDEO
        ? 'FirstVideoFrame'
        : trackType === TrackType.AUDIO
          ? 'FirstAudioFrame'
          : undefined;

    if (!stage) return;
    const key = `${callId}:${stage}`;
    if (this.firstFrameReported.has(key)) return;

    this.firstFrameReported.add(key);

    const pair: StagePairState = {
      sid: generateUUIDv4(),
      attempts: 0,
      startedAt: Date.now(),
      joinAttemptIdSnapshot: this.joinAttemptIds.get(callId),
    };

    const sfuId = this.getSfuId(callId);
    this.send({
      ...this.buildCommon(callId, stage, pair),
      ...this.sessionIdField(callId),
      ...(sfuId && { sfu_id: sfuId }),
      track_id: trackId,
      event_type: 'initiated',
    });
  };

  registerCall = (callId: string, ctx: CallReportContext) => {
    this.callContexts.set(callId, ctx);
  };

  unregisterCall = (callId: string) => {
    this.callContexts.delete(callId);
    this.joinAttemptIds.delete(callId);
    this.coordinatorPairs.delete(callId);
    this.wsPairs.delete(callId);

    this.firstFrameReported.delete(`${callId}:FirstVideoFrame`);
    this.firstFrameReported.delete(`${callId}:FirstAudioFrame`);

    for (const role of ['publish', 'subscribe'] as const) {
      const key = pcKey(callId, role);
      this.peerConnectionPairs.delete(key);
      this.peerConnectionContexts.delete(key);
      this.pcEverConnected.delete(key);
    }
  };

  startCorrelation = (callId: string) => {
    this.closeCallPairs(callId);
    this.joinAttemptIds.set(callId, generateUUIDv4());
    // a fresh attempt (e.g. full rejoin) re-reports the first frame
    this.firstFrameReported.delete(`${callId}:FirstVideoFrame`);
    this.firstFrameReported.delete(`${callId}:FirstAudioFrame`);
    this.emitJoinInitiated(callId);
    this.emitMediaPermission(callId);
  };

  withJoinLifecycle = async <T>(
    callId: string,
    op: () => Promise<T>,
  ): Promise<T> => {
    this.startCorrelation(callId);
    try {
      return await op();
    } catch (err) {
      this.closeCallPairs(callId);
      throw err;
    }
  };

  track = async <T>(
    callId: string,
    stage: 'CoordinatorJoin' | 'WSJoin',
    op: () => Promise<T>,
  ): Promise<T> => {
    this.beginAttempt(callId, stage);
    try {
      const result = await op();
      this.succeedAttempt(callId, stage);
      return result;
    } catch (err) {
      this.applyStageError(callId, stage, err);
      throw err;
    }
  };

  captureWsError = (callId: string, opts: { code: string; reason: string }) => {
    const pair = this.wsPairs.get(callId);
    if (!pair) return;

    applyError(pair, {
      reason: opts.reason,
      code: opts.code,
      severity: SEVERITY.SERVER,
    });
  };

  close = (callId: string) => {
    this.closeCallPairs(callId);
  };

  abort = (
    callId: string,
    opts: { code: 'CLIENT_ABORTED' | 'BACKEND_LEAVE'; reason: string },
  ) => {
    const { code, reason } = opts;
    const stageError: StageError = { code, reason, severity: SEVERITY.CLIENT };

    applyError(this.coordinatorPairs.get(callId), stageError);
    applyError(this.wsPairs.get(callId), stageError);

    this.failCoordinator(callId);
    this.failWs(callId);

    this.emitPeerConnectionFailure(
      callId,
      'publish',
      code,
      reason,
      'NOT_CONNECTED',
    );
    this.emitPeerConnectionFailure(
      callId,
      'subscribe',
      code,
      reason,
      'NOT_CONNECTED',
    );
  };

  private closeCallPairs = (callId: string) => {
    if (this.coordinatorPairs.get(callId)) this.failCoordinator(callId);
    if (this.wsPairs.get(callId)) this.failWs(callId);
  };

  private emitJoinInitiated = (callId: string) => {
    const joinAttemptId = this.joinAttemptIds.get(callId);
    if (!joinAttemptId) return;
    const coordinatorConnectId = this.getCoordinatorConnectId();
    this.send({
      user_id: this.getUserId(),
      stage: 'JoinInitiated',
      join_attempt_id: joinAttemptId,
      ...(coordinatorConnectId && {
        coordinator_connect_id: coordinatorConnectId,
      }),
      timestamp: new Date().toISOString(),
      user_agent: this.userAgent,
      sdk_version: this.sdkVersion,
      event_type: 'initiated',
    });
  };

  private beginAttempt = (
    callId: string,
    stage: 'CoordinatorJoin' | 'WSJoin',
  ) => {
    if (stage === 'CoordinatorJoin') this.beginCoordinatorAttempt(callId);
    else this.beginWsAttempt(callId);
  };

  private succeedAttempt = (
    callId: string,
    stage: 'CoordinatorJoin' | 'WSJoin',
  ) => {
    if (stage === 'CoordinatorJoin') this.succeedCoordinator(callId);
    else this.succeedWs(callId);
  };

  private applyStageError = (
    callId: string,
    stage: 'CoordinatorJoin' | 'WSJoin',
    err: unknown,
  ) => {
    if (stage === 'CoordinatorJoin') {
      applyError(this.coordinatorPairs.get(callId), mapHttpError(err));
    } else {
      applyError(this.wsPairs.get(callId), mapWsJoinError(err));
    }
  };

  private beginCoordinatorAttempt = (callId: string) => {
    let pair = this.coordinatorPairs.get(callId);
    if (!pair) {
      pair = {
        sid: generateUUIDv4(),
        attempts: 0,
        startedAt: Date.now(),
        joinAttemptIdSnapshot: this.joinAttemptIds.get(callId),
      };
      this.coordinatorPairs.set(callId, pair);
      this.send({
        ...this.buildCommon(callId, 'CoordinatorJoin', pair),
        event_type: 'initiated',
      });
    }
    pair.attempts++;
  };

  private succeedCoordinator = (callId: string) => {
    const pair = this.coordinatorPairs.get(callId);
    if (!pair) return;
    this.send({
      ...this.buildCommon(callId, 'CoordinatorJoin', pair),
      ...this.sessionIdField(callId),
      event_type: 'completed',
      outcome: 'success',
      retry_count_attempt: pair.attempts - 1,
      elapsed_time: Date.now() - pair.startedAt,
    });
    this.coordinatorPairs.delete(callId);
  };

  private failCoordinator = (callId: string) => {
    const pair = this.coordinatorPairs.get(callId);
    if (!pair || !pair.lastError) {
      this.coordinatorPairs.delete(callId);
      return;
    }
    const { reason, code } = pair.lastError;
    this.send({
      ...this.buildCommon(callId, 'CoordinatorJoin', pair),
      ...this.sessionIdField(callId),
      event_type: 'completed',
      outcome: 'failure',
      retry_count_attempt: pair.attempts - 1,
      elapsed_time: Date.now() - pair.startedAt,
      retry_failure_reason: reason,
      retry_failure_code: code,
    });
    this.coordinatorPairs.delete(callId);
  };

  private beginWsAttempt = (callId: string) => {
    let pair = this.wsPairs.get(callId);
    if (!pair) {
      pair = {
        sid: generateUUIDv4(),
        attempts: 0,
        startedAt: Date.now(),
        joinAttemptIdSnapshot: this.joinAttemptIds.get(callId),
      };
      this.wsPairs.set(callId, pair);
      const sfuId = this.getSfuId(callId);
      this.send({
        ...this.buildCommon(callId, 'WSJoin', pair),
        ...this.sessionIdField(callId),
        ...(sfuId && { sfu_id: sfuId }),
        event_type: 'initiated',
      });
    }
    pair.attempts++;
  };

  private succeedWs = (callId: string) => {
    const pair = this.wsPairs.get(callId);
    if (!pair) return;
    const sfuId = this.getSfuId(callId);
    this.send({
      ...this.buildCommon(callId, 'WSJoin', pair),
      ...this.sessionIdField(callId),
      ...(sfuId && { sfu_id: sfuId }),
      event_type: 'completed',
      outcome: 'success',
      retry_count_attempt: pair.attempts - 1,
      elapsed_time: Date.now() - pair.startedAt,
    });
    this.wsPairs.delete(callId);
  };

  private failWs = (callId: string) => {
    const pair = this.wsPairs.get(callId);
    if (!pair || !pair.lastError) {
      this.wsPairs.delete(callId);
      return;
    }
    const { reason, code } = pair.lastError;
    const sfuId = this.getSfuId(callId);
    this.send({
      ...this.buildCommon(callId, 'WSJoin', pair),
      ...this.sessionIdField(callId),
      event_type: 'completed',
      outcome: 'failure',
      retry_count_attempt: pair.attempts - 1,
      elapsed_time: Date.now() - pair.startedAt,
      ...(sfuId && { sfu_id: sfuId }),
      retry_failure_reason: reason,
      retry_failure_code: code,
    });
    this.wsPairs.delete(callId);
  };

  onPeerConnectionStateChange = (
    callId: string,
    event: PeerConnectionStateChangeEvent,
  ) => {
    const role: ClientEventPeerConnection =
      event.peerType === PeerType.SUBSCRIBER ? 'subscribe' : 'publish';

    if (event.iceConnectionState === 'failed') {
      this.emitPeerConnectionFailure(
        callId,
        role,
        'ICE_CONNECTIVITY_FAILED',
        'ICE connectivity checks failed',
        'FAILED',
      );
      return;
    }

    if (event.peerConnectionState === 'failed') {
      this.emitPeerConnectionFailure(
        callId,
        role,
        'DTLS_CONNECTIVITY_FAILED',
        'DTLS connectivity checks failed',
        'CONNECTED',
      );
      return;
    }

    switch (event.iceConnectionState) {
      case 'checking':
        this.openOrSupersedePeerConnectionPair(callId, role, {
          sfuId: event.sfuId,
          userSessionId: event.userSessionId,
        });
        break;
      case 'connected':
      case 'completed':
        this.emitPeerConnectionSuccess(callId, role);
        this.pcEverConnected.set(pcKey(callId, role), true);
        break;
      default:
        break;
    }
  };

  private openOrSupersedePeerConnectionPair = (
    callId: string,
    role: ClientEventPeerConnection,
    ctx: { sfuId: string; userSessionId: string },
  ) => {
    const key = pcKey(callId, role);
    if (this.peerConnectionPairs.get(key)) {
      this.emitPeerConnectionFailure(
        callId,
        role,
        'ICE_CONNECTIVITY_FAILED',
        'Superseded by new ICE attempt',
        'NOT_CONNECTED',
      );
    }

    const pcContext: PeerConnectionContext = {
      sfuId: ctx.sfuId || this.getSfuId(callId),
      userSessionId: ctx.userSessionId,
      wasPreviouslyConnected: this.pcEverConnected.get(key) === true,
    };

    const pair: StagePairState = {
      sid: generateUUIDv4(),
      attempts: 0,
      startedAt: Date.now(),
      joinAttemptIdSnapshot: this.joinAttemptIds.get(callId),
    };
    this.peerConnectionContexts.set(key, pcContext);
    this.peerConnectionPairs.set(key, pair);

    this.send({
      ...this.buildCommon(callId, 'PeerConnectionConnect', pair),
      ...this.sessionIdField(callId),
      peer_connection: role,
      was_previously_connected: pcContext.wasPreviouslyConnected,
      ...(pcContext.sfuId && { sfu_id: pcContext.sfuId }),
      ...(pcContext.userSessionId && {
        user_session_id: pcContext.userSessionId,
      }),
      event_type: 'initiated',
    });
  };

  private emitPeerConnectionSuccess = (
    callId: string,
    role: ClientEventPeerConnection,
  ) => {
    const key = pcKey(callId, role);
    const pair = this.peerConnectionPairs.get(key);
    const pcContext = this.peerConnectionContexts.get(key);
    if (!pair || !pcContext) return;

    this.send({
      ...this.buildCommon(callId, 'PeerConnectionConnect', pair),
      ...this.sessionIdField(callId),
      peer_connection: role,
      was_previously_connected: pcContext.wasPreviouslyConnected,
      ...(pcContext.sfuId && { sfu_id: pcContext.sfuId }),
      ...(pcContext.userSessionId && {
        user_session_id: pcContext.userSessionId,
      }),
      event_type: 'completed',
      outcome: 'success',
      retry_count_attempt: 0,
      elapsed_time: Date.now() - pair.startedAt,
    });
    this.peerConnectionPairs.delete(key);
    this.peerConnectionContexts.delete(key);
  };

  private emitPeerConnectionFailure = (
    callId: string,
    role: ClientEventPeerConnection,
    code: ClientEventStandardCode,
    reason: string,
    iceState: 'CONNECTED' | 'FAILED' | 'NOT_CONNECTED',
  ) => {
    const key = pcKey(callId, role);
    const pair = this.peerConnectionPairs.get(key);
    const pcContext = this.peerConnectionContexts.get(key);
    if (!pair || !pcContext) return;

    applyError(pair, { reason, code, severity: SEVERITY.SERVER });
    const finalReason = pair.lastError?.reason ?? reason;
    const finalCode = pair.lastError?.code ?? code;

    this.send({
      ...this.buildCommon(callId, 'PeerConnectionConnect', pair),
      ...this.sessionIdField(callId),
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
    this.peerConnectionPairs.delete(key);
    this.peerConnectionContexts.delete(key);
  };

  private getSfuId = (callId: string): string =>
    this.callContexts.get(callId)?.getSfuId() ?? '';

  private sessionIdField = (callId: string): Record<string, unknown> => {
    const callSessionId =
      this.callContexts.get(callId)?.getCallSessionId() ?? '';
    return callSessionId ? { call_session_id: callSessionId } : {};
  };

  private buildCommon = (
    cid: string,
    stage: ClientEventStage,
    pair: StagePairState,
  ): Record<string, unknown> => {
    const ctx = this.callContexts.get(cid);
    const coordinatorConnectId = this.getCoordinatorConnectId();
    return {
      user_id: this.getUserId(),
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
        await this.streamClient.doAxiosRequest(
          'post',
          '/call_client_event',
          { events: [body] },
          { publicEndpoint: true },
        );
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

const readPermissionStatus = (
  permission: BrowserPermission,
): MediaPermissionState =>
  getCurrentValue(permission.asStateObservable()) === 'granted'
    ? 'GRANTED'
    : 'NOT_GRANTED';

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
