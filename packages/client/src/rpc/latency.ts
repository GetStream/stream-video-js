const toSeconds = (ms: number) => ms / 1000;

/**
 * Measures the latency of the current client to the given endpoint.
 * Uses HTML Image tag in order to avoid CORS issues.
 *
 * @param endpoint the endpoint.
 * @param rounds the number of measuring rounds to perform.
 */
export const measureResourceLoadLatencyTo = async (
  endpoint: string,
  rounds: number,
) => {
  const measurements: number[] = [];
  await Promise.all(
    Array(rounds)
      .fill(undefined)
      .map(async () => {
        const start = Date.now();
        const src = new URL(endpoint);
        src.searchParams.set('rand', `react_${Math.random() * 10000000}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout:
        try {
          await fetch(src.toString(), { signal: controller.signal });
        } catch (e) {
          console.warn(`failed to measure latency to ${src}`, e);
        }
        clearTimeout(timeoutId); // clear timeout incase fetch completes before timeout
        const latency = Date.now() - start;
        measurements.push(toSeconds(latency));
      }),
  );
  return measurements;
};
