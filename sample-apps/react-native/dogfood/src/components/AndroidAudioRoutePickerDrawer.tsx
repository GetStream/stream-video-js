import {
  AudioDeviceStatus,
  callManager,
  useTheme,
} from '@stream-io/video-react-native-sdk';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Image,
  Modal,
  PanResponder,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import { BOTTOM_CONTROLS_HEIGHT } from '../constants';

type DrawerProps = {
  isVisible: boolean;
  onClose: () => void;
};

const endpointNameToIconImage = (endPointName: string) => {
  switch (endPointName) {
    case 'Speaker':
      return require('../assets/audio-routes/volume_up_24dp.png');
    case 'Earpiece':
      return require('../assets/audio-routes/call_24dp.png');
    case 'Wired Headset':
      return require('../assets/audio-routes/headphones_24dp.png');
    default:
      return require('../assets/audio-routes/bluetooth_connected_24dp.png');
  }
};

export const AndroidAudioRoutePickerDrawer: React.FC<DrawerProps> = ({
  isVisible,
  onClose,
}) => {
  const screenHeight = useWindowDimensions().height;
  const drawerHeight = screenHeight * 0.8;
  const styles = useStyles();

  const [audioDeviceStatus, setAudioDeviceStatus] =
    useState<AudioDeviceStatus>();

  useEffect(() => {
    callManager.android.getAudioDeviceStatus().then(setAudioDeviceStatus);
    return callManager.android.addAudioDeviceChangeListener(
      setAudioDeviceStatus,
    );
  }, []);

  const audioRoutes = audioDeviceStatus?.devices ?? [];
  const selectedAudioDeviceName = audioDeviceStatus?.selectedDevice;

  // negative offset is needed so the drawer component start above the bottom controls
  const offset = -BOTTOM_CONTROLS_HEIGHT;

  const translateY = useRef<any>(
    new Animated.Value(drawerHeight + offset),
  ).current;

  const SNAP_TOP = offset;
  const SNAP_BOTTOM = (drawerHeight + offset) / 2;
  const getClosestSnapPoint = (y: number) => {
    const points = [SNAP_TOP, SNAP_BOTTOM];
    return points.reduce((prev, curr) =>
      Math.abs(curr - y) < Math.abs(prev - y) ? curr : prev,
    );
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        translateY.setOffset(translateY._value);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        translateY.setValue(gestureState.dy);
      },
      onPanResponderRelease: () => {
        translateY.flattenOffset();
        const currentPosition = translateY._value;
        const snapPoint = getClosestSnapPoint(currentPosition);

        if (snapPoint === SNAP_BOTTOM) {
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: snapPoint,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    }),
  ).current;

  useEffect(() => {
    if (isVisible) {
      callManager.android.getAudioDeviceStatus().then(setAudioDeviceStatus);
      Animated.spring(translateY, {
        toValue: SNAP_TOP,
        useNativeDriver: true,
        bounciness: 4,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SNAP_BOTTOM,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, SNAP_BOTTOM, SNAP_TOP, translateY]);

  const elasticAnimRef = useRef(new Animated.Value(0.5));

  const handleOptionPress = (route: string) => {
    callManager.android.selectAudioDevice(route);
    Animated.timing(elasticAnimRef.current, {
      toValue: 0.2,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.linear,
    }).start(onClose);
  };

  const dragIndicator = (
    <View style={styles.dragIndicator}>
      <View style={styles.dragIndicatorBar} />
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            <Animated.View
              style={[styles.container, { transform: [{ translateY }] }]}
            >
              <View {...panResponder.panHandlers}>{dragIndicator}</View>
              <FlatList
                data={audioRoutes}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.optionContainer}
                    onPress={() => handleOptionPress(item)}
                  >
                    <Image
                      style={styles.routeIcon}
                      source={endpointNameToIconImage(item)}
                    />
                    <Text style={styles.label}>{item}</Text>
                    {item === selectedAudioDeviceName && (
                      <Text style={styles.selectedIcon}>✓</Text> // Checkmark for selected item
                    )}
                  </TouchableOpacity>
                )}
              />
            </Animated.View>
          </SafeAreaView>
        </View>
      </TouchableWithoutFeedback>
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
        optionContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderColor: colors.sheetTertiary,
          padding: variants.spacingSizes.md,
          marginBottom: variants.spacingSizes.xs,
        },
        routeIcon: {
          width: 24,
          height: 24,
          marginHorizontal: 8,
        },
        selectedIcon: {
          marginLeft: 'auto', // Push checkmark to the right
          color: colors.iconSuccess,
          fontSize: 20,
          fontWeight: 'bold',
        },
        overlay: {
          flex: 1,
          justifyContent: 'flex-end',
        },
        safeArea: {
          flex: 1,
          justifyContent: 'flex-end',
        },
        container: {
          backgroundColor: colors.sheetPrimary,
          borderTopLeftRadius: variants.borderRadiusSizes.lg,
          borderTopRightRadius: variants.borderRadiusSizes.lg,
          padding: variants.spacingSizes.md,
          maxHeight: '80%',
          maxWidth: 500,
        },
        dragIndicator: {
          width: '100%',
          height: variants.spacingSizes.xs,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: variants.spacingSizes.md,
        },
        dragIndicatorBar: {
          width: 36,
          height: 5,
          backgroundColor: colors.buttonSecondary,
          borderRadius: 2,
        },
        option: {
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.sheetTertiary,
          borderRadius: variants.borderRadiusSizes.lg,
          paddingHorizontal: variants.spacingSizes.md,
          height: variants.roundButtonSizes.lg,
          backgroundColor: colors.buttonSecondary,
          marginBottom: variants.spacingSizes.xs,
        },
        label: {
          fontSize: variants.fontSizes.lg,
          color: colors.iconPrimary,
          fontWeight: '600',
        },
      }),
    [variants, colors],
  );
};
