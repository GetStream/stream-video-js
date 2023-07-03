import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useAppGlobalStoreSetState } from '../contexts/AppContext';
import { appTheme } from '../theme';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';

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

const LoginScreen = () => {
  const [localUserId, setLocalUserId] = useState('');
  const [loader, setLoader] = useState(false);

  const setState = useAppGlobalStoreSetState();

  const loginHandler = async () => {
    try {
      const _userId = generateValidUserId(localUserId);
      const _userImageUrl = `https://getstream.io/random_png/?id=${_userId}&name=${_userId}`;
      setState({
        userId: _userId,
        userName: _userId,
        userImageUrl: _userImageUrl,
        appMode: 'None',
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
        appMode: 'None',
      });
    } catch (error: any) {
      if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
      } else {
        setLoader(false);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Image source={require('../assets/Logo.png')} style={styles.logo} />
      <View>
        <Text style={styles.title}>Stream DogFood App</Text>
        <Text style={styles.subTitle}>
          Please sign in with your Google Stream account or a Custom user id.
        </Text>
      </View>

      <View style={styles.bottomView}>
        <View style={styles.customUser}>
          <TextInput
            placeholder="Enter custom user"
            value={localUserId}
            onChangeText={(text) => {
              setLocalUserId(text);
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Button
            title="Login"
            disabled={!localUserId}
            onPress={loginHandler}
            buttonStyle={styles.loginButton}
          />
        </View>
        <Text style={styles.orText}>OR</Text>
        <Button
          title="Google Sign In"
          onPress={signInViaGoogle}
          disabled={loader}
          buttonStyle={styles.googleSignin}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: appTheme.spacing.lg,
    flex: 1,
    justifyContent: 'space-evenly',
    backgroundColor: appTheme.colors.static_grey,
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
  },
  subTitle: {
    color: appTheme.colors.light_gray,
    fontSize: 16,
    textAlign: 'center',
    marginTop: appTheme.spacing.lg,
    marginHorizontal: appTheme.spacing.xl,
  },
  bottomView: {
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
