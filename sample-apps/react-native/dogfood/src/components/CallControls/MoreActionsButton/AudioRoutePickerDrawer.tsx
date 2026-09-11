import {
  AudioDeviceEndpointType,
  callManager,
  useAudioDeviceStatus,
  useTheme,
} from '@stream-io/video-react-native-sdk';

import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Image,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

type DrawerProps = {
  isVisible: boolean;
  onClose: () => void;
};

const endpointTypeToIconImage = (type: AudioDeviceEndpointType | undefined) => {
  switch (type) {
    case 'Speaker':
      return require('../../../assets/audio-routes/volume_up_24dp.png');
    case 'Earpiece':
      return require('../../../assets/audio-routes/call_24dp.png');
    case 'Wired Headset':
      return require('../../../assets/audio-routes/headphones_24dp.png');
    default:
      return require('../../../assets/audio-routes/bluetooth_connected_24dp.png');
  }
};

type AudioRoutePickerDrawerProps = DrawerProps & {
  bottomControlsHeight: number;
};

export const AudioRoutePickerDrawer: React.FC<AudioRoutePickerDrawerProps> = ({
  isVisible,
  onClose,
  bottomControlsHeight,
}) => {
  const screenHeight = useWindowDimensions().height;
  const drawerHeight = screenHeight * 0.8;
  const styles = useStyles();
  const {
    theme: { insets },
  } = useTheme();

  const audioDeviceStatus = useAudioDeviceStatus();
  const audioRoutes = audioDeviceStatus?.devices ?? [];
  const selectedDeviceId = audioDeviceStatus?.selectedDeviceId;

  // negative offset is needed so the drawer component start above the bottom controls
  const offset = -bottomControlsHeight - insets.bottom;

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

  const handleOptionPress = (deviceId: string) => {
    callManager.audioDevices.select(deviceId);
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
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.optionContainer}
                    onPress={() => handleOptionPress(item.id)}
                  >
                    <Image
                      style={styles.routeIcon}
                      source={endpointTypeToIconImage(item.type)}
                    />
                    <Text style={styles.label}>{item.name}</Text>
                    {item.id === selectedDeviceId && (
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
    theme: { primitives, semantics },
  } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        optionContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderColor: semantics.backgroundUtilityDisabled,
          padding: primitives.spacingMd,
          marginBottom: primitives.spacingXs,
        },
        routeIcon: {
          width: 24,
          height: 24,
          marginHorizontal: 8,
        },
        selectedIcon: {
          marginLeft: 'auto', // Push checkmark to the right
          color: semantics.accentSuccess,
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
          backgroundColor: semantics.backgroundCoreApp,
          borderTopLeftRadius: primitives.radiusLg,
          borderTopRightRadius: primitives.radiusLg,
          padding: primitives.spacingMd,
          maxHeight: '80%',
          maxWidth: 500,
        },
        dragIndicator: {
          width: '100%',
          height: primitives.spacingXs,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: primitives.spacingMd,
        },
        dragIndicatorBar: {
          width: 36,
          height: 5,
          backgroundColor: semantics.backgroundUtilityDisabled,
          borderRadius: 2,
        },
        option: {
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: semantics.backgroundUtilityDisabled,
          borderRadius: primitives.radiusLg,
          paddingHorizontal: primitives.spacingMd,
          height: primitives.spacingLg,
          backgroundColor: semantics.backgroundCoreApp,
          marginBottom: primitives.spacingXs,
        },
        label: {
          fontSize: primitives.typographyFontSizeLg,
          color: semantics.accentPrimary,
          fontWeight: '600',
        },
      }),
    [primitives, semantics],
  );
};
