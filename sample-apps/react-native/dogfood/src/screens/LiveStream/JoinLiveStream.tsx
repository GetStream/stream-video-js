import { useI18n } from '@stream-io/video-react-native-sdk';
import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { appTheme } from '../../theme';
import { useAppGlobalStoreValue } from '../../contexts/AppContext';
import { TextInput } from '../../components/TextInput';
import { Button } from '../../components/Button';
import { randomId } from '../../modules/helpers/randomId';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LiveStreamParamList } from '../../../types';
import { useOrientation } from '../../hooks/useOrientation';

type JoinLiveStreamScreenProps = NativeStackScreenProps<
  LiveStreamParamList,
  'JoinLiveStream'
>;

export const JoinLiveStream = ({
  navigation,
  route,
}: JoinLiveStreamScreenProps) => {
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);
  const userId = useAppGlobalStoreValue((store) => store.userId);
  const userName = useAppGlobalStoreValue((store) => store.userName);
  const { t } = useI18n();
  const orientation = useOrientation();
  const {
    params: { mode },
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

  const landscapeStyles: ViewStyle = {
    flexDirection: orientation === 'landscape' ? 'row' : 'column',
  };

  // Allows only alphabets, numbers, -(hyphen) and _(underscore)
  const callIdRegex = /^[A-Za-z0-9_-]*$/g;
  const isValidCallId = callId && callId.match(callIdRegex);

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
              ? t('Start a live stream by entering the call ID.')
              : t('Join/View a live stream by entering the call ID.')}
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
              setCallId(text.trim().split(' ').join('-'));
            }}
          />
        </View>
        {mode === 'host' ? (
          <Button
            onPress={enterBackstageHandler}
            title={t('Enter Backstage')}
            disabled={!isValidCallId}
          />
        ) : (
          <Button
            onPress={joinLiveStreamHandler}
            title={t('Join Live stream')}
            disabled={!isValidCallId}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: appTheme.spacing.lg,
    backgroundColor: appTheme.colors.static_grey,
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
  createCall: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
