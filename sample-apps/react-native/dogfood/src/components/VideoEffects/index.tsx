import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageURISource,
} from 'react-native';
import {
  useBackgroundFilters,
  BlurIntensity,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import { useCustomVideoFilters } from './CustomFilters';
import LightDark from '../../assets/LightDark';
import Blur from '../../assets/Blur';

type ImageSourceType = ImageURISource | number;

const images: ImageSourceType[] = [
  require('../../assets/backgrounds/amsterdam-1.jpg'),
  require('../../assets/backgrounds/boulder-1.jpg'),
  require('../../assets/backgrounds/gradient-1.jpg'),
  {
    uri: 'https://upload.wikimedia.org/wikipedia/commons/1/18/React_Native_Logo.png',
  },
];

type VideoFiltersProps = {
  onSelectFilter: () => void;
};

export const VideoFilters = ({ onSelectFilter }: VideoFiltersProps) => {
  const { theme } = useTheme();
  const { applyGrayScaleFilter, disableCustomFilter, currentCustomFilter } =
    useCustomVideoFilters();
  const {
    isSupported,
    applyBackgroundBlurFilter,
    applyBackgroundImageFilter,
    disableAllFilters,
    currentBackgroundFilter,
  } = useBackgroundFilters();

  if (!isSupported) {
    return null;
  }

  const handleClearFilter = () => {
    disableCustomFilter();
    disableAllFilters();
    onSelectFilter();
  };

  const handleGrayScaleFilter = () => {
    applyGrayScaleFilter();
    onSelectFilter();
  };

  const handleBlurFilter = (intensity: BlurIntensity) => {
    applyBackgroundBlurFilter(intensity);
    onSelectFilter();
  };

  const handleImageFilter = (image: ImageSourceType) => {
    applyBackgroundImageFilter(image);
    onSelectFilter();
  };

  const isGrayScaleSelected = currentCustomFilter === 'GrayScale';

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: theme.colors.buttonSecondary },
          ]}
          onPress={handleClearFilter}
        >
          <Text style={[styles.clearText, { color: theme.colors.textPrimary }]}>
            ✕
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: theme.colors.buttonSecondary },
            isGrayScaleSelected && styles.selectedButton,
          ]}
          onPress={handleGrayScaleFilter}
        >
          <LightDark
            color={theme.colors.iconPrimary}
            size={theme.variants.roundButtonSizes.sm}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: theme.colors.buttonSecondary },
            currentBackgroundFilter?.blur === 'medium' && styles.selectedButton,
          ]}
          onPress={() => handleBlurFilter('medium')}
        >
          <Blur
            color={theme.colors.iconPrimary}
            size={theme.variants.roundButtonSizes.sm}
          />
        </TouchableOpacity>
        {images.map((img, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.filterButton,
              { backgroundColor: theme.colors.buttonSecondary },
              currentBackgroundFilter?.image === img && styles.selectedButton,
            ]}
            onPress={() => handleImageFilter(img)}
          >
            <Image source={img} style={styles.imageThumb} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  scrollView: {
    flexDirection: 'row',
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    overflow: 'hidden',
  },
  selectedButton: {
    borderWidth: 2,
    borderColor: '#00BFFF',
  },
  filterText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  imageThumb: {
    width: 50,
    height: 50,
    resizeMode: 'cover',
  },
});
