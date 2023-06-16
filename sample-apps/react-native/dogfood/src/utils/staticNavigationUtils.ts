import { createNavigationContainerRef } from '@react-navigation/native';

import { RootStackParamList } from '../../types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export class StaticNavigationService {
  static authenticationInfo:
    | { username: string; userImageUrl: string }
    | undefined = undefined;

  /**
   * Navigate to a route in the Root StackNavigator
   */
  static navigate<RouteName extends keyof RootStackParamList>(
    name: RouteName,
    params: RootStackParamList[RouteName] | undefined = undefined,
  ) {
    if (navigationRef.isReady()) {
      // @ts-ignore
      navigationRef.navigate(name, params);
    }
  }
  static goBack() {
    if (navigationRef.isReady()) {
      navigationRef.goBack();
    }
  }
}

/**
 * Run the navigation logic with StaticNavigationService
 * This is used to run the navigation logic from root level even before the navigation is ready
 * @param callback The navigation callback that calls the methods of StaticNavigationService
 */
export const RunStaticNavigation = (callback: () => void) => {
  const intervalId = setInterval(async () => {
    // run only when the navigation is ready and the user is authenticated
    if (navigationRef.isReady() && StaticNavigationService.authenticationInfo) {
      clearInterval(intervalId);
      callback();
    }
  }, 300);
};
