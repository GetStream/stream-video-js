import React from 'react';
import { Slot } from 'expo-router';
import { AuthenticationProvider } from '../contexts/authentication-provider';
import { setPushConfig } from '../utils/setPushConfig';
import { setFirebaseListeners } from '../utils/setFirebaseListeners';

setPushConfig();
setFirebaseListeners();

export default function Root() {
  return (
    <AuthenticationProvider>
      <Slot />
    </AuthenticationProvider>
  );
}
