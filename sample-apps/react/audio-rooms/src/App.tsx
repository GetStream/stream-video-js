import './App.css';
import Home from './components/home/Home';
import { AudioRoomContextProvider } from './contexts/AudioRoomContext/AudioRoomContext';
import { useUserContext } from './contexts/UserContext/UserContext';
import Login from './components/login/Login';

function App() {
  const { user } = useUserContext();
  if (!user) return <Login />;

  return (
    <AudioRoomContextProvider>
      <Home />
    </AudioRoomContextProvider>
  );
}

export default App;
