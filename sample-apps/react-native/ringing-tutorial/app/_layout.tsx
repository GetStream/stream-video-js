import React from 'react';
import { Slot } from 'expo-router';
import { AuthenticationProvider } from '../contexts/authentication-provider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function Root() {
  return (
    <SafeAreaProvider>
      <AuthenticationProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Slot />
        </GestureHandlerRootView>
      </AuthenticationProvider>
    </SafeAreaProvider>
  );
}
