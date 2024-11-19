import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, NativeModules } from 'react-native';
import { useTheme } from '@stream-io/video-react-native-sdk';

const { ThermalModule } = NativeModules;

export const ThermalInfo = () => {
  const [thermalStatus, setThermalStatus] = useState<string>('Unknown');
  const { theme } = useTheme();

  useEffect(() => {
    const checkThermalStatus = async () => {
      if (Platform.OS === 'android') {
        try {
          const status = await ThermalModule.getCurrentThermalStatus();
          setThermalStatus(status);
        } catch (error) {
          console.error('Failed to get thermal status:', error);
          setThermalStatus('Error');
        }
      }
    };

    checkThermalStatus();
    const interval = setInterval(checkThermalStatus, 5000);

    return () => clearInterval(interval);
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
