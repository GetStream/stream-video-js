import { Slot } from 'expo-router';
import { AuthenticationProvider } from '../contexts/authentication-provider';

export default function Root() {
  return (
    <AuthenticationProvider>
      <Slot />
    </AuthenticationProvider>
  );
}
