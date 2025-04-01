import { Text } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useAuthentication } from '../../contexts/authentication-provider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function AppLayout() {
  const { userWithToken, isLoading } = useAuthentication();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!userWithToken) {
    return <Redirect href="/login" />;
  }

  return (
    <GestureHandlerRootView>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
