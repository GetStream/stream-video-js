import { videoLoggerSystem } from '../../logger';

export const getLocationHint = async (
  hintUrl = `https://hint.stream-io-video.com/`,
  timeout = 2000,
  maxAttempts = 3,
): Promise<string> => {
  const logger = videoLoggerSystem.getLogger('location-hint');

  let attempt = 0;
  let locationHint = 'ERR';
  do {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), timeout);
    try {
      const response = await fetch(hintUrl, {
        method: 'HEAD',
        signal: abortController.signal,
      });
      const awsPop = response.headers.get('x-amz-cf-pop') || 'ERR';
      logger.debug(`Location header: ${awsPop}`);
      locationHint = awsPop.substring(0, 3); // AMS1-P2 -> AMS
    } catch (e) {
      logger.warn(`Failed to get location hint from ${hintUrl}`, e);
      locationHint = 'ERR';
    } finally {
      clearTimeout(timeoutId);
    }
  } while (locationHint === 'ERR' && ++attempt < maxAttempts);

  return locationHint;
};
