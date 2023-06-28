import { createNavigationContainerRef } from '@react-navigation/native';

import { RootStackParamList } from '../../types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export class StaticNavigationService {
  static authenticationInfo:
    | { userId: string; userImageUrl: string }
    | undefined = undefined;
}

/**
 * This is used to run the navigation logic from root level even before the navigation is ready
 */
export const staticNavigate = (
  ...navigationArgs: Parameters<typeof navigationRef.navigate>
) => {
  const intervalId = setInterval(async () => {
    // run only when the navigation is ready and the user is authenticated
    if (navigationRef.isReady() && StaticNavigationService.authenticationInfo) {
      clearInterval(intervalId);
      navigationRef.navigate(...navigationArgs);
    }
  }, 300);
};
