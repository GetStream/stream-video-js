import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../../contexts/AppContext';
import { randomId } from '../../modules/helpers/randomId';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MeetingStackParamList } from '../../../types';
import { appTheme } from '../../theme';
import { TextInput } from '../../components/TextInput';
import { Button } from '../../components/Button';
import { deeplinkCallId$ } from '../../hooks/useDeepLinkEffect';
import { useI18n, useTheme } from '@stream-io/video-react-native-sdk';
import { useOrientation } from '../../hooks/useOrientation';

type JoinMeetingScreenProps = NativeStackScreenProps<
  MeetingStackParamList,
  'JoinMeetingScreen'
>;

// Allows only alphabets, numbers, -(hyphen) and _(underscore)
const callIdRegex = /^[A-Za-z0-9_-]*$/g;
const isValidCallId = (callId: string) => callId && callId.match(callIdRegex);

const JoinMeetingScreen = (props: JoinMeetingScreenProps) => {
  const setState = useAppGlobalStoreSetState();
  const callId = useAppGlobalStoreValue((store) => store.callId) || '';
  const { theme } = useTheme();
  const { t } = useI18n();
  const orientation = useOrientation();
  const styles = useStyles();

  const { navigation } = props;
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);
  const userId = useAppGlobalStoreValue((store) => store.userId);
  const userName = useAppGlobalStoreValue((store) => store.userName);

  const joinCallHandler = useCallback(() => {
    navigation.navigate('MeetingScreen', { callId });
  }, [navigation, callId]);

  const startNewCallHandler = (call_id: string) => {
    navigation.navigate('MeetingScreen', { callId: call_id });
  };

  useEffect(() => {
    const subscription = deeplinkCallId$.subscribe((deeplinkCallId) => {
      if (deeplinkCallId) {
        if (isValidCallId(deeplinkCallId)) {
          // Delay the navigation to wait for the first render to complete
          setTimeout(() => {
            navigation.navigate('MeetingScreen', { callId: deeplinkCallId });
          }, 300);
        } else {
          console.warn('Invalid call id from deeplink', deeplinkCallId);
        }
        deeplinkCallId$.next(undefined); // remove the current call id to avoid rejoining when coming back to this screen
      }
    });

    return () => subscription.unsubscribe();
  }, [navigation]);

  const landscapeStyles: ViewStyle = {
    flexDirection: orientation === 'landscape' ? 'row' : 'column',
  };

  const isValidCall = isValidCallId(callId);
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, landscapeStyles]}
    >
      <View style={styles.topContainer}>
        <Image source={{ uri: userImageUrl }} style={styles.logo} />
        <View>
          <Text style={styles.title}>
            {t('Hello, {{ userName }}', { userName: userName || userId })}
          </Text>
          <Text style={styles.subTitle}>
            {t('Start or join a meeting by entering the call ID.')}
          </Text>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <View style={styles.createCall}>
          <TextInput
            placeholder={t('Type your Call ID')}
            value={callId}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={(text) => {
              setState({ callId: text.trim().split(' ').join('-') });
            }}
          />
          <Button
            onPress={joinCallHandler}
            title={t('Join Call')}
            disabled={!isValidCall}
            buttonStyle={{
              ...styles.joinCallButton,
              backgroundColor: isValidCall
                ? theme.colors.buttonPrimary
                : theme.colors.buttonDisabled,
            }}
          />
        </View>
        <Button
          onPress={() => {
            const randomCallID = randomId();
            startNewCallHandler(randomCallID);
          }}
          title={t('Start a New Call')}
          buttonStyle={styles.startNewCallButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          padding: appTheme.spacing.lg,
          backgroundColor: theme.colors.sheetPrimary,
          flex: 1,
          justifyContent: 'space-evenly',
          paddingRight:
            theme.variants.insets.right + theme.variants.spacingSizes.lg,
          paddingLeft:
            theme.variants.insets.left + theme.variants.spacingSizes.lg,
        },
        topContainer: {
          flex: 1,
          justifyContent: 'center',
        },
        logo: {
          height: 100,
          width: 100,
          borderRadius: 50,
          alignSelf: 'center',
        },
        title: {
          fontSize: 30,
          color: appTheme.colors.static_white,
          fontWeight: '500',
          textAlign: 'center',
          marginTop: appTheme.spacing.lg,
        },
        subTitle: {
          color: appTheme.colors.light_gray,
          fontSize: 16,
          textAlign: 'center',
          marginHorizontal: appTheme.spacing.xl,
        },
        bottomContainer: {
          flex: 1,
          justifyContent: 'center',
        },
        joinCallButton: {
          marginLeft: appTheme.spacing.lg,
        },
        startNewCallButton: {
          width: '100%',
        },
        iconButton: {
          width: 40,
        },
        createCall: {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
      }),
    [theme],
  );
};

export default JoinMeetingScreen;
