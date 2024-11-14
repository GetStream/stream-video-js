import { User } from '@stream-io/video-react-native-sdk';
import { router } from 'expo-router';

export class StaticNavigationService {
  static authenticationInfo: User | undefined = undefined;
}

export const staticNavigateToNonRingingCall = () => {
  const intervalId = setInterval(async () => {
    // run only when the navigation is ready and the user is authenticated
    if (StaticNavigationService.authenticationInfo) {
      clearInterval(intervalId);
      router.push('/meeting');
    }
  }, 300);
};
