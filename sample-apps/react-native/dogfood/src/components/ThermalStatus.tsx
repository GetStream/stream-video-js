import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThermalState, ThermalStateManager } from './ThermalState';

export const ThermalStatus = () => {
  const [thermalState, setThermalState] = useState<ThermalState>('unknown');

  useEffect(() => {
    // Get initial state
    ThermalStateManager.getCurrentState().then((response) => {
      setThermalState(response.state);
    });

    // Listen for changes
    const subscription = ThermalStateManager.addListener((response) => {
      setThermalState(response.state);
    });

    return () => subscription.remove();
  }, []);

  const getStatusColor = (state: ThermalState): string => {
    switch (state) {
      case 'nominal':
        return '#4CAF50'; // Green
      case 'fair':
        return '#FFC107'; // Yellow
      case 'serious':
        return '#FF9800'; // Orange
      case 'critical':
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Grey
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.indicator,
          { backgroundColor: getStatusColor(thermalState) },
        ]}
      />
      <Text style={styles.text}>
        Device Temperature: <Text style={styles.state}>{thermalState}</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  text: {
    fontSize: 16,
  },
  state: {
    textTransform: 'capitalize',
    fontWeight: 'bold',
  },
});
