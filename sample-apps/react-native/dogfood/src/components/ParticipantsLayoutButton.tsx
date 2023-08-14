import React, { useState } from 'react';
import { Pressable, Text, Modal, StyleSheet, View } from 'react-native';
import GridIconSvg from '../assets/GridIconSvg';
import { appTheme } from '../theme';

type Layout = 'grid' | 'spotlight';

const LayoutSelectionItem = ({
  layout,
  selectedLayout,
  setSelectedLayout,
  closeModal,
}: {
  layout: Layout;
  selectedLayout: Layout;
  setSelectedLayout: (mode: Layout) => void;
  closeModal: () => void;
}) => {
  if (!layout) {
    return null;
  }

  return (
    <Pressable
      onPress={() => {
        setSelectedLayout(layout);
        closeModal();
      }}
      style={styles.modalButton}
    >
      <Text
        style={[
          styles.modalText,
          {
            color:
              selectedLayout === layout
                ? appTheme.colors.primary
                : appTheme.colors.static_white,
          },
        ]}
      >
        {layout[0].toUpperCase() + layout.substring(1)}
      </Text>
    </Pressable>
  );
};

export const ParticipantsLayoutSwitchButton = ({
  selectedLayout,
  setSelectedLayout,
}: {
  selectedLayout: Layout;
  setSelectedLayout: (m: Layout) => void;
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
            <LayoutSelectionItem
              layout="grid"
              selectedLayout={selectedLayout}
              setSelectedLayout={setSelectedLayout}
              closeModal={closeModal}
            />
            <LayoutSelectionItem
              layout="spotlight"
              selectedLayout={selectedLayout}
              setSelectedLayout={setSelectedLayout}
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
