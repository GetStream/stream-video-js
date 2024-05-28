import {
  CallControlsButton,
  useBackgroundFilters,
  BlurIntensity,
} from '@stream-io/video-react-native-sdk';
import React, { useState } from 'react';
import { Blur } from '../assets/Blur';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { appTheme } from '../theme';
import { Button } from './Button';

const images = [
  require('../assets/backgrounds/amsterdam-1.jpg'),
  require('../assets/backgrounds/amsterdam-2.jpg'),
  require('../assets/backgrounds/boulder-1.jpg'),
  require('../assets/backgrounds/boulder-2.jpg'),
  require('../assets/backgrounds/gradient-1.jpg'),
  require('../assets/backgrounds/gradient-2.jpg'),
  require('../assets/backgrounds/gradient-3.jpg'),
] as number[];

export const VideoFilterButton = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const closeModal = () => setModalVisible(false);
  const { isSupported, disableBackgroundFilter } = useBackgroundFilters();

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
            <Button
              title="Clear Filter"
              buttonStyle={styles.modalButton}
              onPress={() => {
                disableBackgroundFilter();
                closeModal();
              }}
            />
          </View>
        </Pressable>
      </Modal>
      <CallControlsButton onPress={() => setModalVisible((prev) => !prev)}>
        <Blur />
      </CallControlsButton>
    </>
  );
};

const BlurItemPressable = ({
  blurIntensity,
  closeModal,
}: {
  blurIntensity: BlurIntensity;
  closeModal: () => void;
}) => {
  const { applyBackgroundBlurFilter, currentBackgroundFilter } =
    useBackgroundFilters();
  const isSelected = currentBackgroundFilter?.blur === blurIntensity;
  return (
    <Button
      title={blurIntensity}
      buttonStyle={[
        styles.modalButton,
        isSelected ? styles.selectedModalButton : styles.unselectedModalButton,
      ]}
      onPress={() => {
        applyBackgroundBlurFilter(blurIntensity);
        closeModal();
      }}
    />
  );
};

const BlurFilterItemsRow = ({ closeModal }: { closeModal: () => void }) => {
  return (
    <>
      <Text style={styles.modalHeaderText}>{'Blur Filters'}</Text>
      <View style={styles.row}>
        <BlurItemPressable blurIntensity="light" closeModal={closeModal} />
        <BlurItemPressable blurIntensity="medium" closeModal={closeModal} />
        <BlurItemPressable blurIntensity="heavy" closeModal={closeModal} />
      </View>
    </>
  );
};

const ImageItemPressable = ({
  imageSource,
  closeModal,
}: {
  imageSource: number;
  closeModal: () => void;
}) => {
  const { applyBackgroundImageFilter, currentBackgroundFilter } =
    useBackgroundFilters();
  const isSelected = currentBackgroundFilter?.image === imageSource;
  return (
    <Pressable
      style={[
        styles.modalButton,
        isSelected ? styles.selectedModalButton : styles.unselectedModalButton,
      ]}
      onPress={() => {
        applyBackgroundImageFilter(imageSource);
        closeModal();
      }}
    >
      <Image source={imageSource} style={styles.imageBackgroundItem} />
    </Pressable>
  );
};

const ImageFilterItemsRow = ({ closeModal }: { closeModal: () => void }) => {
  return (
    <>
      <Text style={styles.modalHeaderText}>{'Image Filters'}</Text>
      <View style={styles.row}>
        {images.map((img) => (
          <ImageItemPressable
            key={img}
            imageSource={img}
            closeModal={closeModal}
          />
        ))}
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
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  modalView: {
    alignItems: 'center',
    backgroundColor: appTheme.colors.static_grey,
    borderRadius: 20,
    padding: appTheme.spacing.md,
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
    margin: appTheme.spacing.sm,
  },
  selectedModalButton: {
    borderWidth: 4,
    borderColor: 'white',
  },
  unselectedModalButton: {
    borderWidth: 4,
    borderColor: 'transparent',
  },
  modalHeaderText: {
    fontSize: 24,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginVertical: 8,
  },
  modalText: {
    fontSize: 20,
  },
  imageBackgroundItem: {
    resizeMode: 'cover',
    width: 96,
    height: 54,
  },
});
