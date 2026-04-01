import { Text } from 'react-native';
import { Redirect, Slot } from 'expo-router';
import { useAuthentication } from '../../contexts/authentication-provider';

export default function AppLayout() {
  const { userWithToken, isLoading } = useAuthentication();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!userWithToken) {
    return <Redirect href="/login" />;
  }

  return <Slot />;
}
