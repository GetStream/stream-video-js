const toSeconds = (ms: number) => ms / 1000;

/**
 * Measures the latency of the current client to the given endpoint.
 * Uses the native Fetch API underneath.
 *
 * @param endpoint the endpoint.
 * @param rounds the number of measuring rounds to perform.
 */
export const measureLatencyTo = async (endpoint: string, rounds: number) => {
  const measurements: number[] = [];
  for (let run = 0; run < rounds; run++) {
    try {
      const start = performance.now();

      // TODO OL: think about cancelling the request in case it takes too long
      await fetch(endpoint).then((response) => response.blob());

      // TODO OL: maybe we could utilize Performance API further and
      // possibly strip down certain elements from the measurement
      // like domain name lookup, etc...
      const latency = performance.now() - start;
      measurements.push(toSeconds(latency));
    } catch (e) {
      console.warn(`failed to measure latency to ${endpoint}`, e);
    }
  }

  return measurements;
};

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
  for (let run = 0; run < rounds; run++) {
    const measure = new Promise<number>((resolve, reject) => {
      const start = performance.now();
      const img = new Image();
      img.onload = () => {
        resolve(performance.now() - start);
      };
      img.onerror = reject;
      img.onabort = reject;

      const src = new URL(endpoint);
      src.searchParams.set('rand', `react_${Math.random() * 10000000}`);
      img.src = src.toString();
    });

    try {
      const durationInMs = await measure;
      measurements.push(toSeconds(durationInMs));
    } catch (e) {
      console.warn(`failed to measure latency to ${endpoint}`, e);
    }
  }

  return measurements;
};
