import * as CallStateHooks from './callStateHooks';
export * from './useEffectEvent';
export * from './useObservableValue';

export * from './store';
export * from './callUtilHooks';

export type { UseInputMediaDeviceOptions } from './callStateHooks';

/**
 * A hook-alike function that exposes all call state hooks.
 */
export const useCallStateHooks = () => CallStateHooks;
