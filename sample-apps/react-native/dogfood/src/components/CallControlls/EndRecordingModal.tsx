import { useTheme } from '@stream-io/video-react-native-sdk';
import { IconWrapper } from '@stream-io/video-react-native-sdk/src/icons';
import { RecordCall } from '@stream-io/video-react-native-sdk/src/icons/RecordCall';
import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';

interface EndRecordingModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const EndRecordingModal: React.FC<EndRecordingModalProps> = ({
  visible,
  onCancel,
  onConfirm,
}) => {
  const styles = useStyles();
  const {
    theme: { colors, variants },
  } = useTheme();
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <View style={styles.modalView}>
            <View style={styles.content}>
              <View style={styles.headerContainer}>
                <View style={{ display: 'flex', marginRight: 8 }}>
                  <IconWrapper>
                    <RecordCall
                      color={colors.iconAlertWarning}
                      size={variants.roundButtonSizes.sm}
                    />
                  </IconWrapper>
                </View>
                <Text style={styles.title}>End Recording</Text>
              </View>
              <Text style={styles.message}>
                Are you sure you want to end recording?
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.endButton]}
                onPress={onConfirm}
              >
                <Text style={styles.endButtonText}>End Recording</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const useStyles = () => {
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
          backgroundColor: '#1C1C1E',
          borderRadius: 14,
          padding: 20,
          width: '80%',
          maxWidth: 307,
        },
        content: {
          marginBottom: 20,
        },
        headerContainer: {
          flexDirection: 'row', // Arrange the icon and title side by side
          alignItems: 'center',
          marginBottom: 20,
        },

        title: {
          color: 'white',
          fontSize: 17,
          fontWeight: '600',
          textAlign: 'center',
        },
        message: {
          color: '#8E8E93',
          fontSize: 17,
          fontWeight: '400',
          textAlign: 'left',
        },
        buttonContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        button: {
          flex: 1,
          borderRadius: 20,
          // paddingVertical: 8,
          justifyContent: 'center',
          alignItems: 'center',
          marginHorizontal: 5,
        },
        cancelButton: {
          backgroundColor: '#2C2C2E',
          height: 32,
        },
        endButton: {
          height: 32,
          backgroundColor: '#FF453A',
        },
        cancelButtonText: {
          color: 'white',
          fontSize: 13,
          fontWeight: '400',
        },
        endButtonText: {
          color: 'white',
          fontSize: 13,
          fontWeight: '600',
        },
      }),
    [theme],
  );
};
