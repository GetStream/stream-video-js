import {
  CallControlsButton,
  useBackgroundFilters,
} from '@stream-io/video-react-native-sdk';
import React, { useState } from 'react';
import { Blur } from '../assets/Blur';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { appTheme } from '../theme';

export const VideoFilterButton = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const closeModal = () => setModalVisible(false);
  const { isSupported } = useBackgroundFilters();

  if (!isSupported) {
    return null;
  }

  return (
    <>
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <Pressable
          style={styles.centeredView}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalView} onStartShouldSetResponder={() => true}>
            <BlurFilterItemsRow closeModal={closeModal} />
            <ImageFilterItemsRow closeModal={closeModal} />
          </View>
        </Pressable>
      </Modal>
      <CallControlsButton onPress={() => setModalVisible((prev) => !prev)}>
        <Blur />
      </CallControlsButton>
    </>
  );
};

const BlurFilterItemsRow = ({ closeModal }: { closeModal: () => void }) => {
  return null;
};

const ImageFilterItemsRow = ({ closeModal }: { closeModal: () => void }) => {
  return null;
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: appTheme.colors.static_grey,
    borderRadius: 20,
    padding: appTheme.spacing.md,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  gridButton: {
    height: 30,
    width: 30,
  },
  modalButton: {
    padding: appTheme.spacing.lg,
  },
  modalText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  buttonsContainer: {
    paddingHorizontal: appTheme.spacing.sm,
  },
});
