import React from 'react';
import { Slot } from 'expo-router';
import { AuthenticationProvider } from '../contexts/authentication-provider';
// import { setPushConfig } from '../utils/setPushConfig';
// import { setFirebaseListeners } from '../utils/setFirebaseListeners';

// // Set push config
// setPushConfig();
// // Set the firebase listeners
// setFirebaseListeners();

export default function Root() {
  return (
    <AuthenticationProvider>
      <Slot />
    </AuthenticationProvider>
  );
}
