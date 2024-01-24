import React from 'react';
import { Stack } from 'expo-router';
import { UsersList } from '../components/UsersList';
import { VideoWrapper } from '../components/VideoWrapper';
import { AppProvider, useAppContext } from '../context/AppContext';
import { setPushConfig } from '../../utils/setPushConfig';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

setPushConfig();

console.log('hittttt');

const Home = () => {
  console.log('Home');
  const { user } = useAppContext();
  if (!user) {
    return <UsersList />;
  }
  return (
    <VideoWrapper>
      <Stack screenOptions={{ headerShown: false }} />
    </VideoWrapper>
  );
};

export default function Layout() {
  console.log('Layout');
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <Home />
      </AppProvider>
    </GestureHandlerRootView>
  );
}
