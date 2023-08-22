import { Stack } from 'expo-router';
import { UsersList } from '../components/UsersList';
import { VideoWrapper } from '../components/VideoWrapper';
import { AppProvider, useAppContext } from '../context/AppContext';

const Meeting = () => {
  const { user } = useAppContext();
  if (!user) {
    return <UsersList />;
  }
  return (
    <VideoWrapper>
      <Stack />
    </VideoWrapper>
  );
};

export default function Layout() {
  return (
    <AppProvider>
      <Meeting />
    </AppProvider>
  );
}
