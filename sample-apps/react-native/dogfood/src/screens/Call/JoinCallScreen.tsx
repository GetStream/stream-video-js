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
import { TextInput } from '../../components/TextInput';
import { KnownUsers } from '../../constants/KnownUsers';
import { randomId } from '../../modules/helpers/randomId';
import { useOrientation } from '../../hooks/useOrientation';
import { Button } from '@stream-io/video-react-native-sdk/src/components/utility/Button';

const JoinCallScreen = () => {
  const [ringingUserIdsText, setRingingUserIdsText] = useState<string>('');
  const userId = useAppGlobalStoreValue((store) => store.userId);
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
      const call = videoClient?.call('default', randomId());
      await call?.getOrCreate({
        ring: true,
        video: true,
        data: {
          // more timeout to cancel the call automatically so that it works when callee's app is in quit state
          settings_override: {
            ring: {
              auto_cancel_timeout_ms: 30000,
              incoming_call_timeout_ms: 30000,
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
  }, [ringingUserIdsText, ringingUsers, videoClient, userId]);

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
          <View style={styles.orContainer}>
            <View style={styles.orSeparator} />
            <Text style={styles.orText}>{t('OR')}</Text>
            <View style={styles.orSeparator} />
          </View>

          <View style={styles.inputContainer}>
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
              text={isLoading ? t('Calling...') : t('Start a New Call')}
              disabled={startCallDisabled}
              onPress={startCallHandler}
              size="large"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const useStyles = () => {
  const {
    theme: { semantics, primitives },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: semantics.backgroundCoreApp,
        },
        scrollContent: {
          flexGrow: 1,
          paddingHorizontal: primitives.spacingMd,
        },
        topContainer: {
          padding: primitives.spacingMd,
        },
        participant: {
          paddingVertical: primitives.spacingSm,
          borderBottomColor: 'gray',
          borderBottomWidth: 1,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        },
        selectedParticipant: {
          color: semantics.buttonPrimaryBg,
          fontWeight: 'bold',
        },
        headerText: {
          fontSize: 16,
          color: semantics.textPrimary,
          fontWeight: 'bold',
          marginBottom: primitives.spacingLg,
        },
        avatar: {
          height: 40,
          width: 40,
          borderRadius: 20,
        },
        inputContainer: {
          gap: primitives.spacingSm,
        },
        text: {
          color: semantics.textPrimary,
          marginLeft: primitives.spacingMd,
          fontSize: 16,
          fontWeight: '500',
        },
        bottomContainer: {
          paddingVertical: primitives.spacingLg,
          gap: primitives.spacingXl,
        },
        textInputStyle: {
          flex: 0,
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
    [primitives, semantics],
  );
};
export default JoinCallScreen;
