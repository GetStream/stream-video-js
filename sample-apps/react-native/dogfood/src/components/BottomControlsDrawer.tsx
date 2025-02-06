import {
  SendReactionRequest,
  useCall,
  useTheme,
  getLogger,
} from '@stream-io/video-react-native-sdk';
import { defaultEmojiReactions } from '@stream-io/video-react-native-sdk/src/constants';

import React, { useEffect, useMemo, useRef } from 'react';
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
import { BOTTOM_CONTROLS_HEIGHT } from '../constants';
import RaiseHand from '../assets/RaiseHand';
import { CallStats } from './CallStats';

export type DrawerOption = {
  id: string;
  label: string;
  icon?: JSX.Element;
  onPress: () => void;
};

type DrawerProps = {
  isVisible: boolean;
  showCallStats: boolean;
  onClose: () => void;
  options: DrawerOption[];
};

export const BottomControlsDrawer: React.FC<DrawerProps> = ({
  isVisible,
  showCallStats,
  onClose,
  options,
}) => {
  const { theme } = useTheme();
  const screenHeight = Dimensions.get('window').height;
  const drawerHeight = screenHeight * 0.8;
  const styles = useStyles();
  const call = useCall();

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

  const dragIndicator = (
    <View style={styles.dragIndicator}>
      <View style={styles.dragIndicatorBar} />
    </View>
  );

  const emojiReactions = (
    <View style={styles.emojiRow}>
      {defaultEmojiReactions.map((item) => (
        <View key={item.emoji_code} style={styles.emojiContainer}>
          <TouchableOpacity
            onPress={() => {
              onCloseReaction({
                type: item.type,
                custom: item.custom,
                emoji_code: item.emoji_code,
              });
            }}
          >
            <Text style={styles.emojiText}>{item.icon}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const raiseHand = (
    <TouchableOpacity
      style={styles.raiseHand}
      onPress={() => {
        onCloseReaction({
          type: 'raised-hand',
          emoji_code: ':raised-hand:',
          custom: {},
        });
      }}
    >
      <Text style={styles.handIconContainer}>
        <RaiseHand
          color={theme.colors.iconPrimary}
          size={theme.variants.roundButtonSizes.sm}
        />
      </Text>
      <Text style={styles.label}>{'Raise hand'}</Text>
    </TouchableOpacity>
  );

  const otherButtons = (
    <FlatList
      data={options}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.option} onPress={item.onPress}>
          {item.icon && <View style={styles.iconContainer}>{item.icon}</View>}
          <Text style={styles.label}>{item.label}</Text>
        </TouchableOpacity>
      )}
    />
  );
  const moreActions = (
    <>
      {emojiReactions}
      {raiseHand}
      {otherButtons}
    </>
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
              {...panResponder.panHandlers}
              style={[styles.container, { transform: [{ translateY }] }]}
            >
              {dragIndicator}
              {!showCallStats && moreActions}
              {showCallStats && <CallStats showCodecInfo />}
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
        emojiContainer: {
          width: variants.roundButtonSizes.lg,
          height: variants.roundButtonSizes.lg,
          padding: variants.spacingSizes.xs,
          borderRadius: variants.borderRadiusSizes.lg,
          backgroundColor: colors.buttonSecondary,
          marginBottom: variants.spacingSizes.sm,
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
        raiseHand: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.sheetTertiary,
          borderRadius: variants.borderRadiusSizes.lg,
          paddingHorizontal: variants.spacingSizes.md,
          height: variants.roundButtonSizes.lg,
          backgroundColor: colors.buttonSecondary,
          marginBottom: variants.spacingSizes.sm,
        },
        iconContainer: {
          marginRight: variants.spacingSizes.sm,
        },
        handIconContainer: {
          marginRight: variants.spacingSizes.sm,
          marginTop: variants.spacingSizes.xs,
        },
        label: {
          fontSize: variants.fontSizes.md,
          color: colors.iconPrimary,
          fontWeight: '600',
        },
        screen: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }),
    [variants, colors],
  );
};
