import './App.css';
import Home from './components/home/Home';
import UserList from './components/user-list/UserList';
import { AudioRoomContextProvider } from './contexts/AudioRoomContext/AudioRoomContext';
import { AuthStatus, useUserContext } from './contexts/UserContext/UserContext';
import icon from './assets/icon.png';

function App() {
  const { authStatus, user } = useUserContext();
  return (
    <div className="app">
      {authStatus === AuthStatus.loggedOut && (
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
      {(AuthStatus.processing || AuthStatus.loggedIn) && user && (
        <AudioRoomContextProvider>
          <Home userTapped={user} />
        </AudioRoomContextProvider>
      )}
    </div>
  );
}

export default App;
