import {
  CallControlsButton,
  useBackgroundFilters,
  BlurIntensity,
  BackgroundFiltersProvider,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import React, { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ImageURISource,
} from 'react-native';
import { appTheme } from '../../theme';
import { Button } from '../Button';
import { useCustomVideoFilters } from './CustomFilters';
import { IconWrapper } from '@stream-io/video-react-native-sdk/src/icons';
import { Effects } from '../../assets/Effects';

type ImageSourceType = ImageURISource | number;

const images: ImageSourceType[] = [
  {
    uri: 'https://upload.wikimedia.org/wikipedia/commons/1/18/React_Native_Logo.png',
  },
  require('../../assets/backgrounds/amsterdam-1.jpg'),
  require('../../assets/backgrounds/boulder-1.jpg'),
  require('../../assets/backgrounds/gradient-1.jpg'),
];

export const VideoEffectsButton = () => (
  <BackgroundFiltersProvider>
    <FilterButton />
  </BackgroundFiltersProvider>
);

/**
 * This button opens a modal dialog showing all the possible video filters
 */
const FilterButton = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const closeModal = () => setModalVisible(false);
  const { theme } = useTheme();
  const styles = useStyles();
  const { disableCustomFilter } = useCustomVideoFilters();
  const { isSupported, disableAllFilters } = useBackgroundFilters();

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
        supportedOrientations={['portrait', 'landscape']}
      >
        <Pressable style={styles.centeredView} onPress={closeModal}>
          <View style={styles.modalView} onStartShouldSetResponder={() => true}>
            <CustomFiltersRow closeModal={closeModal} />
            <BlurFilterItemsRow closeModal={closeModal} />
            <ImageFilterItemsRow closeModal={closeModal} />
            <Button
              title="Clear Filter"
              buttonStyle={styles.modalButton}
              onPress={() => {
                disableCustomFilter();
                disableAllFilters();
                closeModal();
              }}
            />
          </View>
        </Pressable>
      </Modal>
      <CallControlsButton
        size={theme.variants.roundButtonSizes.md}
        color={theme.colors.sheetPrimary}
        onPress={() => setModalVisible((prev) => !prev)}
      >
        <IconWrapper>
          <Effects
            color={theme.colors.iconPrimary}
            size={theme.variants.iconSizes.md}
          />
        </IconWrapper>
      </CallControlsButton>
    </>
  );
};

const CustomFiltersRow = ({ closeModal }: { closeModal: () => void }) => {
  const styles = useStyles();
  const { applyGrayScaleFilter, currentCustomFilter } = useCustomVideoFilters();
  const grayScaleSelected = currentCustomFilter === 'GrayScale';
  return (
    <>
      <Text style={styles.modalHeaderText}>{'Custom Filters'}</Text>
      <View style={styles.row}>
        <ModalFilterButton
          title="Gray-Scale"
          isSelected={grayScaleSelected}
          onPress={applyGrayScaleFilter}
          closeModal={closeModal}
        />
      </View>
    </>
  );
};

const ModalFilterButton = ({
  title,
  isSelected,
  onPress,
  closeModal,
}: {
  title: string;
  isSelected: boolean;
  onPress: () => void;
  closeModal: () => void;
}) => {
  const styles = useStyles();
  return (
    <Button
      title={title}
      buttonStyle={[
        styles.modalButton,
        isSelected ? styles.selectedModalButton : styles.unselectedModalButton,
      ]}
      onPress={() => {
        onPress();
        closeModal();
      }}
    />
  );
};

const ModalBlurItemButton = ({
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
    <ModalFilterButton
      title={blurIntensity}
      isSelected={isSelected}
      closeModal={closeModal}
      onPress={() => {
        applyBackgroundBlurFilter(blurIntensity);
      }}
    />
  );
};

const BlurFilterItemsRow = ({ closeModal }: { closeModal: () => void }) => {
  const styles = useStyles();
  return (
    <>
      <Text style={styles.modalHeaderText}>{'Blur Filters'}</Text>
      <View style={styles.row}>
        <ModalBlurItemButton blurIntensity="light" closeModal={closeModal} />
        <ModalBlurItemButton blurIntensity="medium" closeModal={closeModal} />
        <ModalBlurItemButton blurIntensity="heavy" closeModal={closeModal} />
      </View>
    </>
  );
};

const ImageItemPressable = ({
  imageSource,
  closeModal,
}: {
  imageSource: ImageSourceType;
  closeModal: () => void;
}) => {
  const { applyBackgroundImageFilter, currentBackgroundFilter } =
    useBackgroundFilters();
  const isSelected = currentBackgroundFilter?.image === imageSource;
  const styles = useStyles();
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
  const styles = useStyles();
  return (
    <>
      <Text style={styles.modalHeaderText}>{'Image Filters'}</Text>
      <View style={styles.row}>
        {images.map((img) => (
          <ImageItemPressable
            key={typeof img === 'number' ? img : img.uri}
            imageSource={img}
            closeModal={closeModal}
          />
        ))}
      </View>
    </>
  );
};

const useStyles = () => {
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
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
          backgroundColor: theme.colors.sheetSecondary,
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
          borderColor: theme.colors.iconPrimary,
        },
        unselectedModalButton: {
          borderWidth: 4,
          borderColor: 'transparent',
        },
        modalHeaderText: {
          color: theme.colors.textPrimary,
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
      }),
    [theme],
  );
};
