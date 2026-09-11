import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useAppGlobalStoreValue } from '../../contexts/AppContext';
import {
  MemberRequest,
  useI18n,
  useStreamVideoClient,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import { appTheme } from '../../theme';
import { Button } from '../../components/Button';
import { TextInput } from '../../components/TextInput';
import { KnownUsers } from '../../constants/KnownUsers';
import { randomId } from '../../modules/helpers/randomId';
import { useOrientation } from '../../hooks/useOrientation';

const ENABLE_RING_PINNING = __DEV__;

const JoinCallScreen = () => {
  const [ringingUserIdsText, setRingingUserIdsText] = useState<string>('');
  const [callType, setCallType] = useState<string>('default');
  const [pinnedCallId, setPinnedCallId] = useState<string>('');
  const userId = useAppGlobalStoreValue((store) => store.userId);
  const devMode = useAppGlobalStoreValue((store) => store.devMode);
  const [ringingUsers, setRingingUsers] = useState<string[]>([]);
  const videoClient = useStreamVideoClient();
  const { t } = useI18n();
  const orientation = useOrientation();
  const styles = useStyles();
  const [isLoading, setIsLoading] = useState(false);

  const startCallHandler = useCallback(async () => {
    Keyboard.dismiss();
    setIsLoading(true);
    let ringingUserIds = !ringingUserIdsText
      ? ringingUsers
      : ringingUserIdsText.split(',');

    // we also need to add our own user id in the members
    ringingUserIds = [...new Set([...ringingUserIds, userId])];

    try {
      const call = videoClient?.call(
        callType || 'default',
        pinnedCallId || randomId(),
      );
      await call?.getOrCreate({
        ring: true,
        video: true,
        data: {
          // more timeout to cancel the call automatically so that it works when callee's app is in quit state
          settings_override: {
            ring: {
              auto_cancel_timeout_ms: 30000,
              incoming_call_timeout_ms: 30000,
              missed_call_timeout_ms: 30000,
            },
          },
          members: ringingUserIds.map<MemberRequest>((ringingUserId) => {
            return {
              user_id: ringingUserId,
            };
          }),
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error calling users', error.message);
      }
      console.log('Failed to createCall', error);
    } finally {
      setIsLoading(false);
    }
  }, [
    ringingUserIdsText,
    ringingUsers,
    videoClient,
    userId,
    callType,
    pinnedCallId,
  ]);

  const isRingingUserSelected = (userid: string) =>
    ringingUsers.find((ringingUser) => ringingUser === userid);

  const ringingUsersSetHandler = (userid: string) => {
    if (!isRingingUserSelected(userid)) {
      setRingingUsers((prevState) => [...prevState, userid]);
    } else {
      setRingingUsers(
        ringingUsers.filter((ringingUser) => ringingUser !== userid),
      );
    }
  };

  const landscapeStyles: ViewStyle = {
    flexDirection: orientation === 'landscape' ? 'row' : 'column',
  };

  const startCallDisabled =
    (ringingUserIdsText === '' && ringingUsers.length === 0) || isLoading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, landscapeStyles]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.topContainer}>
          <Text style={styles.headerText}>{t('Select Participants')}</Text>
          {KnownUsers.filter((user) => user.id !== userId).map((user) => {
            return (
              <Pressable
                style={styles.participant}
                key={user.id}
                onPress={() => ringingUsersSetHandler(user.id)}
              >
                <Image source={{ uri: user.image }} style={styles.avatar} />
                <Text
                  style={[
                    styles.text,
                    isRingingUserSelected(user.id)
                      ? styles.selectedParticipant
                      : null,
                  ]}
                >
                  {user.name + ' - id: ' + user.id}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.bottomContainer}>
          <Text style={styles.orText}>{t('OR')}</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder={t('Enter comma separated User ids')}
            value={ringingUserIdsText}
            onChangeText={(value) => {
              setRingingUserIdsText(value);
            }}
            style={styles.textInputStyle}
          />
          <Button
            title={isLoading ? t('Calling...') : t('Start a New Call')}
            disabled={startCallDisabled}
            onPress={startCallHandler}
          />
          {(ENABLE_RING_PINNING || devMode) && (
            <View style={styles.pinningContainer}>
              <Text style={styles.pinningText}>
                Pin the ring to one call instance (leave blank for a new one)
              </Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={'Call type (default)'}
                value={callType}
                onChangeText={setCallType}
                style={styles.textInputStyle}
              />
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                placeholder={'Call ID (random when blank)'}
                value={pinnedCallId}
                onChangeText={setPinnedCallId}
                style={styles.textInputStyle}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: theme.colors.sheetPrimary,
        },
        scrollContent: {
          flexGrow: 1,
          paddingHorizontal: appTheme.spacing.lg,
        },
        topContainer: {
          paddingTop: appTheme.spacing.lg,
          paddingHorizontal: appTheme.spacing.lg,
        },
        participant: {
          paddingVertical: appTheme.spacing.sm,
          borderBottomColor: 'gray',
          borderBottomWidth: 1,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        },
        selectedParticipant: {
          color: appTheme.colors.primary,
          fontWeight: 'bold',
        },
        headerText: {
          fontSize: 16,
          color: theme.colors.textPrimary,
          fontWeight: 'bold',
          marginBottom: appTheme.spacing.lg,
        },
        avatar: {
          height: 40,
          width: 40,
          borderRadius: 20,
        },
        text: {
          color: theme.colors.textPrimary,
          marginLeft: appTheme.spacing.md,
          fontSize: 16,
          fontWeight: '500',
        },
        bottomContainer: {
          paddingVertical: appTheme.spacing.lg,
        },
        orText: {
          fontSize: 17,
          color: theme.colors.textPrimary,
          fontWeight: '500',
          marginVertical: appTheme.spacing.lg,
          textAlign: 'center',
        },
        textInputStyle: {
          flex: 0,
        },
        pinningContainer: {
          marginTop: appTheme.spacing.lg,
        },
        pinningText: {
          color: theme.colors.textPrimary,
          fontSize: 13,
        },
      }),
    [theme],
  );
};
export default JoinCallScreen;
