import {
  type AppVisibilitySource,
  RxUtils,
  videoLoggerSystem,
} from '@stream-io/video-client';
import { AppState } from 'react-native';
import NativeStreamVideoAppLifecycle from '../../native/NativeStreamVideoAppLifecycle';
import { isInPiPMode$ } from './rxSubjects';

/**
 * Reads the app state. On Android, the native module reports the state of
 * the application process rather than of the activity; without it, the
 * React Native `AppState` is used.
 */
const getAppState = (): string | null | undefined => {
  if (NativeStreamVideoAppLifecycle) {
    try {
      return NativeStreamVideoAppLifecycle.getCurrentAppState();
    } catch (e) {
      videoLoggerSystem
        .getLogger('appVisibility')
        .warn('Failed to get current app state from native module', e);
    }
  }
  return AppState.currentState;
};

/**
 * The app is hidden while in the background and not in picture-in-picture.
 * `inactive` (iOS Control Center, system prompts) counts as visible.
 */
export const appVisibility: AppVisibilitySource = {
  getVisibility: () => ({
    hidden:
      getAppState() === 'background' && !RxUtils.getCurrentValue(isInPiPMode$),
  }),
  watch: (onChange) => {
    const appStateSubscription = NativeStreamVideoAppLifecycle
      ? NativeStreamVideoAppLifecycle.onAppStateChanged(onChange)
      : AppState.addEventListener('change', onChange);
    const pipSubscription = isInPiPMode$.subscribe(onChange);
    return () => {
      appStateSubscription.remove();
      pipSubscription.unsubscribe();
    };
  },
};
