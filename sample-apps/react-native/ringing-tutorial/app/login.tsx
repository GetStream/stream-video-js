import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Users } from '../constants/Users';
import { useAuthentication } from '../contexts/authentication-provider';
import { UserButton } from '../components/user-button';
import { ActionButton } from '../components/action-button';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [selectedUser, setSelectedUser] = React.useState<string | null>(null);
  const { signIn } = useAuthentication();

  const handleLogin = () => {
    if (selectedUser === null) {
      return;
    }
    signIn(selectedUser);
    // Navigate to main app
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Login as:</Text>

      <View style={styles.userButtonsContainer}>
        {Users.map((user) => (
          <UserButton
            key={user.id}
            userName={user.name}
            selected={selectedUser === user.id}
            onPress={() => setSelectedUser(user.id)}
          />
        ))}
      </View>

      <ActionButton
        disabled={selectedUser === null}
        onPress={handleLogin}
        action="Login"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  userButtonsContainer: {
    width: '100%',
    alignItems: 'center',
  },
});
