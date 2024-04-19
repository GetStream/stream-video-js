import React from 'react';
import { Stack } from 'expo-router';
import { UsersList } from '../components/UsersList';
import { VideoWrapper } from '../components/VideoWrapper';
import { AppProvider, useAppContext } from '../context/AppContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function Root() {
  // Set up the auth context and render our layout inside of it.
  return (
    <AppProvider>
      <Home />
    </AppProvider>
  );
}

const Home = () => {
  const { user } = useAppContext();
  if (!user) {
    // no user selected, so select one first, this is our Auth
    return <UsersList />;
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <VideoWrapper>
        <Stack screenOptions={{ headerShown: false }} />
      </VideoWrapper>
    </GestureHandlerRootView>
  );
};
