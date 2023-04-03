import './App.css';
import Home from './components/home/Home';
import UserList from './components/user-list/UserList';
import { AudioRoomContextProvider } from './contexts/AudioRoomContext/AudioRoomContext';
import { useUserContext } from './contexts/UserContext/UserContext';

function App() {
  const { loggedIn } = useUserContext();
  return (
    <div className="app">
      {!loggedIn && (
        <div className="login-screen">
          <h1>Audio rooms</h1>
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
