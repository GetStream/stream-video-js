import { describe, expect, it } from 'vitest';

import {
  createRtcStatsProcessor,
  getParticipantDiagnosticsKey,
  getPlaybackAudioForPublisher,
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

  it('maps inbound audio to its publisher and calculates receiver audio deltas', () => {
    const processor = createRtcStatsProcessor();
    processor.process(
      statsMessage('receiver-session', [
        [
          'getstats',
          '1-sub',
          {
            timestamp: 1_000,
            audio: {
              type: 'inbound-rtp',
              kind: 'audio',
              ssrc: 111,
              bytesReceived: 1_000,
              packetsReceived: 100,
              packetsLost: 1,
              jitter: 0.01,
              audioLevel: 0.2,
              totalAudioEnergy: 1,
              concealedSamples: 0,
              concealmentEvents: 0,
              jitterBufferDelay: 1,
              jitterBufferEmittedCount: 100,
            },
          },
          1_000,
        ],
        [
          'sfu.track.mapping',
          null,
          {
            direction: 'inbound',
            ssrc: 111,
            track_type: 'TRACK_TYPE_AUDIO',
            participant: {
              user_id: 'publisher-user',
              session_id: 'publisher-session',
              unified_session_id: 'publisher-unified',
            },
          },
          1_001,
        ],
      ]),
    );

    const report = processor.process(
      statsMessage('receiver-session', [
        [
          'getstats',
          '1-sub',
          {
            timestamp: 2_000,
            audio: {
              bytesReceived: 1_800,
              packetsReceived: 110,
              packetsLost: 3,
              jitter: 0.02,
              audioLevel: 0.25,
              totalAudioEnergy: 1.5,
              concealedSamples: 480,
              concealmentEvents: 1,
              jitterBufferDelay: 1.1,
              jitterBufferEmittedCount: 110,
              timestamp: 0,
            },
          },
          2_000,
        ],
      ]),
    );

    const audio =
      report?.inboundAudioByPublisher[
        getParticipantDiagnosticsKey('publisher-user', 'publisher-unified')
      ];
    expect(audio).toMatchObject({
      publisherUserId: 'publisher-user',
      publisherSessionId: 'publisher-session',
      publisherUnifiedSessionId: 'publisher-unified',
      ssrc: 111,
      bitrate: 6_400,
      packetsPerSecond: 10,
      jitterMs: 20,
      audioLevel: 0.25,
      audioEnergyDelta: 0.5,
      concealedSamplesDelta: 480,
      concealmentEventsDelta: 1,
    });
    expect(audio?.packetLossPercent).toBeCloseTo(16.67, 1);
    expect(audio?.jitterBufferDelayMs).toBeCloseTo(10);
  });

  it('calculates publisher audio flow and preserves audio events', () => {
    const processor = createRtcStatsProcessor();
    processor.process(
      statsMessage('publisher-session', [
        [
          'getstats',
          '1-pub',
          {
            timestamp: 1_000,
            audio: {
              type: 'outbound-rtp',
              kind: 'audio',
              bytesSent: 1_000,
              packetsSent: 50,
              mediaSourceId: 'mic-source',
            },
            'mic-source': {
              type: 'media-source',
              kind: 'audio',
              audioLevel: 0.4,
              totalAudioEnergy: 1,
            },
          },
          1_000,
        ],
      ]),
    );

    const report = processor.process(
      statsMessage('publisher-session', [
        [
          'getstats',
          '1-pub',
          {
            timestamp: 2_000,
            audio: { bytesSent: 2_000, packetsSent: 70, timestamp: 0 },
            'mic-source': {
              audioLevel: 0.3,
              totalAudioEnergy: 1.5,
              timestamp: 0,
            },
          },
          2_000,
        ],
        ['noiseCancellation.audioContextState', null, 'interrupted', 2_001],
        ['navigator.mediaDevices.setSinkId', null, 'airpods-device', 2_002],
        [
          'mic.capture_report',
          null,
          {
            capturesAudio: false,
            deviceId: 'airpods-mic',
            label: 'AirPods Pro Microphone',
          },
          2_003,
        ],
      ]),
    );

    expect(report).toMatchObject({
      publishAudioBitrate: 8_000,
      publishAudioPacketsPerSecond: 20,
      publishAudioLevel: 0.3,
      publishAudioEnergyDelta: 0.5,
      micCapturesAudio: false,
      microphoneDeviceId: 'airpods-mic',
      microphoneLabel: 'AirPods Pro Microphone',
      krispAudioContextState: 'interrupted',
      outputDeviceId: 'airpods-device',
    });
    expect(report?.audioEvents.map(({ type }) => type)).toEqual([
      'audio-context',
      'output-device',
      'microphone-capture',
    ]);
  });

  it('parses receiver playback signal, sample rates and capture lifecycle', () => {
    const processor = createRtcStatsProcessor();
    const report = processor.process(
      statsMessage('receiver-session', [
        [
          'audioPlayback.report',
          null,
          {
            sessionId: 'publisher-session',
            route: 'audio-context',
            track: {
              id: 'remote-track',
              sampleRate: 48_000,
              channelCount: 1,
            },
            context: {
              state: 'running',
              sampleRate: 44_100,
              currentTime: 12.5,
            },
            element: { paused: true, readyState: 0 },
            signal: {
              averageLevel: 0.08,
              peakLevel: 0.2,
              silentRatio: 0.25,
              longestSilenceMs: 500,
            },
          },
          2_000,
        ],
        [
          'media.capture.lifecycle',
          null,
          {
            state: 'acquired',
            trackType: 'AUDIO',
            tracks: [
              {
                label: 'AirPods microphone',
                deviceId: 'airpods-input',
                sampleRate: 24_000,
              },
            ],
          },
          2_001,
        ],
        [
          'noiseCancellation.audioContextState',
          null,
          { state: 'running', sampleRate: 48_000 },
          2_002,
        ],
      ]),
    );

    expect(
      getPlaybackAudioForPublisher(
        report,
        'publisher-user',
        'publisher-session',
      ),
    ).toMatchObject({
      publisherSessionId: 'publisher-session',
      route: 'audio-context',
      trackSampleRate: 48_000,
      contextSampleRate: 44_100,
      contextState: 'running',
      averageLevel: 0.08,
      peakLevel: 0.2,
      silentRatio: 0.25,
      longestSilenceMs: 500,
    });
    expect(report).toMatchObject({
      microphoneDeviceId: 'airpods-input',
      microphoneLabel: 'AirPods microphone',
      microphoneSampleRate: 24_000,
      krispAudioContextState: 'running',
      krispAudioContextSampleRate: 48_000,
      playbackAudioContextState: 'running',
      playbackAudioContextSampleRate: 44_100,
      bluetoothProfile: {
        state: 'call-audio',
        confidence: 0.9,
        deviceLabel: 'AirPods microphone',
      },
    });
    expect(report?.audioEvents.map(({ type }) => type)).toEqual([
      'bluetooth-profile',
      'capture-lifecycle',
      'audio-context',
    ]);

    const afterRelease = processor.process(
      statsMessage('receiver-session', [
        [
          'media.capture.lifecycle',
          null,
          {
            state: 'stopped',
            trackType: 'AUDIO',
            tracks: [
              {
                label: 'AirPods microphone',
                deviceId: 'airpods-input',
                sampleRate: 24_000,
                channelCount: 1,
              },
            ],
          },
          3_000,
        ],
      ]),
    );
    expect(afterRelease?.bluetoothProfile).toMatchObject({
      state: 'transitioning',
      confidence: 0.5,
      deviceLabel: 'AirPods microphone',
    });
    expect(afterRelease?.audioEvents.map(({ type }) => type)).toEqual([
      'bluetooth-profile',
      'capture-lifecycle',
    ]);

    const lowLatencyContext = processor.process(
      statsMessage('receiver-session', [
        [
          'audioContext.state',
          null,
          { state: 'running', sampleRate: 48_000, outputLatency: 0.01 },
          4_000,
        ],
      ]),
    );
    expect(lowLatencyContext?.bluetoothProfile?.state).toBe('transitioning');

    const afterOutputRecovery = processor.process(
      statsMessage('receiver-session', [
        [
          'audioContext.state',
          null,
          { state: 'running', sampleRate: 48_000, outputLatency: 0.2 },
          5_000,
        ],
      ]),
    );
    expect(afterOutputRecovery?.bluetoothProfile).toMatchObject({
      state: 'media-playback',
      confidence: 0.85,
      deviceLabel: 'AirPods microphone',
    });
    expect(afterOutputRecovery?.audioEvents.map(({ type }) => type)).toEqual([
      'bluetooth-profile',
      'audio-context',
    ]);
  });

  it('does not classify a mono built-in microphone as Bluetooth', () => {
    const processor = createRtcStatsProcessor();
    const report = processor.process(
      statsMessage('receiver-session', [
        [
          'media.capture.lifecycle',
          null,
          {
            state: 'acquired',
            trackType: 'AUDIO',
            tracks: [
              {
                label: 'MacBook Pro Microphone',
                sampleRate: 48_000,
                channelCount: 1,
              },
            ],
          },
          2_000,
        ],
      ]),
    );

    expect(report?.bluetoothProfile).toBeUndefined();
    expect(report?.audioEvents.map(({ type }) => type)).toEqual([
      'capture-lifecycle',
    ]);
  });

  it('classifies the observed Sony headset model at its 16 kHz call rate', () => {
    const processor = createRtcStatsProcessor();
    const report = processor.process(
      statsMessage('receiver-session', [
        [
          'media.capture.lifecycle',
          null,
          {
            state: 'acquired',
            trackType: 'AUDIO',
            tracks: [{ label: 'WH-1000XM5', sampleRate: 16_000 }],
          },
          2_000,
        ],
      ]),
    );

    expect(report?.bluetoothProfile).toMatchObject({
      state: 'call-audio',
      confidence: 0.9,
      deviceLabel: 'WH-1000XM5',
    });
  });
});
