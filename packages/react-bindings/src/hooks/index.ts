import * as CallStateHooks from './callStateHooks';
export * from './useEffectEvent';
export * from './useObservableValue';

export * from './store';
export * from './callUtilHooks';
export * from './callStateHooks';

/**
 * A hook-alike function that exposes all call state hooks.
 *
 * All of these hooks are also exported directly, e.g.:
 * `import { useParticipants } from '@stream-io/video-react-sdk'`.
 *
 * For React Compiler compatibility, use the direct imports.
 * The compiler can't verify that a hook read off the returned object is
 * the same function on every render, and skips optimizing the components
 * and hooks that use it.
 */
export const useCallStateHooks = () => CallStateHooks;
