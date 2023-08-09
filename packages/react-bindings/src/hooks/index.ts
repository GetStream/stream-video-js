import * as CallStateHooks from './callStateHooks';

export * from './permissions';
export * from './store';
// export * from './callStateHooks';

/**
 * A hook-alike function that exposes all call state hooks.
 *
 * @category Call State
 */
export const useCallStateHooks = () => CallStateHooks;
