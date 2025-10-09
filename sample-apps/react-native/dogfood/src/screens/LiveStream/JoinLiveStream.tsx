import { useI18n, useTheme } from '@stream-io/video-react-native-sdk';
import React, { useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useAppGlobalStoreValue } from '../../contexts/AppContext';
import { TextInput } from '../../components/TextInput';
import { Button } from '../../components/Button';
import { randomId } from '../../modules/helpers/randomId';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LiveStreamParamList } from '../../../types';
import { useOrientation } from '../../hooks/useOrientation';
import QRCode from '../../assets/QRCode';

type JoinLiveStreamScreenProps = NativeStackScreenProps<
  LiveStreamParamList,
  'JoinLiveStream'
>;

export const JoinLiveStream = ({
  navigation,
  route,
}: JoinLiveStreamScreenProps) => {
  const styles = useStyles();
  const { theme } = useTheme();
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);
  const userId = useAppGlobalStoreValue((store) => store.userId);
  const userName = useAppGlobalStoreValue((store) => store.userName);
  const { t } = useI18n();
  const orientation = useOrientation();
  const {
    params: { mode, scannedCallId },
  } = route;
  const [callId, setCallId] = useState<string>(
    mode === 'host' ? randomId() : '',
  );

  const enterBackstageHandler = () => {
    navigation.navigate('HostLiveStream', { callId });
  };

  const joinLiveStreamHandler = () => {
    navigation.navigate('ViewerLiveStream', { callId });
  };

  const openQRScanner = () => {
    navigation.navigate('QRScanner', {
      onScan: (id) => {
        setCallId(id);
      },
    });
  };

  if (callId !== scannedCallId && scannedCallId) {
    setCallId(scannedCallId);
  }

  const landscapeStyles: ViewStyle = {
    flexDirection: orientation === 'landscape' ? 'row' : 'column',
  };

  // Allows only alphabets, numbers, -(hyphen) and _(underscore)
  const callIdRegex = /^[A-Za-z0-9_-]*$/g;
  const isValidCallId = callId && callId.match(callIdRegex);
  const isHost = mode === 'host';

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
            {mode === 'host'
              ? t('Start a livestream by entering the call ID.')
              : t('Join/View a live stream by entering the call ID.')}
          </Text>
        </View>
      </View>
      <View style={styles.bottomContainer}>
        <View style={styles.createCall}>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder={t('Livestream ID')}
              value={callId}
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={(text) => {
                setCallId(text.trim().split(' ').join('-'));
              }}
              style={styles.input}
            />
            {!isHost && (
              <TouchableOpacity
                onPress={openQRScanner}
                style={styles.qrIconButton}
              >
                <QRCode
                  width={20}
                  height={20}
                  fill={theme.colors.textPrimary.toString()}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.buttonContainer}>
          {isHost ? (
            <Button
              onPress={enterBackstageHandler}
              title={t('Start Livestream')}
              disabled={!isValidCallId}
            />
          ) : (
            <Button
              onPress={joinLiveStreamHandler}
              title={t('Join Livestream')}
              disabled={!isValidCallId}
            />
          )}
        </View>
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
          padding: theme.variants.spacingSizes.lg,
          backgroundColor: theme.colors.sheetPrimary,
          flex: 1,
          justifyContent: 'space-evenly',
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
          color: theme.colors.textPrimary,
          fontWeight: '500',
          textAlign: 'center',
          marginTop: theme.variants.spacingSizes.lg,
        },
        subTitle: {
          color: theme.colors.textSecondary,
          fontSize: 16,
          textAlign: 'center',
          marginHorizontal: theme.variants.spacingSizes.xl,
        },
        bottomContainer: {
          flex: 1,
          justifyContent: 'center',
        },
        createCall: {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        inputContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          position: 'relative',
          flex: 1,
        },
        input: {
          paddingRight: 50,
        },
        qrIconButton: {
          position: 'absolute',
          right: 10,
          height: 35,
          width: 35,
          borderRadius: 8,
          justifyContent: 'center',
          alignItems: 'center',
        },
        buttonContainer: {
          marginTop: theme.variants.spacingSizes.md,
        },
        noIdText: {
          color: theme.colors.textPrimary,
          marginTop: theme.variants.spacingSizes.lg,
          fontSize: 12,
          textAlign: 'left',
        },
      }),
    [theme],
  );
};
