import React, { useState } from 'react';
import { Pressable, Text, Modal, StyleSheet, View } from 'react-native';
import GridIconSvg from '../assets/GridIconSvg';
import { ActiveCallProps } from '@stream-io/video-react-native-sdk';

type Mode = NonNullable<ActiveCallProps['mode']>;

const ModeSelectionItem = ({
  mode,
  selectedMode,
  setMode,
  closeModal,
}: {
  mode: Mode;
  selectedMode: Mode;
  setMode: (mode: Mode) => void;
  closeModal: () => void;
}) => {
  return (
    <Pressable
      onPress={() => {
        setMode(mode);
        closeModal();
      }}
      style={styles.modalButton}
    >
      <Text style={styles.modalText}>
        {selectedMode === mode ? '• ' : '  '}
        {mode[0].toUpperCase() + mode.substring(1)}
      </Text>
    </Pressable>
  );
};

export const ParticipantListButtons = ({
  selectedMode,
  setMode,
}: {
  selectedMode: Mode;
  setMode: (m: Mode) => void;
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const closeModal = () => setModalVisible(false);

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
            <ModeSelectionItem
              mode="grid"
              selectedMode={selectedMode}
              setMode={setMode}
              closeModal={closeModal}
            />
            <ModeSelectionItem
              mode="spotlight"
              selectedMode={selectedMode}
              setMode={setMode}
              closeModal={closeModal}
            />
          </View>
        </Pressable>
      </Modal>
      <View style={styles.buttonsContainer}>
        <Pressable
          onPress={() => setModalVisible(true)}
          style={styles.gridButton}
        >
          <GridIconSvg />
        </Pressable>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
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
    height: 40,
    width: 40,
  },
  selectedModeText: {
    minWidth: 10,
  },
  modalButton: {
    padding: 16,
    flexDirection: 'row',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    fontSize: 18,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
});
