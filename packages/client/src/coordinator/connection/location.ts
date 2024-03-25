import { getLogger } from '../../logger';

const logger = getLogger(['location']);
const HINT_URL = `https://hint.stream-io-video.com/`;

export const getLocationHint = async (
  hintUrl: string = HINT_URL,
  timeout: number = 2000,
) => {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), timeout);
  try {
    const response = await fetch(hintUrl, {
      method: 'HEAD',
      signal: abortController.signal,
    });
    const awsPop = response.headers.get('x-amz-cf-pop') || 'ERR';
    logger('debug', `Location header: ${awsPop}`);
    return awsPop.substring(0, 3); // AMS1-P2 -> AMS
  } catch (e) {
    logger('warn', `Failed to get location hint from ${hintUrl}`, e);
    return 'ERR';
  } finally {
    clearTimeout(timeoutId);
  }
};
