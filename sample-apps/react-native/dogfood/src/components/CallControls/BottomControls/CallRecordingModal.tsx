import { useTheme } from '@stream-io/video-react-native-sdk';
import { IconWrapper } from '@stream-io/video-react-native-sdk/src/icons';
import { RecordCall } from '../../../assets/RecordCall';
import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';

interface CallRecordingModalProps {
  visible: boolean;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  message: string;
  title: string;
  confirmButton: string;
  cancelButton: string;
  isEndRecordingModal: boolean;
}

export const CallRecordingModal: React.FC<CallRecordingModalProps> = ({
  visible,
  isLoading,
  onCancel,
  onConfirm,
  message,
  title,
  confirmButton,
  cancelButton,
  isEndRecordingModal,
}) => {
  const styles = useStyles(isEndRecordingModal);
  const {
    theme: { components, semantics },
  } = useTheme();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
      supportedOrientations={['portrait', 'landscape']}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <View style={styles.modalView}>
            <View style={styles.content}>
              <View style={styles.headerContainer}>
                <View style={styles.iconContainer}>
                  <IconWrapper>
                    <RecordCall
                      color={semantics.accentWarning}
                      size={components.iconSizeSm}
                    />
                  </IconWrapper>
                </View>
                <Text style={styles.title}>{title}</Text>
              </View>
              <Text style={styles.message}>{message}</Text>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
              >
                <Text style={styles.buttonText}>{cancelButton}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={onConfirm}
              >
                {isLoading ? (
                  <IconWrapper>
                    <Text style={styles.buttonText}>Loading...</Text>
                  </IconWrapper>
                ) : (
                  <Text style={styles.buttonText}>{confirmButton}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const useStyles = (isEndRecordingModal: boolean) => {
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
        modalView: {
          backgroundColor: semantics.backgroundCoreApp,
          borderRadius: primitives.radiusLg,
          padding: primitives.spacingXl,
          width: '80%',
          maxWidth: 380,
        },
        content: {
          marginBottom: primitives.spacingXl,
        },
        headerContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: primitives.spacingSm,
        },
        iconContainer: {
          display: 'flex',
          marginRight: primitives.spacingSm,
        },
        title: {
          color: semantics.textPrimary,
          fontSize: primitives.typographyFontSizeLg,
          fontWeight: primitives.typographyFontWeightSemiBold,
          textAlign: 'center',
        },
        message: {
          color: semantics.textSecondary,
          fontSize: primitives.typographyFontSizeMd,
          fontWeight: '400',
          textAlign: 'left',
        },
        buttonContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: primitives.spacingMd,
        },
        button: {
          flex: 1,
          borderRadius: primitives.radiusMd,
          justifyContent: 'center',
          alignItems: 'center',
        },
        cancelButton: {
          backgroundColor: semantics.backgroundCoreApp,
          height: 32,
          borderWidth: 1,
          borderColor: semantics.backgroundUtilityDisabled,
        },
        confirmButton: {
          height: 32,
          backgroundColor: isEndRecordingModal
            ? semantics.accentWarning
            : semantics.accentPrimary,
        },
        buttonText: {
          color: semantics.textPrimary,
          fontSize: 13,
          fontWeight: '600',
        },
      }),
    [primitives, semantics, isEndRecordingModal],
  );
};
