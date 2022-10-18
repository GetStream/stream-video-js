import React from 'react';
import InCallManager from 'react-native-incall-manager';
import ButtonContainer from './ButtonContainer';
import PhoneDown from '../../icons/PhoneDown';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {
  useAppSetterContext,
  useAppValueContext,
} from '../../contexts/AppContext';
import {RootStackParamList} from '../../../types';

const PhoneButton = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const {call} = useAppValueContext();
  const {resetCallState} = useAppSetterContext();

  const hangup = async () => {
    if (!call) {
      return;
    }
    try {
      resetCallState();
      InCallManager.stop();
      navigation.navigate('Home');
    } catch (err) {
      console.warn('failed to leave call', err);
    }
  };

  return (
    <ButtonContainer onPress={hangup} colorKey={'cancel'}>
      <PhoneDown color="#fff" />
    </ButtonContainer>
  );
};

export default PhoneButton;
