import React from 'react';
import { Slot } from 'expo-router';
import { AuthenticationProvider } from '../contexts/authentication-provider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function Root() {
  return (
    <AuthenticationProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Slot />
      </GestureHandlerRootView>
    </AuthenticationProvider>
  );
}
