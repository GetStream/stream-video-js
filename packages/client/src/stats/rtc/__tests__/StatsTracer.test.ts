import '../../../rtc/__tests__/mocks/webrtc.mocks';
import { describe, expect, it } from 'vitest';
import { StatsTracer, deltaCompression } from '../StatsTracer';

import {
  currentPublisherStats,
  expectedPublisherDelta,
  expectedPublisherMetrics,
  previousPublisherStats,
} from './publisherStats.stub';

import {
  currentSubscriberStats,
  expectedSubscriberDelta,
  expectedSubscriberMetrics,
  previousSubscriberStats,
} from './subscriberStats.stub';

describe('StatsTracer', () => {
  const statsTracer = new StatsTracer(new RTCPeerConnection(), new Map());

  it('should calculate the publisher metrics', () => {
    const metrics = statsTracer.getPublisherMetrics(
      currentPublisherStats as Record<string, RTCStats>,
      previousPublisherStats as Record<string, RTCStats>,
    );
    expect(metrics).toBeDefined();
    expect(metrics).toEqual(expectedPublisherMetrics);
  });

  it('should calculate the subscriber metrics', () => {
    const metrics = statsTracer.getSubscriberMetrics(
      currentSubscriberStats as Record<string, RTCStats>,
      previousSubscriberStats as Record<string, RTCStats>,
    );
    expect(metrics).toBeDefined();
    expect(metrics).toEqual(expectedSubscriberMetrics);
  });

  it('should calculate delta between two publisher stats', () => {
    const delta = deltaCompression(
      previousPublisherStats,
      currentPublisherStats,
    );
    expect(delta).toBeDefined();
    expect(delta).toEqual(expectedPublisherDelta);
  });

  it('should calculate delta between two subscriber stats', () => {
    const delta = deltaCompression(
      previousSubscriberStats,
      currentSubscriberStats,
    );
    expect(delta).toBeDefined();
    expect(delta).toEqual(expectedSubscriberDelta);
  });
});
