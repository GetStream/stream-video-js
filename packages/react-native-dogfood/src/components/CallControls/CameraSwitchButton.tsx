import React from 'react';
import ButtonContainer from './ButtonContainer';
import {MediaStream} from 'react-native-webrtc';
import CameraSwitch from '../../icons/CameraSwitch';

type Props = {
  localMediaStream?: MediaStream;
};

const CameraSwitchButton = ({localMediaStream}: Props) => {
  const toggleCamera = async () => {
    if (localMediaStream) {
      const [primaryVideoTrack] = localMediaStream.getVideoTracks();
      // @ts-ignore: using private method until apply constraints is supported in react-native-webrtc https://github.com/react-native-webrtc/react-native-webrtc/issues/1170
      primaryVideoTrack._switchCamera();
      // TODO: once applyConstraints is supported in react-native-webrtc, use the following instead
      //   const constraints =
      //     primaryVideoTrack.getConstraints() as unknown as MediaTrackConstraints;
      //   const newFacingMode: MediaTrackConstraints['facingMode'] =
      //     constraints.facingMode === 'user' ? 'environment' : 'user';
      //   constraints.facingMode = newFacingMode;
      //   primaryVideoTrack.applyConstraints(constraints);
    }
  };
  return (
    <ButtonContainer onPress={toggleCamera} colorKey={'activated'}>
      <CameraSwitch color="#121416" />
    </ButtonContainer>
  );
};

export default CameraSwitchButton;
