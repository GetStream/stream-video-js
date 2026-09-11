import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../../contexts/AppContext';
import { View } from 'react-native';
import { defaultTheme } from '@stream-io/video-react-native-sdk';
import { Button } from '@stream-io/video-react-native-sdk/src/components';

const appEnvironments: AppEnvironment[] = [
  'pronto',
  'video-moderation',
  'demo',
  'pronto-staging',
  'stream-benchmark',
];
export default function EnvSwitcherButton() {
  const [modalVisible, setModalVisible] = useState(false);
  const closeModal = () => setModalVisible(false);

  return (
    <>
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={closeModal}
        supportedOrientations={['portrait', 'landscape']}
      >
        <Pressable style={styles.centeredView} onPress={closeModal}>
          <View style={styles.modalView} onStartShouldSetResponder={() => true}>
            {appEnvironments.map((environment) => (
              <SwitcherButton
                key={environment}
                environment={environment}
                closeModal={closeModal}
              />
            ))}
            <SwitcherButton
              environment="pronto"
              label="Local SFU"
              closeModal={closeModal}
              useLocalSfu
            />
          </View>
        </Pressable>
      </Modal>
      <Button
        style={{ alignSelf: 'flex-end' }}
        text={'Switch Environment'}
        onPress={() => {
          setModalVisible(true);
        }}
      />
    </>
  );
}

const SwitcherButton = ({
  environment,
  label = environment,
  closeModal,
  useLocalSfu = false,
}: {
  environment: AppEnvironment;
  label?: string;
  closeModal: () => void;
  useLocalSfu?: boolean;
}) => {
  const appEnvironment = useAppGlobalStoreValue(
    (store) => store.appEnvironment,
  );
  const useLocalSfuState = useAppGlobalStoreValue((store) => store.useLocalSfu);
  const setState = useAppGlobalStoreSetState();
  const isSelected =
    appEnvironment === environment && useLocalSfuState === useLocalSfu;
  const onPress = () => {
    setState({ appEnvironment: environment, useLocalSfu });
  };

  return (
    <>
      <Button
        text={label}
        onPress={() => {
          onPress();
          closeModal();
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: defaultTheme.semantics.backgroundCoreScrim,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  modalView: {
    backgroundColor: defaultTheme.semantics.backgroundCoreElevation2,
    borderRadius: 20,
    padding: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalButton: {
    margin: 8,
  },
  selectedModalButton: {
    borderWidth: 4,
    borderColor: '#eff0f1',
  },
  unselectedModalButton: {
    borderWidth: 4,
    borderColor: 'transparent',
  },
  modalHeaderText: {
    color: '#eff0f1',
    fontSize: 24,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginVertical: 8,
  },
  modalText: {
    fontSize: 20,
  },
});
