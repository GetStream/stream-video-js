import {
  StreamVideoClient,
  Call,
  CallingState,
  StreamVideo,
  StreamCall,
  User,
} from '@stream-io/video-react-native-sdk';
import React, { useState, useEffect } from 'react';
import Room from './AudioRoom/Room';

const apiKey = 'hd8szvscpxvd'; // the API key can be found in the "Credentials" section
const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiTWlzc2lvbl9WYW8iLCJpc3MiOiJwcm9udG8iLCJzdWIiOiJ1c2VyL01pc3Npb25fVmFvIiwiaWF0IjoxNjkwNTM0ODg3LCJleHAiOjE2OTExMzk2OTJ9.j1EVXFV0q7srVqp2td1q3BQS8dr040Wtaf4ogBkHI1E'; // the token can be found in the "Credentials" section
const userId = 'Mission_Vao'; // the user_id can be found in the "Credentials" section
const callId = 'vyVrXoZn7CXgg45f'; // the call_id can be found in the "Credentials" section

// initialize the user object
export const user: User = {
  id: userId,
  name: 'Santhosh',
  image: `https://getstream.io/random_png/?id=${userId}&name=Santhosh`,
};

export default function App() {
  const [client, setClient] = useState<StreamVideoClient>();
  const [call, setCall] = useState<Call>();
  useEffect(() => {
    const _client = new StreamVideoClient({
      apiKey,
      token,
      user,
    });
    setClient(_client);

    return () => {
      _client.disconnectUser();
      setClient(undefined);
    };
  }, []);

  useEffect(() => {
    if (!client) {
      return;
    }
    const _call = client.call('audio_room', callId);
    _call
      .join({
        create: true,
        data: {
          members: [{ user_id: 'john_smith' }, { user_id: 'jane_doe' }],
          custom: {
            title: 'React Native test',
            description: 'We are doing a test of react native audio rooms',
          },
        },
      })
      .catch((err) => {
        console.error('Error joining the call', err);
        setCall(undefined);
      })
      .then(() => {
        console.log('Successfully joined the call');
      });
    setCall(_call);

    return () => {
      if (_call.state.callingState !== CallingState.LEFT) {
        _call.leave();
      }
      setCall(undefined);
    };
  }, [client]);

  if (!client || !call) {
    return null;
  }

  return (
    <StreamVideo client={client} language="en">
      <StreamCall call={call}>
        <Room onClose={() => setCall(undefined)} />
      </StreamCall>
    </StreamVideo>
  );
}
