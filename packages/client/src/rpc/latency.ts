const toSeconds = (ms: number) => ms / 1000;

/**
 * Measures the latency of the current client to the given endpoint.
 * Uses HTML Image tag in order to avoid CORS issues.
 *
 * @param endpoint the endpoint.
 * @param rounds the number of measuring rounds to perform.
 * @param timeoutAfterMs the request cancellation period.
 */
export const measureResourceLoadLatencyTo = async (
  endpoint: string,
  rounds: number,
  timeoutAfterMs: number = 3000,
) => {
  const measurements: number[] = [];
  await Promise.all(
    Array(rounds)
      .fill(undefined)
      .map(async () => {
        const start = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutAfterMs);
        try {
          const src = new URL(endpoint);
          src.searchParams.set('rand', `react_${Math.random() * 10000000}`);
          await fetch(src.toString(), {
            signal: controller.signal,
          }).then((response) => response.blob());
        } catch (e) {
          console.log(`failed to measure latency to ${endpoint}`, e);
        }
        clearTimeout(timeoutId); // clear timeout incase fetch completes before timeout
        const latency = Date.now() - start;
        measurements.push(toSeconds(latency));
      }),
  );
  return measurements;
};
