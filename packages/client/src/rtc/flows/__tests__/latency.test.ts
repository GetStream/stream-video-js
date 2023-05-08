import { describe, it } from 'vitest';
import { measureLatencyToEdges } from '../latency';
import { DatacenterResponse } from '../../../gen/coordinator';

describe('Latency', () => {
  const edges: DatacenterResponse[] = [
    {
      name: 'eqx-nyc1',
      latency_url:
        'https://sfu-9f0306f.eqx-nyc1.stream-io-video.com/latency_test.png',
      coordinates: {
        latitude: 40.712778,
        longitude: -74.006111,
      },
    },
    {
      name: 'blu-tal1',
      latency_url:
        'https://sfu-a69b58a.blu-tal1.stream-io-video.com/latency_test.png',
      coordinates: {
        latitude: 59.43696,
        longitude: 24.75353,
      },
    },
    {
      name: 'ovh-lon1',
      latency_url:
        'https://sfu-9c050b4.ovh-lon1.stream-io-video.com/latency_test.png',
      coordinates: {
        latitude: 51.507359,
        longitude: -0.136439,
      },
    },
  ];

  // for integration purposes, disabled on CI
  it.skip('measure latency', async () => {
    const start = performance.now();
    const latencyByEdge = await measureLatencyToEdges(edges, {
      attempts: 3,
      attemptTimeoutAfterMs: 750,
      measureTimeoutAfterMs: 1000,
    });
    console.log('total time in ms:', performance.now() - start, latencyByEdge);
  });
});
