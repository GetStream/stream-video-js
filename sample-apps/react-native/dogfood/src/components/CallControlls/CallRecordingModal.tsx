import { useTheme } from '@stream-io/video-react-native-sdk';
import { IconWrapper } from '@stream-io/video-react-native-sdk/src/icons';
import { RecordCall } from '../../assets/RecordCall';
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
    theme: { colors, variants },
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
                      color={colors.iconWarning}
                      size={variants.roundButtonSizes.sm}
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
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        modalView: {
          backgroundColor: theme.colors.sheetSecondary,
          borderRadius: theme.variants.borderRadiusSizes.lg,
          padding: theme.variants.spacingSizes.xl,
          width: '80%',
          maxWidth: 380,
        },
        content: {
          marginBottom: theme.variants.spacingSizes.xl,
        },
        headerContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: theme.variants.spacingSizes.sm,
        },
        iconContainer: {
          display: 'flex',
          marginRight: theme.variants.spacingSizes.sm,
        },
        title: {
          color: theme.colors.textPrimary,
          fontSize: theme.variants.fontSizes.lg,
          fontWeight: '600',
          textAlign: 'center',
        },
        message: {
          color: theme.colors.textSecondary,
          fontSize: theme.variants.fontSizes.md,
          fontWeight: '400',
          textAlign: 'left',
        },
        buttonContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: theme.variants.spacingSizes.md,
        },
        button: {
          flex: 1,
          borderRadius: theme.variants.roundButtonSizes.md,
          justifyContent: 'center',
          alignItems: 'center',
        },
        cancelButton: {
          backgroundColor: theme.colors.sheetSecondary,
          height: 32,
          borderWidth: 1,
          borderColor: theme.colors.sheetTertiary,
        },
        confirmButton: {
          height: 32,
          backgroundColor: isEndRecordingModal
            ? theme.colors.iconWarning
            : theme.colors.buttonPrimary,
        },
        buttonText: {
          color: theme.colors.textPrimary,
          fontSize: 13,
          fontWeight: '600',
        },
      }),
    [theme, isEndRecordingModal],
  );
};
