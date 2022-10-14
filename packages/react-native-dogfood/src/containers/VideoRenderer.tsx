import {StyleSheet} from 'react-native';
import {MediaStream, RTCView} from 'react-native-webrtc';
import ParticipantVideosContainer from './ParticipantVideosContainer';
import React from 'react';
import {Call} from '../modules/Call';
import {Client} from '../modules/Client';
import {CallState, Participant} from '../gen/sfu_models/models';

type VideoRenderProps = {
  localMediaStream: MediaStream | undefined;
  isVideoMuted: boolean;
  call: Call;
  client: Client;
  callState: CallState | undefined;
  participants: Participant[];
  loopbackMyVideo: boolean;
};

const VideoRenderer = ({
  localMediaStream,
  isVideoMuted,
  call,
  callState,
  client,
  participants,
  loopbackMyVideo,
}: VideoRenderProps) => {
  return (
    <>
      <ParticipantVideosContainer
        call={call}
        client={client}
        participants={participants}
        loopbackMyVideo={loopbackMyVideo}
      />
      {localMediaStream && !isVideoMuted && (
        <RTCView
          mirror
          streamURL={localMediaStream.toURL()}
          style={callState ? styles.selfView : styles.stream}
          objectFit="cover"
          zOrder={1}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  stream: {
    flex: 1,
  },
  container: {
    justifyContent: 'center',
    backgroundColor: 'black',
    flexDirection: 'row',
    alignItems: 'center',
    display: 'flex',
    flex: 1,
  },
  selfView: {
    height: 180,
    width: 100,
    position: 'absolute',
    right: 20,
    top: 100,
    borderRadius: 10,
  },
});

export default VideoRenderer;
