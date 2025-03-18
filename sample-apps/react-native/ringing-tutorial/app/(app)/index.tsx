import React from 'react';
import { Text, View, StyleSheet, Pressable } from 'react-native';
import { useAuthentication } from '../../contexts/authentication-provider';
import { Users } from '../../constants/Users';
import { UserButton } from '../../components/user-button';
import { ActionButton } from '../../components/action-button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStreamVideoClient } from '@stream-io/video-react-native-sdk';

export default function Index() {
  const { signOut, userWithToken } = useAuthentication();
  const client = useStreamVideoClient();
  const [selectedUsers, setSelectedUsers] = React.useState<string[]>([]);

  const onRing = () => {
    const callId = 'tutorial-' + Math.random().toString(16).substring(2);
    const myCall = client!.call('default', callId);
    myCall.getOrCreate({
      ring: true,
      data: {
        members: [
          // include self
          { user_id: userWithToken!.id },
          // include the userId of the callees
          ...selectedUsers.map((userId) => ({ user_id: userId })),
        ],
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ringing Tutorial</Text>
        <Pressable onPress={signOut} style={styles.signOutButton}>
          <Text style={styles.headerTitle}>⎋</Text>
        </Pressable>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.greeting}>Hello {userWithToken?.name}!</Text>

        <View style={styles.selectionContainer}>
          <Text style={styles.selectionText}>
            Select who would you like to ring?
          </Text>
          <View style={styles.userButtons}>
            {Users.filter((user) => user.id !== userWithToken?.id).map(
              (user) => (
                <UserButton
                  key={user.id}
                  userName={user.name}
                  selected={selectedUsers.includes(user.id)}
                  onPress={() =>
                    setSelectedUsers((prev) =>
                      prev.includes(user.id)
                        ? prev.filter((id) => id !== user.id)
                        : [...prev, user.id],
                    )
                  }
                />
              ),
            )}
          </View>
        </View>

        <ActionButton
          disabled={selectedUsers.length === 0}
          onPress={onRing}
          action="RING"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  signOutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  greeting: {
    fontSize: 32,
    fontWeight: '600',
  },
  selectionContainer: {
    alignItems: 'center',
    width: '100%',
  },
  selectionText: {
    fontSize: 18,
    marginBottom: 40,
  },
  userButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
});
