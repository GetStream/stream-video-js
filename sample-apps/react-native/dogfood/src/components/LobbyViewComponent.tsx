import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  JoinCallButton,
  Lobby,
  useI18n,
} from '@stream-io/video-react-native-sdk';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';
import { MeetingStackParamList } from '../../types';
import { appTheme } from '../theme';
import { useOrientation } from '../hooks/useOrientation';
import { ThermalInfo } from './ThermalInfo';
import { subscribeToThermalStateChanges } from './ThermalInfoModule';
// import { addPowerModeListener } from './PowerMode';

type LobbyViewComponentType = NativeStackScreenProps<
  MeetingStackParamList,
  'MeetingScreen' | 'GuestMeetingScreen'
> & {
  callId: string;
  onJoinCallHandler: () => void;
};

export const LobbyViewComponent = ({
  callId,
  navigation,
  route,
  onJoinCallHandler,
}: LobbyViewComponentType) => {
  const { t } = useI18n();
  const orientation = useOrientation();

  const [lowPowerMode, setLowPowerMode] = useState(false);

  // useEffect(() => {
  //   const subscription = addPowerModeListener((isLowPowerMode: boolean) => {
  //     console.log('Power mode changed:', isLowPowerMode);
  //     setLowPowerMode(isLowPowerMode);
  //   });

  //   return () => subscription.remove();
  // }, []);

  const [thermalState, setThermalState] = useState<string>('unknown');

  useEffect(() => {
    const unsubscribe = subscribeToThermalStateChanges(setThermalState);

    return () => {
      unsubscribe();
    };
  }, []);

  const JoinCallButtonComponent = useCallback(() => {
    return (
      <>
        {/* <Text style={{ color: lowPowerMode ? 'red' : 'green' }}>
          Low Power Mode: {lowPowerMode ? 'Enabled' : 'Disabled'}
        </Text> */}
        {/* <ThermalInfo /> */}
        <Text style={{ color: 'red' }}>Thermal State: {thermalState}</Text>
        <JoinCallButton onPressHandler={onJoinCallHandler} />
        {route.name !== 'MeetingScreen' && (
          <Pressable
            style={styles.anonymousButton}
            onPress={() => {
              navigation.navigate('MeetingScreen', { callId });
            }}
          >
            <Text style={styles.anonymousButtonText}>
              {t('Join with your Stream Account')}
            </Text>
          </Pressable>
        )}
      </>
    );
  }, [onJoinCallHandler, callId, navigation, route.name, t, lowPowerMode]);

  return (
    <View style={styles.container}>
      <Lobby
        JoinCallButton={JoinCallButtonComponent}
        landscape={orientation === 'landscape'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.static_grey,
  },
  anonymousButton: {
    marginTop: 8,
  },
  anonymousButtonText: {
    fontSize: 20,
    fontWeight: '500',
    color: appTheme.colors.primary,
    textAlign: 'center',
  },
});
