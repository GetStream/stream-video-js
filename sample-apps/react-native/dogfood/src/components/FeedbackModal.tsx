import { IconWrapper } from '@stream-io/video-react-native-sdk/src/icons';
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
} from 'react-native';
import Star from '../assets/Star';
import { useTheme } from '@stream-io/video-react-native-sdk';
import Close from '../assets/Close';
import { FEEDBACK_MODAL_MAX_WIDTH } from '../constants';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  onRating: (rating: number) => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  visible,
  onClose,
  onRating,
}) => {
  const styles = useStyles();
  const {
    theme: { semantics, components },
  } = useTheme();
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const handleRatingPress = (rating: number) => {
    setSelectedRating(rating);
    onRating(rating);
  };

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      <TouchableOpacity style={styles.overlay} onPress={onClose}>
        <View style={[styles.modal]}>
          <View style={styles.top}>
            <View style={styles.topRight}>
              <TouchableOpacity onPress={onClose} style={[styles.closeButton]}>
                <IconWrapper>
                  <Close
                    color={semantics.accentNeutral}
                    size={components.iconSizeMd}
                  />
                </IconWrapper>
              </TouchableOpacity>
            </View>
          </View>
          <Image
            source={require('../assets/feedbackLogo.png')}
            style={styles.logo}
          />
          <View style={styles.textContainer}>
            <Text style={styles.title}>We Value Your Feedback!</Text>
            <Text style={styles.subtitle}>
              Tell us about your video call experience.
            </Text>
          </View>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity
                key={rating}
                onPress={() => handleRatingPress(rating)}
                style={[styles.ratingButton]}
              >
                <IconWrapper>
                  <Star
                    color={
                      selectedRating && selectedRating >= rating
                        ? semantics.accentSuccess
                        : semantics.accentNeutral
                    }
                    size={68}
                  />
                </IconWrapper>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.bottom}>
            <View style={styles.left}>
              <Text style={styles.text}>Very Bad</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.text}>Very Good</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const useStyles = () => {
  const {
    theme: { primitives, semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        modal: {
          width: '90%',
          backgroundColor: semantics.backgroundCoreApp,
          borderRadius: primitives.radiusLg,
          alignItems: 'center',
          paddingHorizontal: primitives.spacingMd,
          paddingVertical: primitives.spacingMd,
          maxWidth: FEEDBACK_MODAL_MAX_WIDTH,
        },
        top: {
          flex: 1,
          marginBottom: primitives.spacingLg,
          flexDirection: 'row',
        },
        closeButton: {
          backgroundColor: semantics.backgroundCoreApp,
          borderRadius: primitives.radiusXl,
          width: primitives.spacingMd,
          height: primitives.spacingMd,
        },
        topRight: {
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'flex-end',
        },
        logo: {
          width: 190,
          height: 134,
          marginBottom: primitives.spacingMd,
          alignSelf: 'center',
        },
        textContainer: {
          maxWidth: 230,
          textAlign: 'center',
        },
        title: {
          fontSize: primitives.typographyFontSizeXl,
          marginBottom: primitives.spacingSm,
          textAlign: 'center',
          color: semantics.textPrimary,
          fontWeight: primitives.typographyFontWeightSemiBold,
        },
        subtitle: {
          fontSize: primitives.typographyFontSizeMd,
          textAlign: 'center',
          color: semantics.textSecondary,
          marginBottom: primitives.spacingXl,
          fontWeight: primitives.typographyFontWeightSemiBold,
        },
        ratingContainer: {
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: primitives.spacingMd,
        },
        ratingButton: {
          paddingVertical: primitives.spacingMd,
        },
        bottom: {
          display: 'flex',
          flexDirection: 'row',
          marginTop: primitives.spacingXl,
        },
        left: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'flex-start',
        },
        right: {
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'flex-end',
        },
        text: {
          color: semantics.textSecondary,
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: primitives.typographyFontWeightSemiBold,
        },
      }),
    [primitives, semantics],
  );
};

export default FeedbackModal;
