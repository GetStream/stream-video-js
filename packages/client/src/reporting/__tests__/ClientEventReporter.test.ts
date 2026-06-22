import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import { of } from 'rxjs';
import { ClientEventReporter, CallReportContext } from '../ClientEventReporter';
import type { StreamClient } from '../../coordinator/connection/client';
import { ErrorFromResponse } from '../../coordinator/connection/types';
import { SfuTimeoutError } from '../../errors';
import type { AxiosResponse } from 'axios';
import { PeerType, TrackType } from '../../gen/video/sfu/models/models';

vi.mock('../../devices', () => ({
  getAudioBrowserPermission: () => ({ asStateObservable: () => of('granted') }),
  getVideoBrowserPermission: () => ({ asStateObservable: () => of('granted') }),
}));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('ClientEventReporter', () => {
  const cid = 'default:call-1';
  let doAxiosRequest: ReturnType<typeof vi.fn>;
  let reporter: ClientEventReporter;
  let connectId: string;

  const postedEvents = (): Array<Record<string, any>> =>
    doAxiosRequest.mock.calls.map((call) => call[2].events[0]);

  beforeEach(() => {
    doAxiosRequest = vi.fn().mockResolvedValue({});
    const streamClient = fromPartial<StreamClient>({
      userID: 'user-1',
      doAxiosRequest,
      getUserAgent: () => 'test-agent',
      getSdkVersion: () => '1.0.0',
    });
    reporter = new ClientEventReporter({ streamClient });
    connectId = reporter.startCoordinatorConnection('user-1');

    const ctx: CallReportContext = {
      callType: 'default',
      callId: 'call-1',
      getCallSessionId: () => 'session-1',
      getSfuId: () => 'sfu-1',
      getUserSessionId: () => 'user-session-1',
    };
    reporter.registerCall(cid, ctx);
  });

  it('emits an initiated then a completed event on success', async () => {
    reporter.startCorrelation(cid, 'first-attempt');
    await reporter.track(cid, 'CoordinatorJoin', () => Promise.resolve('ok'));
    await flush();

    const events = postedEvents().filter((e) => e.stage === 'CoordinatorJoin');
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      event_type: 'initiated',
      call_cid: cid,
      user_id: 'user-1',
      coordinator_connect_id: connectId,
      join_reason: 'first-attempt',
    });
    expect(events[1]).toMatchObject({
      event_type: 'completed',
      outcome: 'success',
      retry_count_attempt: 0,
      join_reason: 'first-attempt',
    });

    expect(events[0].stage_id).toBe(events[1].stage_id);
    expect(events[0].join_attempt_id).toBeTruthy();
  });

  it('carries the join_reason given to startCorrelation', async () => {
    reporter.startCorrelation(cid, 'migration');
    await reporter.track(cid, 'CoordinatorJoin', () => Promise.resolve('ok'));
    await flush();

    const events = postedEvents().filter((e) => e.stage === 'CoordinatorJoin');
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ join_reason: 'migration' });
    expect(events[1]).toMatchObject({ join_reason: 'migration' });
  });

  it('folds in-stage retries into a single pair', async () => {
    reporter.startCorrelation(cid, 'first-attempt');
    await expect(
      reporter.track(cid, 'CoordinatorJoin', () =>
        Promise.reject(new Error('boom')),
      ),
    ).rejects.toThrow('boom');
    await reporter.track(cid, 'CoordinatorJoin', () => Promise.resolve('ok'));
    await flush();

    const events = postedEvents().filter((e) => e.stage === 'CoordinatorJoin');
    const initiated = events.filter((e) => e.event_type === 'initiated');
    const completed = events.filter((e) => e.event_type === 'completed');

    expect(initiated).toHaveLength(1);
    expect(completed).toHaveLength(1);
    expect(completed[0]).toMatchObject({
      outcome: 'success',
      retry_count_attempt: 1,
    });
  });

  it('reports the latest error when folded retries fail differently', async () => {
    reporter.startCorrelation(cid, 'first-attempt');
    const attempt = (err: Error) =>
      expect(
        reporter.track(cid, 'CoordinatorJoin', () => Promise.reject(err)),
      ).rejects.toThrow();

    await attempt(new Error('error A'));
    await attempt(new Error('error B'));
    await attempt(new Error('error B'));
    reporter.close(cid);
    await flush();

    const completed = postedEvents().filter(
      (e) => e.stage === 'CoordinatorJoin' && e.event_type === 'completed',
    );
    expect(completed).toHaveLength(1);
    expect(completed[0]).toMatchObject({
      outcome: 'failure',
      retry_count_attempt: 2,
      retry_failure_reason: 'error B',
    });
  });

  it('emits a failure completion on abort', async () => {
    reporter.startCorrelation(cid, 'first-attempt');
    void reporter.track(cid, 'CoordinatorJoin', () => new Promise(() => {}));
    reporter.abort(cid, { code: 'CLIENT_ABORTED', reason: 'user left' });
    await flush();

    const completed = postedEvents().filter(
      (e) => e.stage === 'CoordinatorJoin' && e.event_type === 'completed',
    );

    expect(completed).toHaveLength(1);
    expect(completed[0]).toMatchObject({
      outcome: 'failure',
      retry_failure_code: 'CLIENT_ABORTED',
      retry_failure_reason: 'user left',
    });
  });

  it('emits a JoinInitiated event when correlation starts', async () => {
    reporter.startCorrelation(cid, 'first-attempt');
    await flush();

    const join = postedEvents().filter((e) => e.stage === 'JoinInitiated');
    expect(join).toHaveLength(1);
    expect(join[0]).toMatchObject({
      event_type: 'initiated',
      coordinator_connect_id: connectId,
    });
    expect(join[0].join_attempt_id).toBeTruthy();
  });

  it('does not retry events rejected with a 4xx', async () => {
    doAxiosRequest.mockRejectedValue({ response: { status: 400 } });
    reporter.reportFirstFrame(cid, TrackType.VIDEO, 'track-1');
    await flush();

    expect(doAxiosRequest).toHaveBeenCalledTimes(1);
  });

  it('tracks the coordinator websocket connection', async () => {
    await reporter.trackCoordinatorWs(() => Promise.resolve('ok'));
    await flush();

    const events = postedEvents().filter((e) => e.stage === 'CoordinatorWS');
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      event_type: 'initiated',
      coordinator_connect_id: connectId,
    });
    expect(events[1]).toMatchObject({
      event_type: 'completed',
      outcome: 'success',
    });
  });

  it('reports a failed coordinator websocket connection on close', async () => {
    await expect(
      reporter.trackCoordinatorWs(() => Promise.reject(new Error('ws down'))),
    ).rejects.toThrow('ws down');
    reporter.closeCoordinatorWs();
    await flush();

    const completed = postedEvents().filter(
      (e) => e.stage === 'CoordinatorWS' && e.event_type === 'completed',
    );
    expect(completed).toHaveLength(1);
    expect(completed[0]).toMatchObject({
      outcome: 'failure',
      retry_failure_code: 'SERVER_ERROR',
      retry_failure_reason: 'ws down',
    });
  });

  it('reports an API-rejected websocket connection with the backend code', async () => {
    const rejection = new Error(
      JSON.stringify({
        code: 41,
        StatusCode: 401,
        message: 'bad token',
        isWSFailure: false,
      }),
    );
    await expect(
      reporter.trackCoordinatorWs(() => Promise.reject(rejection)),
    ).rejects.toThrow();
    reporter.closeCoordinatorWs();
    await flush();

    const completed = postedEvents().filter(
      (e) => e.stage === 'CoordinatorWS' && e.event_type === 'completed',
    );
    expect(completed).toHaveLength(1);
    expect(completed[0]).toMatchObject({
      outcome: 'failure',
      retry_failure_code: '41',
      retry_failure_reason: 'bad token',
    });
  });

  it('reports a transient websocket failure with the default code', async () => {
    const failure = new Error(
      JSON.stringify({
        code: '',
        StatusCode: '',
        message: 'initial WS connection could not be established',
        isWSFailure: true,
      }),
    );
    await expect(
      reporter.trackCoordinatorWs(() => Promise.reject(failure)),
    ).rejects.toThrow();
    reporter.closeCoordinatorWs();
    await flush();

    const completed = postedEvents().filter(
      (e) => e.stage === 'CoordinatorWS' && e.event_type === 'completed',
    );
    expect(completed).toHaveLength(1);
    expect(completed[0]).toMatchObject({
      outcome: 'failure',
      retry_failure_code: 'SERVER_ERROR',
      retry_failure_reason: 'initial WS connection could not be established',
    });
  });

  it('forwards the backend error code and status on a server error', async () => {
    const err = new ErrorFromResponse({
      message: 'server boom',
      code: 16,
      status: 500,
      response: fromPartial<AxiosResponse>({}),
      unrecoverable: false,
    });
    await expect(
      reporter.trackCoordinatorWs(() => Promise.reject(err)),
    ).rejects.toBe(err);
    reporter.closeCoordinatorWs();
    await flush();

    const completed = postedEvents().filter(
      (e) => e.stage === 'CoordinatorWS' && e.event_type === 'completed',
    );
    expect(completed[0]).toMatchObject({
      outcome: 'failure',
      retry_failure_code: '16',
      retry_failure_reason: 'server boom',
    });
  });

  it('includes sfu_id and call_session_id on a WSJoin completion', async () => {
    reporter.startCorrelation(cid, 'first-attempt');
    await reporter.track(cid, 'WSJoin', () => Promise.resolve('ok'));
    await flush();

    const events = postedEvents().filter((e) => e.stage === 'WSJoin');
    expect(events).toHaveLength(2);
    expect(events[1]).toMatchObject({
      event_type: 'completed',
      outcome: 'success',
      sfu_id: 'sfu-1',
      call_session_id: 'session-1',
    });
  });

  it('folds in-stage WSJoin retries into a single pair', async () => {
    reporter.startCorrelation(cid, 'first-attempt');
    await expect(
      reporter.track(cid, 'WSJoin', () => Promise.reject(new Error('boom'))),
    ).rejects.toThrow('boom');
    await reporter.track(cid, 'WSJoin', () => Promise.resolve('ok'));
    await flush();

    const events = postedEvents().filter((e) => e.stage === 'WSJoin');
    const initiated = events.filter((e) => e.event_type === 'initiated');
    const completed = events.filter((e) => e.event_type === 'completed');

    expect(initiated).toHaveLength(1);
    expect(completed).toHaveLength(1);
    expect(completed[0]).toMatchObject({
      outcome: 'success',
      retry_count_attempt: 1,
    });
  });

  it('reports a WSJoin failure with the captured SFU error', async () => {
    reporter.startCorrelation(cid, 'first-attempt');
    void reporter.track(cid, 'WSJoin', () => new Promise(() => {}));
    reporter.captureWsError(cid, { code: 'SFU_ERROR', reason: 'sfu closed' });
    reporter.close(cid);
    await flush();

    const completed = postedEvents().filter(
      (e) => e.stage === 'WSJoin' && e.event_type === 'completed',
    );
    expect(completed).toHaveLength(1);
    expect(completed[0]).toMatchObject({
      outcome: 'failure',
      retry_failure_code: 'SFU_ERROR',
      retry_failure_reason: 'sfu closed',
    });
  });

  it('keeps the captured SFU error over CLIENT_ABORTED on abort', async () => {
    reporter.startCorrelation(cid, 'first-attempt');
    void reporter.track(cid, 'WSJoin', () => new Promise(() => {}));
    reporter.captureWsError(cid, {
      code: 'SFU_ERROR',
      reason: 'sfu disconnect',
    });
    reporter.abort(cid, {
      code: 'CLIENT_ABORTED',
      reason: 'SFU instructed to disconnect',
    });
    await flush();

    const completed = postedEvents().filter(
      (e) => e.stage === 'WSJoin' && e.event_type === 'completed',
    );
    expect(completed).toHaveLength(1);
    expect(completed[0]).toMatchObject({
      outcome: 'failure',
      retry_failure_code: 'SFU_ERROR',
      retry_failure_reason: 'sfu disconnect',
    });
  });

  it('keeps a captured SFU error over a later WSJoin timeout', async () => {
    reporter.startCorrelation(cid, 'first-attempt');
    await expect(
      reporter.track(cid, 'WSJoin', async () => {
        reporter.captureWsError(cid, {
          code: 'SFU_ERROR',
          reason: 'unauthenticated',
        });
        throw new SfuTimeoutError(
          'SFU WS connection failed to open after 5000ms',
        );
      }),
    ).rejects.toThrow();
    reporter.close(cid);
    await flush();

    const completed = postedEvents().filter(
      (e) => e.stage === 'WSJoin' && e.event_type === 'completed',
    );
    expect(completed).toHaveLength(1);
    expect(completed[0]).toMatchObject({
      outcome: 'failure',
      retry_failure_code: 'SFU_ERROR',
      retry_failure_reason: 'unauthenticated',
    });
  });

  it('lets a later WSJoin attempt override a previous attempt captured error', async () => {
    reporter.startCorrelation(cid, 'first-attempt');
    await expect(
      reporter.track(cid, 'WSJoin', async () => {
        reporter.captureWsError(cid, {
          code: 'SFU_ERROR',
          reason: 'attempt 1 sfu error',
        });
        throw new SfuTimeoutError('attempt 1 timeout');
      }),
    ).rejects.toThrow();
    await expect(
      reporter.track(cid, 'WSJoin', () =>
        Promise.reject(new SfuTimeoutError('attempt 2 timeout')),
      ),
    ).rejects.toThrow();
    reporter.close(cid);
    await flush();

    const completed = postedEvents().filter(
      (e) => e.stage === 'WSJoin' && e.event_type === 'completed',
    );
    expect(completed).toHaveLength(1);
    expect(completed[0]).toMatchObject({
      outcome: 'failure',
      retry_count_attempt: 1,
      retry_failure_code: 'REQUEST_TIMEOUT',
      retry_failure_reason: 'attempt 2 timeout',
    });
  });

  it('reports a WSJoin timeout as REQUEST_TIMEOUT', async () => {
    reporter.startCorrelation(cid, 'first-attempt');
    await expect(
      reporter.track(cid, 'WSJoin', () =>
        Promise.reject(
          new SfuTimeoutError('SFU WS connection failed to open after 5000ms'),
        ),
      ),
    ).rejects.toThrow();
    reporter.close(cid);
    await flush();

    const completed = postedEvents().filter(
      (e) => e.stage === 'WSJoin' && e.event_type === 'completed',
    );
    expect(completed).toHaveLength(1);
    expect(completed[0]).toMatchObject({
      outcome: 'failure',
      retry_failure_code: 'REQUEST_TIMEOUT',
    });
  });

  it('reports media device permission status on correlation start', async () => {
    reporter.startCorrelation(cid, 'first-attempt');
    await flush();

    const perm = postedEvents().filter(
      (e) => e.stage === 'MediaDevicePermission',
    );
    expect(perm).toHaveLength(1);
    expect(perm[0]).toMatchObject({
      event_type: 'initiated',
      microphone_permission_status: 'GRANTED',
      camera_permission_status: 'GRANTED',
    });
  });

  it('reports the first video frame only once', async () => {
    reporter.startCorrelation(cid, 'first-attempt');
    reporter.reportFirstFrame(cid, TrackType.VIDEO, 'track-1');
    reporter.reportFirstFrame(cid, TrackType.VIDEO, 'track-1');
    await flush();

    const frames = postedEvents().filter((e) => e.stage === 'FirstVideoFrame');
    expect(frames).toHaveLength(1);
    expect(frames[0]).toMatchObject({
      event_type: 'initiated',
      track_id: 'track-1',
      sfu_id: 'sfu-1',
    });
  });

  it('tracks a publisher peer connection connect', async () => {
    reporter.startCorrelation(cid, 'first-attempt');
    reporter.onPeerConnectionStateChange(cid, {
      peerType: PeerType.PUBLISHER_UNSPECIFIED,
      stateType: 'peerConnection',
      state: 'connecting',
    });
    reporter.onPeerConnectionStateChange(cid, {
      peerType: PeerType.PUBLISHER_UNSPECIFIED,
      stateType: 'peerConnection',
      state: 'connected',
    });
    await flush();

    const events = postedEvents().filter(
      (e) => e.stage === 'PeerConnectionConnect',
    );
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      event_type: 'initiated',
      peer_connection: 'publish',
      was_previously_connected: false,
      sfu_id: 'sfu-1',
      user_session_id: 'user-session-1',
    });
    expect(events[1]).toMatchObject({
      event_type: 'completed',
      outcome: 'success',
      peer_connection: 'publish',
    });
  });

  it('reports an ICE failure on the peer connection', async () => {
    reporter.startCorrelation(cid, 'first-attempt');
    reporter.onPeerConnectionStateChange(cid, {
      peerType: PeerType.SUBSCRIBER,
      stateType: 'peerConnection',
      state: 'connecting',
    });
    reporter.onPeerConnectionStateChange(cid, {
      peerType: PeerType.SUBSCRIBER,
      stateType: 'ice',
      state: 'failed',
    });
    await flush();

    const completed = postedEvents().filter(
      (e) =>
        e.stage === 'PeerConnectionConnect' && e.event_type === 'completed',
    );
    expect(completed).toHaveLength(1);
    expect(completed[0]).toMatchObject({
      outcome: 'failure',
      peer_connection: 'subscribe',
      retry_failure_code: 'ICE_CONNECTIVITY_FAILED',
      ice_state: 'FAILED',
    });
  });

  it('opens a fresh peer connection pair after a new correlation', async () => {
    reporter.startCorrelation(cid, 'first-attempt');
    reporter.onPeerConnectionStateChange(cid, {
      peerType: PeerType.PUBLISHER_UNSPECIFIED,
      stateType: 'peerConnection',
      state: 'connecting',
    });

    reporter.startCorrelation(cid, 'full-rejoin');
    reporter.onPeerConnectionStateChange(cid, {
      peerType: PeerType.PUBLISHER_UNSPECIFIED,
      stateType: 'peerConnection',
      state: 'connecting',
    });
    reporter.onPeerConnectionStateChange(cid, {
      peerType: PeerType.PUBLISHER_UNSPECIFIED,
      stateType: 'peerConnection',
      state: 'connected',
    });
    await flush();

    const pc = postedEvents().filter(
      (e) => e.stage === 'PeerConnectionConnect',
    );
    const initiated = pc.filter((e) => e.event_type === 'initiated');
    const completed = pc.filter((e) => e.event_type === 'completed');

    expect(initiated).toHaveLength(2);
    // the pair superseded by the new correlation closes with a failure,
    // the fresh pair closes with a success
    expect(completed).toHaveLength(2);
    expect(completed[0]).toMatchObject({
      outcome: 'failure',
      retry_failure_code: 'CLIENT_ABORTED',
      retry_failure_reason: 'superseded by a new join attempt',
    });
    expect(completed[0].stage_id).toBe(initiated[0].stage_id);
    expect(completed[1]).toMatchObject({ outcome: 'success' });
    expect(completed[1].stage_id).toBe(initiated[1].stage_id);
  });

  it('marks a peer connection as previously connected on reconnect', async () => {
    reporter.startCorrelation(cid, 'first-attempt');
    const connect = () => {
      reporter.onPeerConnectionStateChange(cid, {
        peerType: PeerType.PUBLISHER_UNSPECIFIED,
        stateType: 'peerConnection',
        state: 'connecting',
      });
      reporter.onPeerConnectionStateChange(cid, {
        peerType: PeerType.PUBLISHER_UNSPECIFIED,
        stateType: 'peerConnection',
        state: 'connected',
      });
    };
    connect();
    connect();
    await flush();

    const initiated = postedEvents().filter(
      (e) =>
        e.stage === 'PeerConnectionConnect' && e.event_type === 'initiated',
    );
    expect(initiated).toHaveLength(2);
    expect(initiated[0]).toMatchObject({ was_previously_connected: false });
    expect(initiated[1]).toMatchObject({ was_previously_connected: true });
  });

  it('keeps reporting state isolated between concurrent calls', async () => {
    const cid2 = 'default:call-2';
    reporter.registerCall(cid2, {
      callType: 'default',
      callId: 'call-2',
      getCallSessionId: () => 'session-2',
      getSfuId: () => 'sfu-2',
      getUserSessionId: () => 'user-session-2',
    });

    reporter.startCorrelation(cid, 'first-attempt');
    reporter.startCorrelation(cid2, 'first-attempt');
    await reporter.track(cid, 'WSJoin', () => Promise.resolve('ok'));
    await reporter.track(cid2, 'WSJoin', () => Promise.resolve('ok'));
    await flush();

    const ws1 = postedEvents().filter(
      (e) => e.stage === 'WSJoin' && e.call_cid === cid,
    );
    const ws2 = postedEvents().filter(
      (e) => e.stage === 'WSJoin' && e.call_cid === cid2,
    );
    expect(ws1).toHaveLength(2);
    expect(ws2).toHaveLength(2);
    expect(ws1.every((e) => e.sfu_id === 'sfu-1')).toBe(true);
    expect(ws2.every((e) => e.sfu_id === 'sfu-2')).toBe(true);
  });
});

describe('ClientEventReporter (disabled)', () => {
  const cid = 'default:call-1';
  let doAxiosRequest: ReturnType<typeof vi.fn>;
  let reporter: ClientEventReporter;

  beforeEach(() => {
    doAxiosRequest = vi.fn().mockResolvedValue({});
    const streamClient = fromPartial<StreamClient>({
      userID: 'user-1',
      doAxiosRequest,
      getUserAgent: () => 'test-agent',
      getSdkVersion: () => '1.0.0',
    });
    reporter = new ClientEventReporter({ streamClient, enabled: false });
    reporter.startCoordinatorConnection('user-1');
    reporter.registerCall(cid, {
      callType: 'default',
      callId: 'call-1',
      getCallSessionId: () => 'session-1',
      getSfuId: () => 'sfu-1',
      getUserSessionId: () => 'user-session-1',
    });
  });

  it('does not post any events when disabled', async () => {
    reporter.startCorrelation(cid, 'first-attempt');
    await reporter.track(cid, 'CoordinatorJoin', () => Promise.resolve('ok'));
    await flush();

    expect(doAxiosRequest).not.toHaveBeenCalled();
  });
});
