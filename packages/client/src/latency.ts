const toSeconds = (ms: number) => ms / 1000;

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
