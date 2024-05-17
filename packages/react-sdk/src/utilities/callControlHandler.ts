import { getLogger } from '@stream-io/video-client';

export type PropsWithErrorHandler<T = unknown> = T & {
  /**
   * Will be called if the call control action failed with an error (e.g. user didn't grant a
   * browser permission to enable a media device). If no callback is provided, just logs the error.
   * @param error Exception which caused call control action to fail
   */
  onError?: (error: unknown) => void;
};

/**
 * Wraps an event handler, silencing and logging exceptions (excluding the NotAllowedError
 * DOMException, which is a normal situation handled by the SDK)
 *
 * @param props component props, including the onError callback
 * @param handler event handler to wrap
 */
export const createCallControlHandler = (
  props: PropsWithErrorHandler,
  handler: () => Promise<void>,
): (() => Promise<void>) => {
  const logger = getLogger(['react-sdk']);

  return async () => {
    try {
      await handler();
    } catch (error) {
      if (props.onError) {
        props.onError(error);
        return;
      }

      if (!isNotAllowedError(error)) {
        logger('error', 'Call control handler failed', error);
      }
    }
  };
};

function isNotAllowedError(error: unknown): error is DOMException {
  return error instanceof DOMException && error.name === 'NotAllowedError';
}
