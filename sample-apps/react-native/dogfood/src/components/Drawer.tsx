import {
  SendReactionRequest,
  useCall,
  useTheme,
  getLogger,
} from '@stream-io/video-react-native-sdk';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  PanResponder,
  Easing,
} from 'react-native';

import { reactions } from '../constants';

export type DrawerOption = {
  id: string;
  label: string;
  icon?: JSX.Element;
  onPress: () => void;
};

type DrawerProps = {
  isVisible: boolean;
  onClose: () => void;
  options: DrawerOption[];
};

export const Drawer: React.FC<DrawerProps> = ({
  isVisible,
  onClose,
  options,
}) => {
  const screenHeight = Dimensions.get('window').height;
  const drawerHeight = screenHeight * 0.8;
  const styles = useStyles();
  const offset = -70;
  const call = useCall();

  const translateY = useRef<any>(
    new Animated.Value(drawerHeight + offset),
  ).current;

  const SNAP_TOP = offset;
  const SNAP_BOTTOM = drawerHeight + offset;
  const SNAP_MIDDLE = drawerHeight * 0.5;

  const getClosestSnapPoint = (y: number) => {
    const points = [SNAP_TOP, SNAP_MIDDLE, SNAP_BOTTOM];
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
  }, [isVisible]);

  const dragIndicator = (
    <View style={styles.dragIndicator}>
      <View style={styles.dragIndicatorBar} />
    </View>
  );

  const elasticAnimRef = useRef(new Animated.Value(0.5));

  const onCloseReaction = (reaction?: SendReactionRequest) => {
    if (reaction) {
      call?.sendReaction(reaction).catch((e) => {
        const logger = getLogger(['ReactionsPicker']);
        logger('error', 'Error on onClose-sendReaction', e, reaction);
      });
    }
    Animated.timing(elasticAnimRef.current, {
      toValue: 0.2,
      duration: 150,
      useNativeDriver: true,
      easing: Easing.linear,
    }).start(onClose);
  };

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
              {...panResponder.panHandlers}
              style={[styles.container, { transform: [{ translateY }] }]}
            >
              {dragIndicator}
              <View style={styles.emojiRow}>
                {reactions.map((item) => (
                  <View key={item.emoji_code} style={styles.emojiContainer}>
                    <Text
                      style={styles.emojiText}
                      onPress={() => {
                        onCloseReaction({
                          type: item.type,
                          custom: item.custom,
                          emoji_code: item.emoji_code,
                        });
                      }}
                    >
                      {item.icon}
                    </Text>
                  </View>
                ))}
              </View>
              <FlatList
                data={options}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.option}
                    onPress={item.onPress}
                  >
                    {item.icon && (
                      <View style={styles.iconContainer}>{item.icon}</View>
                    )}
                    <Text style={styles.label}>{item.label}</Text>
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
  const { theme } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          justifyContent: 'flex-end',
        },
        safeArea: {
          flex: 1,
          justifyContent: 'flex-end',
        },
        container: {
          backgroundColor: theme.colors.sheetPrimary,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 20,
          maxHeight: '80%',
          marginBottom: 0,
          gap: 10,
        },
        dragIndicator: {
          width: '100%',
          height: 24,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        },
        dragIndicatorBar: {
          width: 40,
          height: 4,
          backgroundColor: '#FFFFFF40',
          borderRadius: 2,
        },
        option: {
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderRadius: 32,
          paddingHorizontal: theme.variants.spacingSizes.md,
          height: 44,
          backgroundColor: theme.colors.buttonSecondaryDefault,
        },
        iconContainer: {
          marginRight: 10,
        },
        label: {
          fontSize: 17,
          color: theme.colors.iconPrimaryDefault,
          fontWeight: '600',
        },
        screen: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        openDrawerButton: {
          padding: 10,
          backgroundColor: '#007AFF',
          borderRadius: 5,
        },
        openDrawerText: {
          color: '#FFF',
          fontWeight: 'bold',
        },
        emojiContainer: {
          width: 42,
          height: 42,
          padding: theme.variants.spacingSizes.xs,
          borderRadius: theme.variants.borderRadiusSizes.lg,
          backgroundColor: theme.colors.buttonSecondaryDefault,
          alignItems: 'center',
          justifyContent: 'center',
        },
        emojiRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
        },
        emojiText: {
          fontSize: 25,
        },
      }),
    [theme],
  );
};
