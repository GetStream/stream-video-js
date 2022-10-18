import {StyleSheet, Text, View} from 'react-native';
import {RTCView} from 'react-native-webrtc';
import ParticipantVideosContainer from './ParticipantVideosContainer';
import React from 'react';
import {useAppValueContext} from '../contexts/AppContext';

const VideoRenderer = () => {
  const {localMediaStream, isVideoMuted, callState, participants, username} =
    useAppValueContext();
  return (
    <>
      <ParticipantVideosContainer />
      {localMediaStream && !isVideoMuted ? (
        <RTCView
          mirror
          streamURL={localMediaStream.toURL()}
          style={
            callState && participants.length > 1
              ? styles.selfView
              : styles.stream
          }
          objectFit="cover"
          zOrder={1}
        />
      ) : (
        <View
          style={[
            callState && participants.length > 1
              ? styles.selfView
              : styles.stream,
            styles.avatarContainer,
          ]}>
          <View style={styles.roundedView}>
            <Text style={styles.userText}>{username}</Text>
          </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  stream: {
    flex: 1,
    maxHeight: '100%',
    marginBottom: -25,
  },
  selfView: {
    height: 180,
    width: 100,
    position: 'absolute',
    right: 20,
    top: 100,
    borderRadius: 10,
  },
  roundedView: {
    borderRadius: 50,
    backgroundColor: 'teal',
    height: 80,
    width: 80,
    justifyContent: 'center',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  userText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
  },
  avatarContainer: {
    backgroundColor: 'black',
  },
});

export default VideoRenderer;
