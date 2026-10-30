import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { launchCallId, randomId } from '../config';
import { TestIds } from '../testIds';
import { styles as common } from './styles';

type Props = {
  userName: string;
  onJoinCall: (callId: string) => void;
  onLogOut: () => void;
};

/** The Android demo app's call join screen: who is signed in, which call to join, sign out. */
export const CallDetailsScreen = ({
  userName,
  onJoinCall,
  onLogOut,
}: Props) => {
  const [callId, setCallId] = useState(launchCallId ?? '');
  const [showSettings, setShowSettings] = useState(false);

  return (
    <View style={common.screen}>
      <View style={styles.header}>
        <Text style={common.text} testID={TestIds.callDetails.userName}>
          {userName}
        </Text>
        <Pressable
          hitSlop={12}
          testID={TestIds.callDetails.settingsIcon}
          onPress={() => setShowSettings((shown) => !shown)}
        >
          <Text style={common.text}>⚙︎</Text>
        </Pressable>
      </View>
      {showSettings && (
        <Pressable
          style={common.button}
          testID={TestIds.callDetails.signOutButton}
          onPress={onLogOut}
        >
          <Text style={common.buttonText}>Sign out</Text>
        </Pressable>
      )}
      <TextInput
        style={common.input}
        testID={TestIds.callDetails.callIdInputField}
        value={callId}
        onChangeText={setCallId}
        autoCapitalize="none"
        autoCorrect={false}
        placeholder="Call ID"
        placeholderTextColor="#72767e"
      />
      <Pressable
        style={common.button}
        testID={TestIds.callDetails.joinCallButton}
        // An empty field starts a new call, like the Android demo app.
        onPress={() => onJoinCall(callId.trim() || randomId())}
      >
        <Text style={common.buttonText}>Join call</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
