import { GetCallEdgeServerRequest } from '@stream-io/video-react-sdk';

const toSeconds = (ms: number) => ms / 1000;

/**
 * Measures the latency of the current client to the given endpoint.
 *
 * @param endpoint the endpoint.
 * @param timeoutAfterMs the request cancellation period.
 */
export const measureResourceLoadLatencyTo = async (
  endpoint: string,
  timeoutAfterMs: number = 1000,
  convertToSeconds: boolean = false,
) => {
  if (endpoint && endpoint.length) {
    const start = Date.now();
    const controller = new AbortController();
    const abortTimeout = setTimeout(() => {
      controller.abort();
    }, timeoutAfterMs);

    try {
      const src = new URL(endpoint);
      src.searchParams.set('r', `js_${Math.random() * 10000000}`);
      await fetch(src.toString(), {
        signal: controller.signal,
      });
      const latency = Date.now() - start;
      if (convertToSeconds) {
        return toSeconds(latency);
      }
      return latency;
    } catch (e) {
      console.debug(`failed to measure latency to ${endpoint}`, e);
      return -1; // indicate error in measurement
    } finally {
      // clear timeout in case fetch completes before timeout
      clearTimeout(abortTimeout);
    }
  }
};

/**
 * Measures the latency of the current client to the given edges.
 *
 * All measurements run in parallel,
 * and the whole process is limited by the given timeout.
 *
 * @param edges the edges to measure latency to.
 * @param attempts the number of attempts to measure latency.
 * @param attemptTimeoutAfterMs the request cancellation period per measurement.
 * @param measureTimeoutAfterMs the hard-limit for the whole measure process.
 */
export const measureLatencyToEdges = async (
  edges: any[],
  {
    attempts = 3,
    attemptTimeoutAfterMs = 1000,
    measureTimeoutAfterMs = 1200,
  }: {
    attempts?: number;
    attemptTimeoutAfterMs?: number;
    measureTimeoutAfterMs?: number;
  } = {},
) => {
  const latencyByEdge: GetCallEdgeServerRequest['latency_measurements'] = {};
  const measurements: Promise<void>[] = [];
  const start = Date.now();
  for (let attempt = 0; attempt < attempts; attempt++) {
    for (const edge of edges) {
      measurements.push(
        measureResourceLoadLatencyTo(
          edge.latency_test_url,
          attemptTimeoutAfterMs,
        ).then((latency) => {
          if (latency && latency > 0) {
            (latencyByEdge[edge.id] ??= []).push(latency);
          }
        }),
      );
    }
  }

  await Promise.race([
    Promise.all(measurements),
    new Promise((resolve) => setTimeout(resolve, measureTimeoutAfterMs)),
  ]);

  console.log(
    `finished measuring latency to ${edges.length} edges in ${
      Date.now() - start
    }ms.`,
  );

  return latencyByEdge;
};
