import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  NativeModules,
  NativeEventEmitter,
} from 'react-native';
import { useTheme } from '@stream-io/video-react-native-sdk';

const { ThermalModule } = NativeModules;

const thermalEventEmitter = new NativeEventEmitter(ThermalModule);

export const ThermalInfo = () => {
  const [thermalStatus, setThermalStatus] = useState<string>('Unknown');
  const { theme } = useTheme();

  useEffect(() => {
    if (Platform.OS === 'android') {
      // Start listening to thermal status updates
      ThermalModule.startThermalStatusUpdates()
        .then((initialStatus: string) => setThermalStatus(initialStatus))
        .catch((error: any) => {
          console.error('Failed to start thermal status updates:', error);
          setThermalStatus('Error');
        });

      // Subscribe to thermal status changes
      const subscription = thermalEventEmitter.addListener(
        ThermalModule.THERMAL_EVENT,
        (status: string) => setThermalStatus(status),
      );

      // Cleanup
      return () => {
        subscription.remove();
        ThermalModule.stopThermalStatusUpdates();
      };
    }
  }, []);

  const getStatusColor = () => {
    switch (thermalStatus) {
      case 'NONE':
      case 'LIGHT':
        return '#4CAF50';
      case 'MODERATE':
        return '#FFC107';
      case 'SEVERE':
      case 'CRITICAL':
        return '#F44336';
      case 'EMERGENCY':
      case 'SHUTDOWN':
        return '#D32F2F';
      default:
        return theme.colors.textLowEmphasis;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: 'white' }]}>Thermal Status</Text>
      <Text style={[styles.status, { color: getStatusColor() }]}>
        {thermalStatus}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 8,
    marginVertical: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
