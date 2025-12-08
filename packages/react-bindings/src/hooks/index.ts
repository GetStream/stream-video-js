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

/**
 * Returns the same collection of call-state hooks as `useCallStateHooks`,
 * but without the “use” prefix. This avoids the React Compiler incorrectly
 * identifying it as a hook when used outside component render functions.
 */
export const getCallStateHooks = () => CallStateHooks;
