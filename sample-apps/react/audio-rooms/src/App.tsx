import './App.css';
import Home from './components/home/Home';
import UserList from './components/user-list/UserList';
import { AudioRoomContextProvider } from './contexts/AudioRoomContext/AudioRoomContext';
import { useUserContext } from './contexts/UserContext/UserContext';
import icon from './assets/icon.png';

function App() {
  const { loggedIn } = useUserContext();
  return (
    <div className="app">
      {!loggedIn && (
        <div className="login-screen">
          <div className="intro-area">
            <img src={icon} alt="Logo" />
            <h1>Audio rooms</h1>
            <h2 className="secondaryText">Drop-in audio chat</h2>
            <p className="secondaryText">
              Feel free to test out the Stream Video SDK with our Audio example
              right inside of your browser.
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
  );
}

export default App;
