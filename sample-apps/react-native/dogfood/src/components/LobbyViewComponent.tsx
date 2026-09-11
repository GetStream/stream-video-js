import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  JoinCallButton,
  Lobby,
  useI18n,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import React, { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MeetingStackParamList } from '../../types';
import { useOrientation } from '../hooks/useOrientation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationHeader } from './NavigationHeader';

type LobbyViewComponentType = NativeStackScreenProps<
  MeetingStackParamList,
  'MeetingScreen' | 'GuestMeetingScreen'
> & {
  callId: string;
  onJoinCallHandler: () => void;
  onCloseHandler: () => void;
};

export const LobbyViewComponent = ({
  callId,
  navigation,
  route,
  onJoinCallHandler,
}: LobbyViewComponentType) => {
  const { t } = useI18n();
  const orientation = useOrientation();
  const styles = useStyles();

  const JoinCallButtonComponent = useCallback(() => {
    return (
      <>
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
  }, [onJoinCallHandler, callId, navigation, route.name, t, styles]);

  return (
    <View style={styles.container}>
      <NavigationHeader route={route} navigation={navigation} options={{}} />
      <Lobby
        style={styles.lobby}
        JoinCallButton={JoinCallButtonComponent}
        landscape={orientation === 'landscape'}
      />
    </View>
  );
};

const useStyles = () => {
  const {
    theme: { foundations, semantics, primitives },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: semantics.backgroundCoreApp,
        },
        lobby: {
          paddingHorizontal: 16,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: primitives.spacingSm,
          gap: primitives.spacingXs,
        },
        closeButton: {
          width: foundations.layout.size40,
          height: foundations.layout.size40,
          alignItems: 'center',
          justifyContent: 'center',
        },
        userNameText: {
          flex: 1,
          paddingLeft: primitives.spacingXs,
          fontSize: primitives.typographyFontSizeSm,
          fontWeight: primitives.typographyFontWeightSemiBold,
          color: semantics.textPrimary,
        },
        closeIcon: {
          color: semantics.buttonSecondaryText,
        },
        anonymousButton: {
          marginTop: 8,
        },
        anonymousButtonText: {
          fontSize: 20,
          fontWeight: '500',
          color: semantics.buttonPrimaryText,
          textAlign: 'center',
        },
      }),
    [semantics, primitives, foundations],
  );
};
