import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppGlobalStoreValue } from '../../contexts/AppContext';
import { randomId } from '../../modules/helpers/randomId';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MeetingStackParamList } from '../../../types';
import { appTheme } from '../../theme';
import { TextInput } from '../../components/TextInput';
import { Button } from '../../components/Button';
import { prontoCallId$ } from '../../hooks/useProntoLinkEffect';
import { useI18n } from '@stream-io/video-react-native-sdk';

type JoinMeetingScreenProps = NativeStackScreenProps<
  MeetingStackParamList,
  'JoinMeetingScreen'
>;

const JoinMeetingScreen = (props: JoinMeetingScreenProps) => {
  const [callId, setCallId] = useState<string>('');
  const [linking, setLinking] = useState<boolean>(false);
  const { t } = useI18n();

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
    const subscription = prontoCallId$.subscribe((prontoCallId) => {
      if (prontoCallId) {
        setCallId(prontoCallId);
        setLinking(true);
        prontoCallId$.next(undefined); // remove the current call id to avoid rejoining when coming back to this screen
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // This is done to intentionally cause a rerender when a call id is available through Pronto to move to lobby screen.
  useEffect(() => {
    if (linking) {
      joinCallHandler();
    }
  }, [linking, joinCallHandler]);

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
          {t('Start or join a meeting by entering the call ID.')}
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
        <Button
          onPress={joinCallHandler}
          title={t('Join Call')}
          disabled={!callId}
          buttonStyle={styles.joinCallButton}
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
});

export default JoinMeetingScreen;
