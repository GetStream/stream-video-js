import { getLogger } from '../../logger';

const logger = getLogger(['location']);
const hintURL = `https://hint.stream-io-video.com/`;

export const getLocationHint = async (timeout: number = 1500) => {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), timeout);
  try {
    const response = await fetch(hintURL, {
      method: 'HEAD',
      signal: abortController.signal,
    });
    const awsPop = response.headers.get('x-amz-cf-pop') || 'ERR';
    logger('debug', `Location header: ${awsPop}`);
    return awsPop.substring(0, 3); // AMS1-P2 -> AMS
  } catch (e) {
    logger('error', `Failed to get location hint from ${hintURL}`, e);
    return 'ERR';
  } finally {
    clearTimeout(timeoutId);
  }
};
