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
import { TextInput } from '../../components/TextInput';
import { deeplinkCallId$ } from '../../hooks/useDeepLinkEffect';
import { useI18n, useTheme } from '@stream-io/video-react-native-sdk';
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
  const { t } = useI18n();
  const orientation = useOrientation();
  const styles = useStyles();

  const { navigation } = props;

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
      behavior={Platform.OS === 'ios' ? 'position' : 'height'}
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
                'Start a new call, join a meeting by entering the call ID or by scanning a QR code.',
              )}
            </Text>
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <View style={styles.createCall}>
            <TextInput
              placeholder={t('Enter Call ID')}
              value={callId}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={(text) => {
                setState({ callId: text.trim().split(' ').join('-') });
              }}
            />
            <Button
              onPress={joinCallHandler}
              text={t('Join Call')}
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
            text={t('Start New Call')}
            size="large"
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const useStyles = () => {
  const {
    theme: { primitives, semantics, insets },
  } = useTheme();
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
