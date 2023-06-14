import React, { useState } from 'react';
import {
  Button,
  SafeAreaView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useAppGlobalStoreSetState } from '../contexts/AppContext';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: '#eaeaea',
  },
  innerView: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginTop: 16,
    alignSelf: 'stretch',
  },
  textInput: {
    paddingLeft: 15,
    height: 35,
    color: 'black',
  },
  buttonContainer: {
    marginHorizontal: 100,
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 16,
    margin: 2,
  },
  disabledButtonStyle: {
    backgroundColor: 'gray',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  googleSignin: {
    width: 192,
    height: 48,
  },
  headerText: {
    color: 'black',
    fontSize: 20,
    marginVertical: 8,
  },
});

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

const LoginScreen = () => {
  const [localUserName, setLocalUserName] = useState('');
  const [loader, setLoader] = useState(false);

  const setState = useAppGlobalStoreSetState();

  const loginHandler = async () => {
    try {
      const _username = localUserName.replace(/\s/g, '-');
      const _userImageUrl = `https://getstream.io/random_png/?id=${_username}&name=${_username}`;
      setState({
        username: _username,
        userImageUrl: _userImageUrl,
      });
    } catch (error) {
      console.log(error);
    }
  };

  const signInViaGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      setState({
        username: userInfo.user.email,
        userImageUrl:
          userInfo.user.photo ??
          `https://getstream.io/random_png/?id=${userInfo.user.email}&name=${userInfo.user.email}`,
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
    <SafeAreaView style={styles.container}>
      <View>
        <View style={styles.innerView}>
          <TextInput
            placeholder="Enter the custom user"
            value={localUserName}
            onChangeText={(text) => {
              setLocalUserName(text);
            }}
            style={styles.textInput}
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="gray"
          />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Login"
            disabled={!localUserName}
            onPress={loginHandler}
          />
        </View>
      </View>
      <GoogleSigninButton
        style={styles.googleSignin}
        size={GoogleSigninButton.Size.Wide}
        onPress={signInViaGoogle}
        disabled={loader}
      />
    </SafeAreaView>
  );
};

export default LoginScreen;
