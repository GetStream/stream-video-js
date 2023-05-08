import { UserDataProvider, useUserData } from './context/UserContext';
import { VideoRoot } from './components/VideoRoot';
import { LoadingStateProvider } from './context/LoadingStateContext';

import './style/index.css';
import {
  StreamVideo,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-sdk';

function App() {
  const { selectedUserId, users } = useUserData();
  const client = useCreateStreamVideoClient({
    apiKey: import.meta.env.VITE_STREAM_API_KEY,
    tokenOrProvider: import.meta.env[
      `VITE_STREAM_USER_${selectedUserId.toUpperCase()}_TOKEN`
    ],
    user: users[selectedUserId],
  });

  return (
    <UserDataProvider>
      <LoadingStateProvider>
        <StreamVideo client={client}>
          <VideoRoot />
        </StreamVideo>
      </LoadingStateProvider>
    </UserDataProvider>
  );
}
export default App;
