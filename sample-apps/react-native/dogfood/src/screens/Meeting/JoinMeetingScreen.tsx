import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { deeplinkCall$ } from '../../hooks/useDeepLinkEffect';
import { MeetingEncryptionSetup } from '../../components/MeetingEncryptionSetup';
import { getRandomWords } from '../../modules/helpers/randomWords';
import { isE2EEEnvironment } from '../../utils/e2ee';
import { useTheme } from '@stream-io/video-react-native-sdk';
import { useAppI18n } from '../../hooks/useAppI18n';
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
  const { t } = useAppI18n();
  const orientation = useOrientation();
  const styles = useStyles();

  const { navigation } = props;
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);
  const userId = useAppGlobalStoreValue((store) => store.userId);
  const userName = useAppGlobalStoreValue((store) => store.userName);

  const appEnvironment = useAppGlobalStoreValue(
    (store) => store.appEnvironment,
  );
  const allowEncryption = isE2EEEnvironment(appEnvironment);
  // Chosen before the call exists, since encryption is fixed at creation. Not
  // persisted: the key belongs to the meeting it is handed to.
  const [e2eeEnabled, setE2eeEnabled] = useState(false);
  const [e2eeKey, setE2eeKey] = useState('');
  const encryptionKey =
    allowEncryption && e2eeEnabled ? e2eeKey.trim() || undefined : undefined;

  const onToggleEncryption = (enabled: boolean) => {
    setE2eeEnabled(enabled);
    if (enabled && !e2eeKey.trim()) setE2eeKey(getRandomWords(3));
  };

  const joinCallHandler = useCallback(() => {
    navigation.navigate('MeetingScreen', { callId, encryptionKey });
  }, [navigation, callId, encryptionKey]);

  const startNewCallHandler = (call_id: string) => {
    navigation.navigate('MeetingScreen', { callId: call_id, encryptionKey });
  };

  useEffect(() => {
    const subscription = deeplinkCall$.subscribe((deeplinkCall) => {
      if (deeplinkCall) {
        if (isValidCallId(deeplinkCall.callId)) {
          // Delay the navigation to wait for the first render to complete
          setTimeout(() => {
            navigation.navigate('MeetingScreen', deeplinkCall);
          }, 300);
        } else {
          console.warn('Invalid call id from deeplink', deeplinkCall.callId);
        }
        deeplinkCall$.next(undefined); // remove the current call id to avoid rejoining when coming back to this screen
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
            {t('joinMeeting.greeting.title', 'Hello, {{ userName }}', {
              userName: userName || userId,
            })}
          </Text>
          <Text style={styles.subTitle}>
            {t(
              'joinMeeting.enterCallId.description',
              'Start or join a meeting by entering the call ID.',
            )}
          </Text>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <View style={styles.createCall}>
          <TextInput
            placeholder={t('joinMeeting.callId.label', 'Type your Call ID')}
            value={callId}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={(text) => {
              setState({ callId: text.trim().split(' ').join('-') });
            }}
          />
          <Button
            onPress={joinCallHandler}
            title={t('joinMeeting.join.label', 'Join Call')}
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
          title={t('joinMeeting.startNewCall.label', 'Start a New Call')}
          buttonStyle={styles.startNewCallButton}
        />
        {allowEncryption && (
          <MeetingEncryptionSetup
            enabled={e2eeEnabled}
            encryptionKey={e2eeKey}
            onToggle={onToggleEncryption}
            onKeyChange={setE2eeKey}
            onRefresh={() => setE2eeKey(getRandomWords(3))}
          />
        )}
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
