const toSeconds = (ms: number) => ms / 1000;
import {Image} from 'react-native';

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
      const start = Date.now();

      // TODO: think about cancelling the request in case it takes too long
      await fetch(endpoint).then(response => response.blob());

      // TODO: maybe we could utilize Performance API further and
      // possibly strip down certain elements from the measurement
      // like domain name lookup, etc...
      const latency = Date.now() - start;
      measurements.push(toSeconds(latency));
    } catch (e) {
      console.warn(`failed to measure latency to ${endpoint}`, e);
    }
  }

  return measurements;
};

/**
 * Measures the latency of the current client to fetch a resource with the given endpoint.
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
    const src = new URL(endpoint);
    try {
      src.searchParams.set('rand', `react_${Math.random() * 10000000}`);
      const start = Date.now();
      Image.getSize(
        src.toString(),
        () => {
          const latency = Date.now() - start;
          measurements.push(toSeconds(latency));
        },
        error => {
          console.warn(`failed to measure latency to ${endpoint}`, error);
        },
      );
    } catch (e) {
      console.warn(`failed to measure latency to ${endpoint}`, e);
    }
  }

  return measurements;
};
