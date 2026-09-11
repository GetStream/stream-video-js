import {
  Avatar,
  StreamVideoRN,
  useConnectedUser,
  useI18n,
  useStreamVideoClient,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import React, { useMemo } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackHeaderProps } from '@react-navigation/native-stack';
import { AVATAR_SIZE } from '../constants';
import { ButtonTestIds } from '../constants/TestIds';
import Close from '../assets/Close';
import { Leave } from '../assets/Leave';

export const NavigationHeader = ({
  route,
  navigation,
}: NativeStackHeaderProps) => {
  const videoClient = useStreamVideoClient();
  const user = useConnectedUser();
  const { t } = useI18n();
  const styles = useStyles();
  const userName = useAppGlobalStoreValue((store) => store.userName);
  const environment = useAppGlobalStoreValue((store) => store.appEnvironment);
  const appStoreSetState = useAppGlobalStoreSetState();

  const logoutHandler = () => {
    Alert.alert(
      `Sign out as ${userName}`,
      'Are you sure you want to sign out?',
      [
        {
          text: t('Cancel'),
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async () => {
            try {
              appStoreSetState({
                apiKey: '',
                userId: '',
                userName: '',
                userImageUrl: '',
                appMode: 'None',
              });
              await StreamVideoRN.onPushLogout();
              await videoClient?.disconnectUser();
            } catch (error) {
              console.error('Failed to disconnect', error);
            }
          },
        },
      ],
    );
  };

  const showChooseModeButton =
    (environment === 'pronto' || environment === 'pronto-staging') &&
    (route.name === 'JoinMeetingScreen' ||
      route.name === 'JoinCallScreen' ||
      route.name === 'AudioRoom' ||
      route.name === 'LiveStreamChoose' ||
      route.name === 'TestRecordingScreen');

  return (
    <SafeAreaView style={[styles.header, styles.shadow]} edges={['top']}>
      {user && <Avatar user={user} size="lg" />}
      <Text style={styles.userNameText}>{userName}</Text>

      {!showChooseModeButton ? (
        <Pressable
          style={styles.button}
          testID={ButtonTestIds.LOG_OUT}
          onPress={logoutHandler}
        >
          <Leave color={styles.icon.color} size={24} />
        </Pressable>
      ) : (
        <Pressable
          style={styles.button}
          testID={ButtonTestIds.CHOOSE_MODE}
          onPress={() => {
            appStoreSetState({ appMode: 'None' });
          }}
        >
          <Close color={styles.icon.color} size={24} />
        </Pressable>
      )}
    </SafeAreaView>
  );
};

const useStyles = () => {
  const {
    theme: { semantics, primitives },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: primitives.spacingSm,
          gap: primitives.spacingXs,
          backgroundColor: semantics.backgroundCoreElevation2,
        },
        shadow: Platform.select({
          ios: {},
          android: {
            elevation: 2,
          },
        }) as ViewStyle,
        avatar: {
          height: AVATAR_SIZE,
          width: AVATAR_SIZE,
          borderRadius: 50,
        },
        userNameText: {
          flex: 1,
          paddingLeft: primitives.spacingXs,
          fontSize: primitives.typographyFontSizeSm,
          fontWeight: primitives.typographyFontWeightSemiBold,
          color: semantics.textPrimary,
        },
        icon: {
          color: semantics.buttonSecondaryText,
        },
        button: {
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }),
    [primitives, semantics],
  );
};
