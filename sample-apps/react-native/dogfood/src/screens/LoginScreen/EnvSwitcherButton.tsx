import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../../contexts/AppContext';
import { View } from 'react-native';
import { defaultTheme } from '@stream-io/video-react-native-sdk';
import { Button } from '../../components/Button';

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
            <SwitcherButton environment="demo" closeModal={closeModal} />
            <SwitcherButton environment="pronto" closeModal={closeModal} />
            <SwitcherButton
              environment="pronto-staging"
              closeModal={closeModal}
            />
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
        title={'Switch Environment'}
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
        title={label}
        buttonStyle={[
          styles.modalButton,
          isSelected
            ? styles.selectedModalButton
            : styles.unselectedModalButton,
        ]}
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
    backgroundColor: defaultTheme.colors.sheetOverlay,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  modalView: {
    backgroundColor: defaultTheme.colors.sheetTertiary,
    borderRadius: 20,
    padding: defaultTheme.variants.spacingSizes.md,
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
    margin: defaultTheme.variants.spacingSizes.sm,
  },
  selectedModalButton: {
    borderWidth: 4,
    borderColor: defaultTheme.colors.iconPrimary,
  },
  unselectedModalButton: {
    borderWidth: 4,
    borderColor: 'transparent',
  },
  modalHeaderText: {
    color: defaultTheme.colors.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginVertical: 8,
  },
  modalText: {
    fontSize: 20,
  },
});
