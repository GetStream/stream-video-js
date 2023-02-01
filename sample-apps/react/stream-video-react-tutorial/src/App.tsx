import { UserDataProvider } from './context/UserContext';
import { VideoRoot } from './components/VideoRoot';

import './style/index.css';

function App() {
  return (
    <UserDataProvider>
      <VideoRoot />
    </UserDataProvider>
  );
}

export default App;
