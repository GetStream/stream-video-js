import React from 'react';
import { Slot } from 'expo-router';
import { AuthenticationProvider } from '../contexts/authentication-provider';
import { setPushConfig } from '../utils/setPushConfig';
import { setFirebaseListeners } from '../utils/setFirebaseListeners';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// setPushConfig();
// setFirebaseListeners();

export default function Root() {
  return (
    <AuthenticationProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Slot />
      </GestureHandlerRootView>
    </AuthenticationProvider>
  );
}
