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
  const src = new URL(endpoint);
  src.searchParams.set('rand', `react_${Math.random() * 10000000}`);

  await Promise.all(
    Array(rounds)
      .fill(undefined)
      .map(async () => {
        const start = Date.now();
        try {
          await fetch(src.toString()).then((response) => response.blob());
        } catch (e) {
          console.warn(`failed to measure latency to ${endpoint}`, e);
        }
        const latency = Date.now() - start;
        measurements.push(toSeconds(latency));
      }),
  );
  return measurements;
};
