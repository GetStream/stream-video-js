import {
  StreamVideoClient,
  Call,
  StreamVideo,
  StreamCall,
  User,
  CallContentView,
  CallControlsView,
  StreamVideoRN,
  ParticipantsInfoBadge,
} from '@stream-io/video-react-native-sdk';
import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

// for simplicity, we assume that permission was granted through the native settings app
StreamVideoRN.setPermissions({
  isMicPermissionGranted: true,
  isCameraPermissionGranted: true,
});

const apiKey = 'mmhfdzb5evj2'; // the API key can be found in the "Credentials" section
const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiSGFuX1NvbG8iLCJpc3MiOiJwcm9udG8iLCJzdWIiOiJ1c2VyL0hhbl9Tb2xvIiwiaWF0IjoxNjkwODc4MTIxLCJleHAiOjE2OTE0ODI5MjZ9.TclDukY8ngM0P5BAhMDwOj9kckZPkzErfAmNI6sAhM8'; // the token can be found in the "Credentials" section
const userId = 'Han_Solo'; // the user id can be found in the "Credentials" section
const callId = 'aJzOghKIXrdetsug'; // the call id can be found in the "Credentials" section

// set up the user object
export const user: User = {
  id: userId,
  name: 'Han_Solo',
  image: `https://getstream.io/random_png/?id=${userId}&name=Santhosh`,
};

const client = new StreamVideoClient({ apiKey, user, token });

export default function App() {
  const [call, setCall] = useState<Call>();

  useEffect(() => {
    const myCall = client.call('default', callId);
    myCall
      .join({ create: true })
      .then(() => {
        setCall(myCall);
      })
      .catch((err) => {
        console.error('Failed to join the call', err);
      });

    return () => {
      setCall(undefined);
      myCall.leave().catch((err) => {
        console.error('Failed to leave the call', err);
      });
    };
  }, []);

  if (!call) {
    return null;
  }

  return (
    <StreamVideo client={client} language="en">
      <StreamCall call={call}>
        <SafeAreaView style={{ flex: 1 }}>
          <VideoCallUI />
        </SafeAreaView>
      </StreamCall>
    </StreamVideo>
  );
}

const VideoCallUI = () => {
  return (
    <>
      <View style={styles.icons}>
        <ParticipantsInfoBadge />
      </View>
      <CallContentView />
      <CallControlsView />
    </>
  );
};

const styles = StyleSheet.create({
  icons: {
    position: 'absolute',
    right: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
});
