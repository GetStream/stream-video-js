import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {Mic} from '../icons/Mic';
import {Video} from '../icons/Video';
import {MediaStream, RTCView, mediaDevices} from 'react-native-webrtc';
import {useState} from 'react';
import {useEffect} from 'react';
import {useAppContext} from '../context/AppContext';
import {MicOff} from '../icons/MicOff';
import {VideoOff} from '../icons/VideoOff';
import {meetingId} from '../utils/meetingId';

export const CallLobbyScreen = () => {
  const [videoStream, setVideoStream] = useState<MediaStream | undefined>(
    undefined,
  );
  const {
    setAudioMuted,
    setVideoMuted,
    setCallId,
    audioMuted,
    videoMuted,
    callID,
  } = useAppContext();

  useEffect(() => {
    const getSteam = async () => {
      const stream = await mediaDevices.getUserMedia({video: true});
      setVideoStream(stream);
    };

    getSteam();
  }, []);

  const joinOrCreateCall = () => {
    const meetingCallID = meetingId();
    setCallId(meetingCallID);
  };

  const toggleVideoState = () => {
    setVideoMuted(!videoMuted);
  };

  const toggleAudioState = () => {
    setAudioMuted(!audioMuted);
  };

  return (
    <View style={styles.container}>
      {videoStream && (
        <RTCView streamURL={videoStream?.toURL()} style={styles.stream} />
      )}
      <View style={styles.buttons}>
        <Pressable style={styles.button} onPress={toggleAudioState}>
          {audioMuted ? (
            <MicOff color="white" style={styles.icons} />
          ) : (
            <Mic color="white" style={styles.icons} />
          )}
        </Pressable>
        <Pressable style={styles.button} onPress={toggleVideoState}>
          {videoMuted ? (
            <VideoOff color="white" style={styles.icons} />
          ) : (
            <Video color="white" style={styles.icons} />
          )}
        </Pressable>
      </View>
      <Pressable style={styles.joinButton} onPress={joinOrCreateCall}>
        {callID ? (
          <ActivityIndicator color={'white'} size={'small'} />
        ) : (
          <Text style={styles.joinButtonText}>Join Call</Text>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  stream: {
    height: 300,
    width: '90%',
    borderRadius: 20,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginVertical: 20,
  },
  buttons: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  button: {
    backgroundColor: 'purple',
    height: 50,
    width: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icons: {
    height: 30,
    width: 30,
  },
  joinButton: {
    width: '70%',
    height: 50,
    backgroundColor: 'purple',
    borderRadius: 30,
    marginVertical: 20,
    marginLeft: 'auto',
    marginRight: 'auto',
    justifyContent: 'center',
  },
  joinButtonText: {
    textAlign: 'center',
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
