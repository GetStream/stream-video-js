import {
  Call,
  GetOrCreateCallRequest,
  useStreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { TextInput } from '../../components/TextInput';
import { useAppGlobalStoreValue } from '../../contexts/AppContext';
import { Button } from '../../components/Button';
import { appTheme } from '../../theme';
import { SafeAreaView } from 'react-native-safe-area-context';

const generateRoomId = () => Math.random().toString(36).substring(2, 12);
const generateRoomPayload = ({
  user,
  title,
  description,
}: {
  user: { id: string; name: string; image: string | undefined };
  description?: string;
  title?: string;
}): GetOrCreateCallRequest => {
  return {
    data: {
      members: [{ user_id: user.id, role: 'admin' }],
      custom: {
        title: title || `${user.name}'s Room`,
        description: description || `Room created by ${user.name}.`,
        hosts: [user],
      },
    },
  };
};

type Props = {
  modalVisible: boolean;
  setCall: (call: Call) => void;
  onClose: () => void;
};

export default function CreateRoomModal(props: Props) {
  const client = useStreamVideoClient();

  const [title, setTitle] = useState<string>();
  const [description, setDescription] = useState<string>();
  const userImageUrl = useAppGlobalStoreValue((store) => store.userImageUrl);
  const userId = useAppGlobalStoreValue((store) => store.userId);
  const userName = useAppGlobalStoreValue((store) => store.userName);

  const createRoom = () => {
    if (!client) {
      return;
    }
    const user = {
      id: userId,
      name: userName,
      image: userImageUrl,
    };
    const call = client.call('audio_room', generateRoomId());
    const join = async () => {
      try {
        await call.getOrCreate(
          generateRoomPayload({ user, title, description }),
        );
      } catch (e) {
        console.log('Error while creating audio room', e);
      }
    };
    join();
    props.setCall(call);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={props.modalVisible}
      onRequestClose={props.onClose}
    >
      <Pressable style={styles.centeredView} onPress={props.onClose}>
        <View style={styles.modalView}>
          <TextInput
            placeholder={'Type the title of the room'}
            value={title}
            style={styles.textInputTitle}
            autoCorrect={false}
            onChangeText={setTitle}
          />
          <TextInput
            placeholder={'Type the description of the room'}
            value={description}
            multiline={true}
            autoCorrect={false}
            style={styles.textInputDescription}
            onChangeText={setDescription}
          />
          <Button
            onPress={createRoom}
            title="Create"
            //   buttonStyle={styles.startNewCallButton}
          />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    // justifyContent: 'center',
    // alignItems: 'center',
    paddingTop: 100,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalView: {
    marginHorizontal: 8,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    // width: '100%',
    // alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  container: {
    padding: appTheme.spacing.lg,
    backgroundColor: 'white',
    // flex: 1,
    // height: '100%',
    // justifyContent: 'space-around',
  },
  textInputTitle: {
    flex: 0,
    height: 40,
  },
  textInputDescription: {
    flex: 0,
    height: 60,
  },
});
