import React from 'react';
import {StyleSheet, View} from 'react-native';
import {Client} from '../../modules/Client';
import {Call} from '../../modules/Call';
import {MediaStream} from 'react-native-webrtc';
import MicButton from './MicButton';
import {CallState} from '../../../gen/sfu_models/models';
import PhoneButton from './PhoneButton';
import VideoButton from './VideoButton';
import CameraSwitchButton from './CameraSwitchButton';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 25,
    paddingHorizontal: 16,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: '#0000004D',
    position: 'absolute',
    bottom: 0,
    zIndex: 2,
  },
});

type Props = {
  client: Client;
  call: Call;
  localMediaStream: MediaStream | undefined;
  callState: CallState | undefined;
  setCallState: (callState: CallState | undefined) => void;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  resetAudioAndVideoMuted: () => void;
};

const CallControls = (props: Props) => {
  const {
    call,
    client,
    localMediaStream,
    callState,
    setCallState,
    isAudioMuted,
    isVideoMuted,
    resetAudioAndVideoMuted,
  } = props;

  return (
    <View style={styles.container}>
      {!!callState && (
        <MicButton
          isAudioMuted={isAudioMuted}
          client={client}
          localMediaStream={localMediaStream}
        />
      )}
      {!!callState && (
        <VideoButton
          isVideoMuted={isVideoMuted}
          client={client}
          localMediaStream={localMediaStream}
        />
      )}
      {!!callState && (
        <CameraSwitchButton localMediaStream={localMediaStream} />
      )}
      <PhoneButton
        call={call}
        client={client}
        setCallState={setCallState}
        callState={callState}
        localMediaStream={localMediaStream}
        resetAudioAndVideoMuted={resetAudioAndVideoMuted}
      />
    </View>
  );
};

export default CallControls;
