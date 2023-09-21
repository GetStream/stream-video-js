import React from 'react';
import { Stack } from 'expo-router';
import { UsersList } from '../components/UsersList';
import { VideoWrapper } from '../components/VideoWrapper';
import { AppProvider, useAppContext } from '../context/AppContext';

const Home = () => {
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
  return (
    <AppProvider>
      <Home />
    </AppProvider>
  );
}
