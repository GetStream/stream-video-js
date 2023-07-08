import { useState } from 'react';
import { StreamVideo, StreamVideoClient } from '@stream-io/video-react-sdk';

import Room from './components/RoomPage';

const apiKey: string = ''; // The API key can be found in the Credentials section
const token: string = ''; // The Token can be found in the Credentials section
const userId: string = ''; // The User ID can be found in the Credentials section
const image: string = ''; // (Optional) The image URL, you would like to be displayed in the UI.
const roomId: string = ''; // The room ID we plan to join.

const user = {
  id: userId,
  name: userId,
  image,
};

const App = () => {
  const [client] = useState(
    () =>
      new StreamVideoClient({
        apiKey,
        token,
        user,
      }),
  );

  return (
    <div className="app-container">
      <StreamVideo client={client}>
        <Room roomId={roomId} />
      </StreamVideo>
    </div>
  );
};

export default App;
