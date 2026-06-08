import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import { of } from 'rxjs';
import { ClientEventReporter, CallReportContext } from '../ClientEventReporter';
import type { StreamClient } from '../../coordinator/connection/client';
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
    connectId = reporter.mintCoordinatorConnectId();

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
      retry_failure_code: 'NETWORK_ERROR',
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
});
