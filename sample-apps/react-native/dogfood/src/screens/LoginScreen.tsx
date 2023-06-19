import React, { useState } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { useAppGlobalStoreSetState } from '../contexts/AppContext';
import { theme } from '@stream-io/video-react-native-sdk';

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
            value={localUserName}
            onChangeText={(text) => {
              setLocalUserName(text);
            }}
            style={styles.textInput}
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="gray"
          />
          <Pressable
            style={[
              styles.button,
              !localUserName ? styles.disabledButtonStyle : null,
            ]}
            onPress={loginHandler}
            disabled={!localUserName}
          >
            <Text style={styles.buttonText}>Login</Text>
          </Pressable>
        </View>
        <Text style={styles.orText}>OR</Text>
        <GoogleSigninButton
          style={styles.googleSignin}
          size={GoogleSigninButton.Size.Wide}
          onPress={signInViaGoogle}
          disabled={loader}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: theme.light.static_grey,
  },
  logo: {
    height: 100,
    width: 100,
    borderRadius: 20,
  },
  title: {
    fontSize: 30,
    color: 'white',
    fontWeight: '500',
    textAlign: 'center',
  },
  subTitle: {
    color: '#979797',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15,
    marginHorizontal: 20,
  },
  bottomView: {
    alignItems: 'center',
  },
  customUser: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textInput: {
    paddingLeft: 15,
    height: 50,
    backgroundColor: '#1C1E22',
    borderRadius: 8,
    borderColor: '#4C525C',
    borderWidth: 1,
    color: 'white',
    width: 200,
    fontSize: 17,
  },
  button: {
    backgroundColor: '#005FFF',
    paddingVertical: 12,
    width: 100,
    marginLeft: 10,
    justifyContent: 'center',
    borderRadius: 8,
  },
  disabledButtonStyle: {
    backgroundColor: '#4C525C',
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 17,
  },
  orText: {
    fontSize: 17,
    color: 'white',
    fontWeight: '500',
    marginVertical: 20,
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

export default LoginScreen;
