import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { randomId } from '../config';
import { TestIds } from '../testIds';
import { styles as common } from './styles';

type Props = {
  /** Shows a spinner while the app signs in as a random user on its own. */
  autoLogIn: boolean;
  error?: string;
  onLogIn: (userId: string) => void;
};

/** User ids allow letters, digits, `@`, `_` and `-`: `a@b.cd` → `a@b_cd`. */
const userIdFromEmail = (email: string) =>
  email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9@_-]/g, '_');

export const LoginScreen = ({ autoLogIn, error, onLogIn }: Props) => {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');

  return (
    <View style={[common.screen, styles.container]}>
      <Text style={common.title}>Stream Video E2E</Text>
      {autoLogIn && !error ? (
        <ActivityIndicator />
      ) : (
        <>
          <Pressable
            style={common.button}
            testID={TestIds.login.randomUserSignIn}
            onPress={() => onLogIn(`e2e_${randomId()}`)}
          >
            <Text style={common.buttonText}>Random user</Text>
          </Pressable>
          <Pressable
            style={common.button}
            testID={TestIds.login.emailSignIn}
            onPress={() => setShowEmailForm(true)}
          >
            <Text style={common.buttonText}>Sign in with email</Text>
          </Pressable>
          {showEmailForm && (
            <>
              <TextInput
                style={common.input}
                testID={TestIds.login.emailInputField}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="Email"
                placeholderTextColor="#72767e"
              />
              <Pressable
                style={common.button}
                testID={TestIds.login.loginButton}
                disabled={!email.trim()}
                onPress={() => onLogIn(userIdFromEmail(email))}
              >
                <Text style={common.buttonText}>Login</Text>
              </Pressable>
            </>
          )}
        </>
      )}
      {error && <Text style={common.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
});
