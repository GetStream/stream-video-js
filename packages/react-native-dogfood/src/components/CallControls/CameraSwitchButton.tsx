import React from 'react';
import ButtonContainer from './ButtonContainer';
import CameraSwitch from '../../icons/CameraSwitch';
import {
  useStreamVideoStoreSetState,
  useStreamVideoStoreValue,
} from '@stream-io/video-react-native-sdk';

const CameraSwitchButton = () => {
  const setState = useStreamVideoStoreSetState();
  const localMediaStream = useStreamVideoStoreValue(
    (store) => store.localMediaStream,
  );

  const toggleCamera = async () => {
    if (localMediaStream) {
      const [primaryVideoTrack] = localMediaStream.getVideoTracks();
      // @ts-ignore: using private method until apply constraints is supported in react-native-webrtc https://github.com/react-native-webrtc/react-native-webrtc/issues/1170
      primaryVideoTrack._switchCamera();
      setState((prevState) => ({
        cameraBackFacingMode: !prevState.cameraBackFacingMode,
      }));
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
