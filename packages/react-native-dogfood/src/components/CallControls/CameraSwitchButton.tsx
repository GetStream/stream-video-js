import React from 'react';
import ButtonContainer from './ButtonContainer';
import CameraSwitch from '../../icons/CameraSwitch';
import {useAppGlobalStore} from '../../contexts/AppContext';

const CameraSwitchButton = () => {
  const [{localMediaStream}, setState] = useAppGlobalStore(store => ({
    localMediaStream: store.localMediaStream,
  }));

  const toggleCamera = async () => {
    if (localMediaStream) {
      const [primaryVideoTrack] = localMediaStream.getVideoTracks();
      // @ts-ignore: using private method until apply constraints is supported in react-native-webrtc https://github.com/react-native-webrtc/react-native-webrtc/issues/1170
      primaryVideoTrack._switchCamera();
      setState(prevState => ({
        cameraBackFacingMode: !prevState.cameraBackFacingMode,
      }));
    }
  };
  return (
    <ButtonContainer onPress={toggleCamera} colorKey={'activated'}>
      <CameraSwitch color="#121416" />
    </ButtonContainer>
  );
};

export default CameraSwitchButton;
