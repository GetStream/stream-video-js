import React, { useCallback, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useI18n } from '@stream-io/video-react-native-sdk';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LiveStreamParamList } from '../../../types';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
import { useCameraPermission } from 'react-native-vision-camera';
import { appTheme } from '../../theme';

type QRScannerScreenProps = NativeStackScreenProps<
  LiveStreamParamList,
  'QRScanner'
>;

export const QRScanner = ({ navigation, route }: QRScannerScreenProps) => {
  const { t } = useI18n();
  const { onScan } = route.params;
  const [hasScanned, setHasScanned] = useState(false);
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (hasScanned || !codes.length) {
        return;
      }
      setHasScanned(true);

      const qrData = codes[0].value;
      if (qrData) {
        try {
          const url = new URL(qrData);
          const id = url.searchParams.get('id');
          if (id) {
            onScan(id);
            safeGoBack(id);
          }
        } catch (error) {
          // If not a valid URL, pass the raw QR data
          onScan(qrData);
          safeGoBack(qrData);
        }
      }
    },
  });

  const safeGoBack = (callId: string) => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('JoinLiveStream', {
        mode: 'viewer',
        scannedCallId: callId,
      });
    }
  };

  const requestCameraPermission = useCallback(async () => {
    await requestPermission();
  }, [requestPermission]);

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>{t('Camera permission is required')}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={requestCameraPermission}
        >
          <Text style={styles.buttonText}>{t('Grant Permission')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>{t('No camera device available')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        device={device}
        isActive={true}
        codeScanner={codeScanner}
      />
      <View style={styles.overlay}>
        <Text style={styles.scanText}>
          {t('Scan a QR code to get the call ID')}
        </Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>{t('Cancel')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.static_grey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  text: {
    color: appTheme.colors.static_white,
    fontSize: 16,
    marginBottom: 20,
  },
  scanText: {
    color: appTheme.colors.static_white,
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  button: {
    backgroundColor: appTheme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: appTheme.colors.static_white,
    fontWeight: '500',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: appTheme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
});
