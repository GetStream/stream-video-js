import { describe, expect, it } from 'vitest';

import {
  createRtcStatsProcessor,
  getParticipantDiagnosticsKey,
  LiveCallStatsMessage,
} from './rtcStats';

const statsMessage = (
  userSessionId: string,
  records: unknown[],
): LiveCallStatsMessage => ({
  type: 'stats',
  sfu_id: 'sfu-1',
  user_id: 'user-1',
  user_session_id: userSessionId,
  payload: records.map((record) => JSON.stringify(record)).join('\n'),
  timestamp: 1_000,
});

describe('createRtcStatsProcessor', () => {
  it('reconstructs delta-compressed reports and calculates participant metrics', () => {
    const processor = createRtcStatsProcessor();
    processor.process(
      statsMessage('session-1', [
        [
          'getstats',
          '1-pub',
          {
            timestamp: 1_000,
            outbound: {
              type: 'outbound-rtp',
              kind: 'video',
              bytesSent: 1_000,
              frameWidth: 1280,
              frameHeight: 720,
              framesPerSecond: 30,
              codecId: 'codec',
              qualityLimitationReason: 'bandwidth',
            },
            remoteInbound: {
              type: 'remote-inbound-rtp',
              packetsLost: 2,
              packetsReceived: 98,
              jitter: 0.01,
              roundTripTime: 0.12,
            },
            codec: { type: 'codec', mimeType: 'video/VP8' },
          },
          1_000,
        ],
        ['connectionstatechange', '1-pub', 'connected', 1_000],
      ]),
    );

    const report = processor.process(
      statsMessage('session-1', [
        [
          'getstats',
          '1-pub',
          {
            timestamp: 2_000,
            outbound: { bytesSent: 3_000, timestamp: 0 },
          },
          2_000,
        ],
      ]),
    );

    expect(report).toMatchObject({
      userId: 'user-1',
      userSessionId: 'session-1',
      sfuId: 'sfu-1',
      connectionState: 'connected',
      roundTripTimeMs: 120,
      publishBitrate: 16_000,
      publishPacketLossPercent: 2,
      publishJitterMs: 10,
      publishResolution: '1280×720',
      publishFps: 30,
      videoCodec: 'VP8',
      qualityLimitationReason: 'bandwidth',
    });
  });

  it('keeps separate state for two sessions belonging to the same user', () => {
    const processor = createRtcStatsProcessor();
    const first = processor.process(
      statsMessage('session-1', [
        ['connectionstatechange', '1-pub', 'connected', 1_000],
      ]),
    );
    const second = processor.process(
      statsMessage('session-2', [
        ['connectionstatechange', '2-pub', 'failed', 2_000],
      ]),
    );

    expect(first?.userSessionId).toBe('session-1');
    expect(first?.connectionState).toBe('connected');
    expect(second?.userSessionId).toBe('session-2');
    expect(second?.connectionState).toBe('failed');
    expect(getParticipantDiagnosticsKey('user-1', 'session-1')).not.toBe(
      getParticipantDiagnosticsKey('user-1', 'session-2'),
    );
  });

  it('ignores a duplicated telemetry record', () => {
    const processor = createRtcStatsProcessor();
    const message = statsMessage('session-1', [
      ['connectionstatechange', '1-pub', 'connected', 1_000],
    ]);

    const first = processor.process(message);
    const duplicate = processor.process(message);

    expect(duplicate).toEqual(first);
  });
});
