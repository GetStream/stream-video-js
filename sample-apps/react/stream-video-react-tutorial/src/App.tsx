import { UserDataProvider } from './context/UserContext';
import { VideoRoot } from './components/VideoRoot';
import { LoadingStateProvider } from './context/LoadingStateContext';

import './style/index.css';

function App() {
  return (
    <UserDataProvider>
      <LoadingStateProvider>
        <VideoRoot />
      </LoadingStateProvider>
    </UserDataProvider>
  );
}
export default App;
