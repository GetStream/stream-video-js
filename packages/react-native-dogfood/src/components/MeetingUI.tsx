import React, { useCallback, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActiveCall,
  ActiveCallProps,
  LobbyView,
  StreamVideoRN,
  useCall,
} from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList } from '../../types';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import { theme } from '@stream-io/video-react-native-sdk/dist/src/theme';
import { ParticipantListButtons } from '../components/ParticipantListButtons';
import AuthenticatingProgressScreen from '../screens/AuthenticatingProgress';

type Props = NativeStackScreenProps<MeetingStackParamList, 'MeetingScreen'>;
type Mode = NonNullable<ActiveCallProps['mode']>;

export const MeetingUI = ({ navigation }: Props) => {
  const [selectedMode, setMode] = React.useState<Mode>('grid');
  const [show, setShow] = useState<
    'lobby' | 'error-join' | 'error-leave' | 'loading' | 'active-call'
  >('lobby');

  const activeCall = useCall();

  const onJoin = useCallback(async () => {
    setShow('loading');
    try {
      await activeCall?.join({ create: true });
      setShow('active-call');
    } catch (e) {
      console.error(e);
      setShow('error-join');
    }
  }, [activeCall]);

  const onLeave = useCallback(async () => {
    setShow('loading');
    try {
      setShow('lobby');
      await activeCall?.leave();
      navigation.goBack();
    } catch (e) {
      console.error(e);
      setShow('error-leave');
    }
  }, [navigation, activeCall]);

  const onOpenCallParticipantsInfoViewHandler = () => {
    navigation.navigate('CallParticipantsInfoScreen');
  };

  StreamVideoRN.setConfig({
    onOpenCallParticipantsInfoView: onOpenCallParticipantsInfoViewHandler,
  });

  let ComponentToRender: JSX.Element | null = null;

  if (show === 'error-join' || show === 'error-leave') {
    ComponentToRender = (
      <Text style={styles.errorText}>Error Joining Call</Text>
    );
  } else if (show === 'lobby') {
    ComponentToRender = <LobbyView onJoin={onJoin} />;
  } else if (show === 'loading') {
    ComponentToRender = <AuthenticatingProgressScreen />;
  } else if (!activeCall) {
    ComponentToRender = (
      <Text style={styles.errorText}>Lost Active Call Connection</Text>
    );
  } else {
    ComponentToRender = (
      <SafeAreaView style={styles.wrapper}>
        <ParticipantListButtons selectedMode={selectedMode} setMode={setMode} />
        <ActiveCall mode={selectedMode} onLeave={onLeave} />
      </SafeAreaView>
    );
  }

  return ComponentToRender;
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.light.static_grey,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 30,
    color: 'red',
    textAlign: 'center',
  },
});
