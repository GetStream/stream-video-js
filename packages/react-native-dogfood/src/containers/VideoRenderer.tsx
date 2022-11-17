import { StyleSheet, Text, View } from 'react-native';
import { RTCView } from 'react-native-webrtc';
import ParticipantVideosContainer from './ParticipantVideosContainer';
import React from 'react';
import { useAppGlobalStoreValue } from '../contexts/AppContext';
import { useObservableValue } from '../hooks/useObservable';
import OutgoingCall from '../components/OutgoingCall';
import { useStore } from '../hooks/useStore';

const VideoRenderer = () => {
  const localMediaStream = useAppGlobalStoreValue(
    (store) => store.localMediaStream,
  );
  const { activeCallRemoteParticipants$, activeRingCallMeta$ } = useStore();
  const activeRingCallMeta = useObservableValue(activeRingCallMeta$);
  const remoteParticipants = useObservableValue(activeCallRemoteParticipants$);

  const loopbackMyVideo = useAppGlobalStoreValue(
    (store) => store.loopbackMyVideo,
  );

  const isVideoMuted = useAppGlobalStoreValue((store) => store.isVideoMuted);
  const username = useAppGlobalStoreValue((store) => store.username);
  const cameraBackFacingMode = useAppGlobalStoreValue(
    (store) => store.cameraBackFacingMode,
  );

  const filteredParticipants = loopbackMyVideo
    ? remoteParticipants
    : remoteParticipants.filter((p) => !p.isLoggedInUser);

  return (
    <>
      {activeRingCallMeta ? (
        filteredParticipants.length > 0 ? (
          <ParticipantVideosContainer />
        ) : (
          <OutgoingCall />
        )
      ) : (
        <ParticipantVideosContainer />
      )}
      {localMediaStream && !isVideoMuted ? (
        <RTCView
          // @ts-ignore
          mirror={!cameraBackFacingMode}
          streamURL={localMediaStream.toURL()}
          style={
            remoteParticipants.length > 0 ? styles.selfView : styles.stream
          }
          objectFit="cover"
          zOrder={1}
        />
      ) : (
        <View
          style={[
            remoteParticipants.length > 0 ? styles.selfView : styles.stream,
            styles.avatarContainer,
          ]}
        >
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
