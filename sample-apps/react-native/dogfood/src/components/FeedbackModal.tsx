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
    theme: { colors, variants },
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
                    color={colors.iconPrimary}
                    size={variants.roundButtonSizes.sm}
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
                        ? colors.iconSuccess
                        : colors.iconPrimary
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
    theme: { colors, variants },
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
          backgroundColor: colors.sheetSecondary,
          borderRadius: variants.borderRadiusSizes.lg,
          alignItems: 'center',
          paddingHorizontal: variants.spacingSizes.md,
          paddingVertical: variants.spacingSizes.md,
          maxWidth: FEEDBACK_MODAL_MAX_WIDTH,
        },
        top: {
          flex: 1,
          marginBottom: variants.spacingSizes.lg,
          flexDirection: 'row',
        },
        closeButton: {
          backgroundColor: colors.buttonSecondary,
          borderRadius: variants.borderRadiusSizes.xl,
          width: variants.roundButtonSizes.md,
          height: variants.roundButtonSizes.md,
        },
        topRight: {
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'flex-end',
        },
        logo: {
          width: 190,
          height: 134,
          marginBottom: variants.spacingSizes.md,
          alignSelf: 'center',
        },
        textContainer: {
          maxWidth: 230,
          textAlign: 'center',
        },
        title: {
          fontSize: 28,
          marginBottom: variants.spacingSizes.sm,
          textAlign: 'center',
          color: colors.textPrimary,
          fontWeight: '600',
        },
        subtitle: {
          fontSize: 13,
          textAlign: 'center',
          color: colors.textSecondary,
          marginBottom: variants.spacingSizes.xl,
          fontWeight: '600',
        },
        ratingContainer: {
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: variants.spacingSizes.md,
        },
        ratingButton: {
          paddingVertical: variants.spacingSizes.md,
        },
        bottom: {
          display: 'flex',
          flexDirection: 'row',
          marginTop: variants.spacingSizes.xl,
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
          color: colors.textSecondary,
          fontSize: 13,
          fontWeight: '500',
        },
      }),
    [variants, colors],
  );
};

export default FeedbackModal;
