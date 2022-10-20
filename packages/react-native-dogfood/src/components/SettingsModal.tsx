import {
  Button,
  Modal,
  SafeAreaView,
  Text,
  TextInput,
  View,
  Switch,
  StyleSheet,
} from 'react-native';
import React from 'react';

interface Props {
  username: string;
  callID: string;
  isVisible: boolean;
  setIsVisible: (isVisible: boolean) => void;
  setUsername: (username: string) => void;
  setCallID: (callID: string) => void;
  loopbackMyVideo: boolean;
  setLoopbackMyVideo: React.Dispatch<React.SetStateAction<boolean>>;
  handleCopyInviteLink: () => void;
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  textInput: {
    color: '#000',
    height: 40,
    width: '100%',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'gray',
    paddingLeft: 10,
    marginTop: 20,
  },
  loopbackSettings: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  loopbackText: {
    color: 'black',
  },
});

export default ({
  username,
  setUsername,
  callID,
  setCallID,
  isVisible,
  setIsVisible,
  loopbackMyVideo,
  setLoopbackMyVideo,
  handleCopyInviteLink,
}: Props) => {
  return (
    <Modal animationType="slide" visible={isVisible}>
      <SafeAreaView style={styles.container}>
        <View style={styles.container}>
          <TextInput
            style={styles.textInput}
            placeholder={'Type your name here...'}
            placeholderTextColor={'#8C8C8CFF'}
            value={username}
            onChangeText={(text) => setUsername(text.replace(/\s/g, '-'))} // replace spaces with dashes as spaces are not allowed in usernames
          />
          <TextInput
            style={styles.textInput}
            placeholder={'Type your call ID here...'}
            placeholderTextColor={'#8C8C8CFF'}
            value={callID}
            onChangeText={setCallID}
          />
          <View style={styles.loopbackSettings}>
            <Text style={styles.loopbackText}>
              Loopback my video(Debug Mode)
            </Text>
            <Switch
              value={loopbackMyVideo}
              onChange={() => {
                setLoopbackMyVideo((prevState) => !prevState);
              }}
            />
          </View>

          <Button
            title="Copy Invite Link"
            color="blue"
            onPress={handleCopyInviteLink}
          />
          <Button
            title={'Close'}
            onPress={() => setIsVisible(false)}
            color={'red'}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};
