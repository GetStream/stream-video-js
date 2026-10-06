import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
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
import { TextInput } from '../../components/TextInput';
import { deeplinkCall$ } from '../../hooks/useDeepLinkEffect';
import { MeetingEncryptionSetup } from '../../components/MeetingEncryptionSetup';
import { getRandomWords } from '../../modules/helpers/randomWords';
import { isE2EEEnvironment } from '../../utils/e2ee';
import { useTheme } from '@stream-io/video-react-native-sdk';
import { useAppI18n } from '../../hooks/useAppI18n';
import { useOrientation } from '../../hooks/useOrientation';
import { Button } from '@stream-io/video-react-native-sdk/src/components/utility/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const StreamLogo = require('../../assets/images/stream_placeholder.png');

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
  const { t } = useAppI18n();
  const orientation = useOrientation();
  const styles = useStyles();

  const { navigation } = props;

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
      behavior={'position'}
      style={[{ flex: 1 }, landscapeStyles]}
      contentContainerStyle={{ flex: 1 }}
    >
      <View style={styles.container}>
        <View style={styles.topContainer}>
          <Image source={StreamLogo} style={styles.logo} resizeMode="contain" />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{t('Stream Video Calling')}</Text>
            <Text style={styles.subTitle}>
              {t(
                'joinMeeting.enterCallId.description',
                'Start a new call, join a meeting by entering the call ID or by scanning a QR code.',
              )}
            </Text>
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <View style={styles.createCall}>
            <TextInput
              placeholder={t('joinMeeting.callId.label', 'Enter Call ID')}
              value={callId}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={(text) => {
                setState({ callId: text.trim().split(' ').join('-') });
              }}
            />
            <Button
              onPress={joinCallHandler}
              text={t('joinMeeting.join.label', 'Join Call')}
              size="large"
              disabled={!isValidCall}
            />
          </View>

          <View style={styles.orContainer}>
            <View style={styles.orSeparator} />
            <Text style={styles.orText}>{t('OR')}</Text>
            <View style={styles.orSeparator} />
          </View>

          <Button
            onPress={() => {
              const randomCallID = randomId();
              startNewCallHandler(randomCallID);
            }}
            text={t('joinMeeting.startNewCall.label', 'Start a New Call')}
            size="large"
          />
        </View>
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
  const {
    theme: { primitives, semantics },
  } = useTheme();
  const insets = useSafeAreaInsets();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          paddingHorizontal: primitives.spacingMd,
          paddingTop: primitives.spacing3xl,
          paddingBottom: primitives.spacing3xl + insets.bottom,
          backgroundColor: semantics.backgroundCoreApp,
        },
        topContainer: {
          flex: 1,
          justifyContent: 'center',
          gap: primitives.spacing3xl,
        },
        logo: {
          width: '100%',
          marginHorizontal: 68,
          alignSelf: 'center',
        },
        titleContainer: {
          gap: primitives.spacingSm,
        },
        title: {
          fontSize: primitives.typographyFontSizeXl,
          color: semantics.textPrimary,
          fontWeight: primitives.typographyFontWeightSemiBold,
          textAlign: 'center',
        },
        subTitle: {
          fontSize: primitives.typographyFontSizeMd,
          color: semantics.textSecondary,
          fontWeight: primitives.typographyFontWeightRegular,
          textAlign: 'center',
        },
        bottomContainer: {
          flexDirection: 'column',
          justifyContent: 'center',
          gap: primitives.spacing2xl,
        },
        createCall: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: primitives.spacingLg,
        },
        orContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: primitives.spacingSm,
        },
        orSeparator: {
          flex: 1,
          height: 1,
          backgroundColor: semantics.backgroundUtilityDisabled,
        },
        orText: {
          color: semantics.textDisabled,
          fontSize: primitives.typographyFontSizeXs,
          fontWeight: primitives.typographyFontWeightSemiBold,
        },
      }),
    [primitives, semantics, insets],
  );
};

export default JoinMeetingScreen;
