import React, { useEffect, useState } from 'react';
import {
  Button,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../../contexts/AppContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types';
import { joinCall } from '../../utils/callUtils';
import {
  useActiveRingCall,
  useStreamVideoClient,
  useStreamVideoStoreValue,
} from '@stream-io/video-react-native-sdk';

const styles = StyleSheet.create({
  container: {
    margin: 15,
  },
  headerText: {
    color: 'black',
    fontSize: 20,
    marginVertical: 8,
  },
  textInputView: {
    display: 'flex',
    flexDirection: 'row',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'gray',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  confirmButton: {
    alignSelf: 'center',
    backgroundColor: 'gray',
    padding: 10,
    borderRadius: 20,
    marginLeft: 10,
  },
  buttonText: {
    color: 'white',
  },
  textInput: {
    color: '#000000',
    height: 40,
    marginVertical: 8,
  },
  orText: {
    marginVertical: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  participantsContainer: {
    marginVertical: 20,
  },
  text: {
    color: 'black',
  },
  label: {
    fontSize: 20,
  },
  participant: {
    paddingVertical: 10,
    borderBottomColor: 'gray',
    borderBottomWidth: 1,
  },
  selectedParticipant: {
    color: 'red',
    fontWeight: 'bold',
  },
});

type Props = NativeStackScreenProps<RootStackParamList, 'HomeScreen'> & {
  setLoadingCall: (loading: boolean) => void;
};

const Ringing = ({ navigation, setLoadingCall }: Props) => {
  const [ringingUserIdsText, setRingingUserIdsText] = useState<string>('');
  const videoClient = useStreamVideoClient();
  const localMediaStream = useStreamVideoStoreValue(
    (store) => store.localMediaStream,
  );
  const username = useAppGlobalStoreValue((store) => store.username);
  const ringingUsers = useAppGlobalStoreValue((store) => store.ringingUsers);
  const activeRingCallMeta = useActiveRingCall();

  const users = [
    { id: 'steve', name: 'Steve Galilli' },
    { id: 'khushal', name: 'Khushal Agarwal' },
    { id: 'santhosh', name: 'Santhosh Vaiyapuri' },
    { id: 'oliver', name: 'Oliver Lazoroski' },
    { id: 'zita', name: 'Zita Szupera' },
  ];

  useEffect(() => {
    if (activeRingCallMeta) {
      navigation.navigate('OutgoingCallScreen');
    }
  }, [navigation, activeRingCallMeta]);

  const setState = useAppGlobalStoreSetState();

  const startCallHandler = async () => {
    setLoadingCall(true);
    if (videoClient && localMediaStream) {
      try {
        const callID = uuidv4().toLowerCase();
        let ringingUserIds = !ringingUserIdsText
          ? ringingUsers
          : ringingUserIdsText.split(',');
        if (ringingUserIdsText !== '') {
          setState({ ringingUsers: ringingUserIds });
        }
        await setState({ ringingCallID: callID });
        await joinCall(videoClient, localMediaStream, {
          autoJoin: true,
          ring: true,
          members: ringingUserIds.map((user) => {
            return {
              userId: user,
              role: 'member',
              customJson: new Uint8Array(),
            };
          }),
          callId: callID,
          callType: 'default',
        }).then(() => {
          setLoadingCall(false);
        });
      } catch (err) {
        console.log(err);
      }
    }
  };

  const ringingUsersSetHandler = (userId: string) => {
    if (!ringingUsers.includes(userId)) {
      setState({ ringingUsers: [...ringingUsers, userId] });
    } else {
      setState({
        ringingUsers: ringingUsers.filter(
          (ringingUser) => ringingUser !== userId,
        ),
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.textInputView}>
        <TextInput
          placeholder="Enter comma separated User Ids"
          style={styles.textInput}
          value={ringingUserIdsText}
          onChangeText={(value) => {
            setRingingUserIdsText(value);
          }}
        />
      </View>
      <Text style={styles.orText}>Or</Text>
      <View style={styles.participantsContainer}>
        <Text style={[styles.text, styles.label]}>Select Participants</Text>
        {users
          .filter((user) => user.id !== username)
          .map((user) => {
            return (
              <Pressable
                style={styles.participant}
                key={user.id}
                onPress={() => ringingUsersSetHandler(user.id)}
              >
                <Text
                  style={[
                    styles.text,
                    ringingUsers.includes(user.id)
                      ? styles.selectedParticipant
                      : null,
                  ]}
                >
                  {user.name + ' - id: ' + user.id}
                </Text>
              </Pressable>
            );
          })}
      </View>
      <Button
        disabled={ringingUserIdsText === '' && ringingUsers.length === 0}
        title="Start a Call"
        onPress={startCallHandler}
      />
    </SafeAreaView>
  );
};

export default Ringing;
