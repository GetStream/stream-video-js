import * as CallStateHooks from './callStateHooks';

export * from './store';

/**
 * A hook-alike function that exposes all call state hooks.
 *
 * @category Call State
 */
export const useCallStateHooks = () => CallStateHooks;
