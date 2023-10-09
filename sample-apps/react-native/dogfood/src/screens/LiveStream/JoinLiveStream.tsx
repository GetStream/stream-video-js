import { useI18n } from '@stream-io/video-react-native-sdk';
import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { appTheme } from '../../theme';
import { useAppGlobalStoreValue } from '../../contexts/AppContext';
import { TextInput } from '../../components/TextInput';
import { Button } from '../../components/Button';
import { randomId } from '../../modules/helpers/randomId';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LiveStreamParamList } from '../../../types';

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
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
          disabled={!callId}
        />
      ) : (
        <Button
          onPress={joinLiveStreamHandler}
          title={t('Join Live stream')}
          disabled={!callId}
        />
      )}
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
  },
  subTitle: {
    color: appTheme.colors.light_gray,
    fontSize: 16,
    textAlign: 'center',
    marginTop: appTheme.spacing.lg,
    marginHorizontal: appTheme.spacing.xl,
  },
  createCall: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
