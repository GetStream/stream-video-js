import React from 'react';
import ButtonContainer from './ButtonContainer';
import {CallState} from '../../../gen/sfu_models/models';
import {Call} from '../../modules/Call';
import {MediaStream} from 'react-native-webrtc';
import {Client} from '../../modules/Client';
import PhoneDown from '../../icons/PhoneDown';
import Phone from '../../icons/Phone';
import InCallManager from 'react-native-incall-manager';

type Props = {
  call: Call;
  client: Client;
  callState: CallState | undefined;
  setCallState: (callState: CallState | undefined) => void;
  localMediaStream: MediaStream | undefined;
  resetAudioAndVideoMuted: () => void;
};

const PhoneButton = ({
  call,
  callState,
  setCallState,
  localMediaStream,
  client,
  resetAudioAndVideoMuted,
}: Props) => {
  const join = async () => {
    try {
      const {callState: _callState} = await call.join(true, localMediaStream);
      if (_callState && localMediaStream) {
        InCallManager.start({media: 'video'});
        InCallManager.setForceSpeakerphoneOn(true);
        await call.publish(localMediaStream);
        setCallState(_callState);
      }
    } catch (err) {
      console.warn('failed to join call', err);
      setCallState(undefined);
    }
  };

  const hangup = async () => {
    try {
      call.disconnect();
      setCallState(undefined);
      client.refreshSessionId();
      resetAudioAndVideoMuted();
      InCallManager.stop();
    } catch (err) {
      console.warn('failed to leave call', err);
    }
  };
  return (
    <ButtonContainer
      onPress={callState ? hangup : join}
      colorKey={callState ? 'cancel' : 'callToAction'}>
      {!callState ? <Phone color="#fff" /> : <PhoneDown color="#fff" />}
    </ButtonContainer>
  );
};

export default PhoneButton;
