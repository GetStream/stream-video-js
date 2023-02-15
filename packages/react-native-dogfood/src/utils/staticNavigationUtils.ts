import {
  StackActions,
  createNavigationContainerRef,
} from '@react-navigation/native';

import { RootStackParamList } from '../../types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const StaticNavigationService = {
  navigate(name: string, params: Object | undefined = undefined) {
    if (navigationRef.isReady()) {
      const currentRoute = navigationRef.getCurrentRoute();
      if (currentRoute?.name === name) {
        navigationRef.dispatch(StackActions.replace(name, params));
      } else {
        // @ts-ignore
        navigationRef.navigate(name, params);
      }
    }
  },
  goBack() {
    if (navigationRef.isReady()) {
      navigationRef.goBack();
    }
  },
};

export function staticNavigate<
  RouteName extends keyof RootStackParamList,
  Params extends RootStackParamList[RouteName],
>(name: RouteName, params: Params) {
  if (navigationRef.isReady()) {
    const currentRoute = navigationRef.getCurrentRoute();
    if (currentRoute?.name === name) {
      navigationRef.dispatch(StackActions.replace(name, params));
    } else {
      // @ts-ignore can't figure out how to type this
      navigationRef.navigate(name, params);
    }
  }
}

export function staticGoBack() {
  if (navigationRef.isReady()) {
    navigationRef.goBack();
  }
}

export const RunStaticNavigation = (callback: () => void) => {
  const intervalId = setInterval(async () => {
    // TODO: check if user is authenticated
    if (navigationRef.isReady()) {
      clearInterval(intervalId);
      callback();
    }
  }, 300);
};
