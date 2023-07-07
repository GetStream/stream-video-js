import {useState} from 'react';
import {StreamVideo, StreamVideoClient,} from '@stream-io/video-react-sdk';

import Room from './components/RoomPage';

type URLCredentials = {
  type?: string;
  user_name?: string;
  user_id?: string;
  token?: string;
  api_key?: string;
};

const params =(new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, property) => searchParams.get(property as string),
    }) as URLCredentials);

const apiKey: string = params.api_key ?? "hd8szvscpxvd"; // The API key can be found in the Credentials section
const token: string = params.token ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiQXNhampfVmVudHJlc3MiLCJpc3MiOiJwcm9udG8iLCJzdWIiOiJ1c2VyL0FzYWpqX1ZlbnRyZXNzIiwiaWF0IjoxNjg4NTY2MzM5LCJleHAiOjE2ODkxNzExNDR9.kCtmTNJTipDIMlIpbKsh6Atii89UuHvDG8V0V1HsMQ0"; // The Token can be found in the Credentials section
// const token: string = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiUjItRDIiLCJpc3MiOiJwcm9udG8iLCJzdWIiOiJ1c2VyL1IyLUQyIiwiaWF0IjoxNjg4NTY2MzM5LCJleHAiOjE2ODkxNzExNDR9.WtkOwERolkJtKSJdhLMYHDMdXQ7gEzKdw3A1hECo-Rk"; // The Token can be found in the Credentials section
const userId: string = params.user_id ?? "Asajj_Ventress"; // The User ID can be found in the Credentials section
// const userId: string = "R2-D2"; // The User ID can be found in the Credentials section
const image: string = "https://randomuser.me/api/portraits/thumb/men/11.jpg"; // The image URL, you would like to be displayed in the UI. This is optional.
const roomId: string = "THHBDeP5w3g7";

const App = () => {
  const user = {
    id: userId,
    name: userId,
    image
  };

  const [client] = useState<StreamVideoClient>(() =>
    new StreamVideoClient({
      apiKey,
      token,
      user,
    })
  );



  return (
    <StreamVideo client={client}>
      <div className="app-container">
          <Room roomId={roomId} />
      </div>
    </StreamVideo>
  );
};

export default App;
