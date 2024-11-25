import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Switch,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';
import { appTheme } from '../theme';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { useI18n } from '@stream-io/video-react-native-sdk';
import { KnownUsers } from '../constants/KnownUsers';
import { useOrientation } from '../hooks/useOrientation';
import { SafeAreaView } from 'react-native-safe-area-context';

GoogleSignin.configure({
  // webClientId: '<FROM DEVELOPER CONSOLE>', // client ID of type WEB for your server (needed to verify user ID and offline access)
  // offlineAccess: true, // if you want to access Google API on behalf of the user FROM YOUR SERVER
  hostedDomain: 'getstream.io', // specifies a hosted domain restriction
  // forceCodeForRefreshToken: true, // [Android] related to `serverAuthCode`, read the docs link below *.
  // accountName: '', // [Android] specifies an account name on the device that should be used
  // iosClientId: '<FROM DEVELOPER CONSOLE>', // [iOS] if you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
  // googleServicePlistPath: '', // [iOS] if you renamed your GoogleService-Info file, new name here, e.g. GoogleService-Info-Staging
  // openIdRealm: '', // [iOS] The OpenID2 realm of the home web server. This allows Google to include the user's OpenID Identifier in the OpenID Connect ID token.
  // profileImageSize: 120, // [iOS] The desired height (and width) of the profile image. Defaults to 120px
});

const generateValidUserId = (userId: string) => {
  return userId.replace(/[^_\-0-9a-zA-Z@]/g, '_').replace('@getstream_io', '');
};

const ENABLE_PRONTO_SWITCH = true;

const LoginScreen = () => {
  const [localUserId, setLocalUserId] = useState('');
  const [loader, setLoader] = useState(false);
  const { t } = useI18n();
  const orientation = useOrientation();

  const setState = useAppGlobalStoreSetState();
  const appEnvironment = useAppGlobalStoreValue(
    (store) => store.appEnvironment,
  );

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

  const signInViaGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const userId = generateValidUserId(userInfo.user.email);
      const userName = userInfo.user.name as string;

      setState({
        userId,
        userName,
        userImageUrl:
          userInfo.user.photo ??
          `https://getstream.io/random_png/?id=${userInfo.user.email}&name=${userInfo.user.email}`,
        appMode: appEnvironment === 'demo' ? 'Meeting' : 'None',
        appEnvironment: appEnvironment,
      });
    } catch (error: any) {
      if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
      } else {
        setLoader(false);
      }
    }
  };

  const landscapeStyles: ViewStyle = {
    flexDirection: orientation === 'landscape' ? 'row' : 'column',
  };

  return (
    <SafeAreaView style={[styles.container, landscapeStyles]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.keyboardContainer, landscapeStyles]}
      >
        {ENABLE_PRONTO_SWITCH && (
          <View style={styles.header}>
            <Text style={styles.envText}>{t('Pronto')}</Text>
            <Switch
              value={
                appEnvironment === 'pronto' ||
                appEnvironment === 'pronto-staging'
              }
              onValueChange={(value) => {
                if (value) {
                  setState({ appEnvironment: 'pronto' });
                } else {
                  setState({ appEnvironment: 'demo' });
                }
              }}
              trackColor={{ true: appTheme.colors.light_blue }}
              thumbColor={appTheme.colors.primary}
            />
          </View>
        )}
        <View style={styles.topContainer}>
          <Image source={require('../assets/Logo.png')} style={styles.logo} />
          <View>
            <Text style={styles.title}>
              {appEnvironment === 'pronto' ||
              appEnvironment === 'pronto-staging'
                ? t('Pronto')
                : t('Stream Video Calling')}
            </Text>
            <Text style={styles.subTitle}>
              {appEnvironment === 'pronto' ||
              appEnvironment === 'pronto-staging'
                ? t(
                    'Please sign in with your Google Stream account or use a custom user id',
                  )
                : t('Please sign in with Custom User ID')}
            </Text>
          </View>
        </View>
        <View style={styles.bottomContainer}>
          <View style={styles.customUser}>
            <TextInput
              placeholder={t('Enter User ID')}
              value={localUserId}
              onChangeText={(text) => {
                setLocalUserId(text);
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Button
              title={t('Login')}
              disabled={!localUserId}
              onPress={loginHandler}
              buttonStyle={styles.loginButton}
            />
          </View>
          {appEnvironment === 'pronto' ||
            (appEnvironment === 'pronto-staging' && (
              <>
                <Text style={styles.orText}>{t('OR')}</Text>
                <Button
                  title={t('Google Sign In')}
                  onPress={signInViaGoogle}
                  disabled={loader}
                  buttonStyle={styles.googleSignin}
                />
              </>
            ))}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: appTheme.spacing.lg,
    flex: 1,
    backgroundColor: appTheme.colors.static_grey,
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'space-evenly',
  },
  topContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    justifyContent: 'center',
  },
  envText: {
    color: appTheme.colors.static_white,
    fontSize: 16,
    marginRight: 8,
    alignSelf: 'center',
  },
  logo: {
    height: 100,
    width: 100,
    borderRadius: 20,
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
    alignItems: 'center',
  },
  customUser: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loginButton: {
    marginLeft: appTheme.spacing.lg,
  },
  orText: {
    fontSize: 17,
    color: appTheme.colors.static_white,
    fontWeight: '500',
    marginVertical: appTheme.spacing.lg,
  },
  googleSignin: {
    width: '100%',
  },
});

export default LoginScreen;
