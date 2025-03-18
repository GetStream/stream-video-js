import { Text } from 'react-native';
import { Redirect, router, Stack } from 'expo-router';
import { useAuthentication } from '../../contexts/authentication-provider';
import { useCalls } from '@stream-io/video-react-native-sdk';
import { useEffect } from 'react';

export default function AppLayout() {
  const { userWithToken, isLoading } = useAuthentication();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!userWithToken) {
    return <Redirect href="/login" />;
  }

  return <RingingWrappedStack />;
}

const RingingWrappedStack = () => {
  const calls = useCalls().filter((c) => c.ringing);

  useEffect(() => {
    // whenever there is a ringing call, redirect to the ringing screen
    if (calls[0]) {
      router.replace('/(app)/ringing');
    }
  }, [calls]);

  return <Stack screenOptions={{ headerShown: false }} />;
};
