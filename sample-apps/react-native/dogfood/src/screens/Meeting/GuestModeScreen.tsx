import React, { useEffect, useState } from 'react';
import { useCall, useI18n } from '@stream-io/video-react-native-sdk';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MeetingStackParamList } from '../../../types';
import { appTheme } from '../../theme';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/TextInput';

type GuestModeScreenProps = NativeStackScreenProps<
  MeetingStackParamList,
  'GuestModeScreen'
>;

export const GuestModeScreen = ({
  navigation,
  route,
}: GuestModeScreenProps) => {
  const call = useCall();
  const [callId, setCallId] = useState<string>(route.params.callId);
  const [username, setUsername] = useState<string>('Guest');
  const { t } = useI18n();

  useEffect(() => {
    if (call) {
      setCallId(call.id);
    }
  }, [call]);

  const joinAsGuestHandler = () => {
    navigation.navigate('GuestMeetingScreen', {
      mode: 'guest',
      guestUserId: username,
      callId: callId,
    });
  };

  const joinAnonymously = () => {
    navigation.navigate('GuestMeetingScreen', {
      mode: 'anonymous',
      callId: callId,
      guestUserId: '!anon',
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('Guest Mode')}</Text>
      <View>
        <TextInput
          placeholder={t('Meeting Id')}
          value={callId}
          onChangeText={(value) => setCallId(value)}
          style={styles.textInputStyle}
        />
        <TextInput
          placeholder={t('Your name')}
          value={username}
          onChangeText={(value) => setUsername(value)}
          style={styles.textInputStyle}
        />
      </View>
      <View>
        <Button onPress={joinAsGuestHandler} title={t('Join As Guest')} />
        <Button
          onPress={joinAnonymously}
          title={t('Continue Anonymously')}
          buttonStyle={styles.anonymousButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: appTheme.spacing.lg,
    flex: 1,
    justifyContent: 'space-evenly',
    backgroundColor: appTheme.colors.static_grey,
  },
  textInputStyle: {
    flex: 0,
  },
  title: {
    fontSize: 34,
    fontWeight: '400',
    color: appTheme.colors.static_white,
    textAlign: 'center',
  },
  anonymousButton: {
    marginTop: appTheme.spacing.lg,
    backgroundColor: appTheme.colors.light_blue,
  },
});
