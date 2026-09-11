import React, { useMemo, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextInput as NativeTextInput,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../../contexts/AppContext';
import { TextInput } from '../../components/TextInput';
import { useI18n, useTheme } from '@stream-io/video-react-native-sdk';
import { KnownUsers } from '../../constants/KnownUsers';
import { useOrientation } from '../../hooks/useOrientation';
import { SafeAreaView } from 'react-native-safe-area-context';
import EnvSwitcherButton from './EnvSwitcherButton';
import { Alert } from 'react-native';
import { Button } from '@stream-io/video-react-native-sdk/src/components';

const generateValidUserId = (userId: string) => {
  return userId.replace(/[^_\-0-9a-zA-Z@]/g, '_').replace('@getstream_io', '');
};

const ENABLE_PRONTO_SWITCH = __DEV__;

const LoginScreen = () => {
  const [localUserId, setLocalUserId] = useState('');
  const { t } = useI18n();
  const styles = useStyles();
  const orientation = useOrientation();
  const [tapCount, setTapCount] = useState(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setState = useAppGlobalStoreSetState();
  const appEnvironment = useAppGlobalStoreValue(
    (store) => store.appEnvironment,
  );
  const devMode = useAppGlobalStoreValue((store) => store.devMode);
  const useLocalSfu = useAppGlobalStoreValue((store) => store.useLocalSfu);
  const localIpAddress = useAppGlobalStoreValue(
    (store) => store.localIpAddress,
  );

  const sfuIpInputRef = useRef<NativeTextInput>(null);

  const loginHandler = async () => {
    try {
      const _userId = generateValidUserId(localUserId);
      let _userImageUrl = `https://getstream.io/random_png/?id=${_userId}&name=${_userId}`;
      const _user = KnownUsers.find((u) => u.id === _userId);
      if (_user) {
        _userImageUrl = _user.image;
      }

      setState({
        userId: _userId,
        userName: _userId,
        userImageUrl: _userImageUrl,
        appMode: appEnvironment === 'demo' ? 'Meeting' : 'None',
      });
    } catch (error) {
      console.log(error);
    }
  };

  const landscapeStyles: ViewStyle = {
    flexDirection: orientation === 'landscape' ? 'row' : 'column',
  };

  const handleImagePress = () => {
    setTapCount((prev) => prev + 1);

    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    tapTimerRef.current = setTimeout(async () => {
      if (tapCount + 1 >= 3) {
        setState({ devMode: true });
      }
      setTapCount(0);
    }, 500);
  };

  return (
    <SafeAreaView style={[styles.container, landscapeStyles]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.keyboardContainer, landscapeStyles]}
      >
        {(ENABLE_PRONTO_SWITCH || devMode) && (
          <View style={styles.header}>
            <EnvSwitcherButton />
            <Text
              style={styles.envText}
            >{`Current: ${appEnvironment}${useLocalSfu ? ' (local)' : ''}`}</Text>
          </View>
        )}
        <View style={styles.topContainer}>
          <TouchableWithoutFeedback onPress={handleImagePress}>
            <Image
              source={require('../../assets/Logo.png')}
              style={styles.logo}
            />
          </TouchableWithoutFeedback>
          <View>
            <Text style={styles.title}>{t('Stream Video Calling')}</Text>
            <Text style={styles.subTitle}>
              {t(
                'Build reliable video calling, audio rooms, and live streaming with our easy-to-use SDKs and global edge network',
              )}
            </Text>
          </View>
          <View style={styles.textBoxContainer}>
            <TextInput
              placeholder={t('Enter your name')}
              onChangeText={(text) => {
                setLocalUserId(text);
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Button
              text={t('Login')}
              disabled={!localUserId}
              onPress={loginHandler}
            />
          </View>
          {useLocalSfu && (
            <View style={styles.textBoxContainer}>
              <TextInput
                placeholder={'Enter Local IP'}
                ref={sfuIpInputRef}
                defaultValue={localIpAddress}
                onEndEditing={(e) => {
                  if (e.nativeEvent.text) {
                    setState({ localIpAddress: e.nativeEvent.text });
                    Alert.alert(
                      'Local IP Updated',
                      'Local IP has been updated to ' + e.nativeEvent.text,
                    );
                  }
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Button
                text={'Update Local Ip'}
                onPress={() => {
                  // will make onEndEditing to trigger
                  sfuIpInputRef.current!.blur();
                }}
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const useStyles = () => {
  const {
    theme: { semantics, primitives },
  } = useTheme();
  return useMemo(() => {
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: semantics.backgroundCoreApp,
      },
      keyboardContainer: {
        flex: 1,
        margin: primitives.spacingLg,
        justifyContent: 'space-evenly',
      },
      topContainer: {
        flex: 1,
        justifyContent: 'center',
      },
      header: {
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        gap: primitives.spacingXs,
      },
      envText: {
        color: semantics.textPrimary,
        fontSize: primitives.typographyFontSizeSm,
        marginRight: primitives.spacingXs,
      },
      logo: {
        height: 100,
        width: 100,
        borderRadius: 20,
        alignSelf: 'center',
      },
      title: {
        fontSize: 30,
        color: semantics.textPrimary,
        fontWeight: '500',
        textAlign: 'center',
        marginTop: primitives.spacingLg,
      },
      subTitle: {
        color: semantics.textSecondary,
        fontSize: 16,
        textAlign: 'center',
        margin: primitives.spacingXl,
      },
      bottomContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      textBoxContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: primitives.spacingXs,
      },
      textBoxButton: {
        marginLeft: primitives.spacingLg,
      },
      orText: {
        fontSize: 17,
        color: semantics.textPrimary,
        fontWeight: '500',
        marginVertical: primitives.spacingLg,
      },
    });
  }, [semantics, primitives]);
};

export default LoginScreen;
