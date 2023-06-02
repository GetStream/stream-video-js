import './App.css';
import Home from './components/home/Home';
import { AudioRoomContextProvider } from './contexts/AudioRoomContext/AudioRoomContext';
import { AuthStatus, useUserContext } from './contexts/UserContext/UserContext';
import Login from './components/login/Login';

function App() {
  const { authStatus, user } = useUserContext();
  return (
    <>
      {authStatus === AuthStatus.loggedOut && <Login />}
      {(AuthStatus.processing || AuthStatus.loggedIn) && user && (
        <AudioRoomContextProvider>
          <Home />
        </AudioRoomContextProvider>
      )}
    </>
  );
}

export default App;
