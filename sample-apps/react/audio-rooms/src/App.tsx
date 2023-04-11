import {
  StreamVideo,
  useCreateStreamVideoClient,
} from '@stream-io/video-react-sdk';
import './App.css';
import Home from './components/home/Home';
import UserList from './components/user-list/UserList';
import { AudioRoomContextProvider } from './contexts/AudioRoomContext/AudioRoomContext';
import { useUserContext } from './contexts/UserContext/UserContext';
import icon from './assets/icon.png';

const apiKey = import.meta.env.VITE_STREAM_API_KEY as string;
const token = import.meta.env.VITE_STREAM_TOKEN as string;

function App() {
  const { loggedIn } = useUserContext();
  const client = useCreateStreamVideoClient({
    apiKey,
    tokenOrProvider: token,
    user: {
      id: 'martin',
    },
  });

  return (
    <StreamVideo client={client}>
      <div className="app">
        {!loggedIn && (
          <div className="login-screen">
            <div className="intro-area">
              <img src={icon} alt="Logo" />
              <h1>Audio rooms</h1>
              <h2 className="secondaryText">Drop-in audio chat</h2>
              <p className="secondaryText">
                Feel free to test out the Stream Video SDK with our Audio
                example right inside of your browser.
              </p>
            </div>
            <UserList />
          </div>
        )}
        {loggedIn && (
          <AudioRoomContextProvider>
            <Home />
          </AudioRoomContextProvider>
        )}
      </div>
    </StreamVideo>
  );
}

export default App;
