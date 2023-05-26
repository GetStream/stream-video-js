import React from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  ActiveCall,
  LobbyView,
  useCall,
} from '@stream-io/video-react-native-sdk';
import {Button, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {theme} from '@stream-io/video-react-native-sdk/dist/src/theme';
import {AuthProgressLoader} from './AuthProgressLoader';
import {NavigationStackParamsList, ScreenTypes} from '../types';

type Props = NativeStackScreenProps<
  NavigationStackParamsList,
  'MeetingScreen'
> & {
  callId: string;
  mode?: string;
  show: ScreenTypes;
  setShow: React.Dispatch<React.SetStateAction<ScreenTypes>>;
};

export const MeetingUI = ({navigation, show, setShow}: Props) => {
  const call = useCall();

  const returnToHomeHandler = () => {
    navigation.navigate('JoinMeetingScreen');
  };

  const backToLobbyHandler = () => {
    setShow('lobby');
  };

  let ComponentToRender: JSX.Element | null = null;

  if (show === 'error-join' || show === 'error-leave') {
    ComponentToRender = (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error Joining Call</Text>
        <Button title="Return to Home" onPress={returnToHomeHandler} />
        <Button title="Back to Lobby" onPress={backToLobbyHandler} />
      </View>
    );
  } else if (show === 'lobby') {
    ComponentToRender = <LobbyView />;
  } else if (show === 'loading') {
    ComponentToRender = <AuthProgressLoader />;
  } else if (!call) {
    ComponentToRender = (
      <View style={styles.container}>
        <Text style={styles.errorText}>Lost Active Call Connection</Text>
        <Button title="Return to Home" onPress={returnToHomeHandler} />
        <Button title="Back to Lobby" onPress={backToLobbyHandler} />
      </View>
    );
  } else {
    ComponentToRender = (
      <SafeAreaView style={styles.wrapper}>
        <ActiveCall />
      </SafeAreaView>
    );
  }

  return ComponentToRender;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: theme.light.static_grey,
  },
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
