import {
  SendVideoReactionRequest,
  useCall,
  useTheme,
} from '@stream-io/video-react-native-sdk';
import { defaultEmojiReactions } from '@stream-io/video-react-native-sdk/src/constants';

import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import RaiseHand from '../../../assets/RaiseHand';
import { CallStats } from '../../CallStats';
import { VideoFilters } from '../../VideoEffects';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@stream-io/video-react-native-sdk/src/components';

export type DrawerOption = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
};

type DrawerProps = {
  isVisible: boolean;
  showCallStats: boolean;
  onClose: () => void;
  options: DrawerOption[];
  bottomControlsHeight: number;
};

export const BottomControlsDrawer: React.FC<DrawerProps> = ({
  isVisible,
  showCallStats,
  onClose,
  options,
  bottomControlsHeight,
}) => {
  const {
    theme: { semantics, insets, components },
  } = useTheme();
  const screenHeight = Dimensions.get('window').height;
  const drawerHeight = screenHeight * 0.8;
  const styles = useStyles();
  const call = useCall();

  // negative offset to position the drawer component above the bottom controls
  const callContentPaddingBottom = insets.bottom;
  const offset = -bottomControlsHeight - callContentPaddingBottom;

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

  const onCloseReaction = (reaction?: SendVideoReactionRequest) => {
    if (reaction) {
      call?.sendReaction(reaction).catch((e) => {
        console.log('Error on onClose-sendReaction: ', e);
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
    <ScrollView
      horizontal
      style={styles.emojiRow}
      contentContainerStyle={styles.emojiRowContent}
    >
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
    </ScrollView>
  );

  const raiseHand = (
    <Button
      style={styles.raiseHand}
      text={'Raise hand'}
      size="large"
      leftAccessory={() => (
        <RaiseHand
          color={semantics.textOnAccent}
          size={components.iconSizeSm}
        />
      )}
      onPress={() => {
        onCloseReaction({
          type: 'raised-hand',
          emoji_code: ':raised-hand:',
          custom: {},
        });
      }}
    />
  );

  const filtersRow = <VideoFilters onSelectFilter={onClose} />;

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
      {filtersRow}
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
        <SafeAreaProvider>
          <SafeAreaView style={styles.overlay} edges={[]}>
            <Animated.View
              style={[styles.container, { transform: [{ translateY }] }]}
            >
              <View {...panResponder.panHandlers}>{dragIndicator}</View>
              {!showCallStats && moreActions}
              {showCallStats && <CallStats showCodecInfo />}
            </Animated.View>
          </SafeAreaView>
        </SafeAreaProvider>
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
        overlay: {
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
        emojiContainer: {
          width: 40,
          height: 48,
          alignItems: 'center',
          justifyContent: 'center',
        },
        emojiRow: {
          height: 48,
          marginBottom: 8,
        },
        emojiRowContent: {
          gap: 16,
        },
        emojiText: {
          fontSize: 25,
        },
        option: {
          flexDirection: 'row',
          alignItems: 'center',
          height: 48,
          paddingHorizontal: primitives.spacingSm,
        },
        raiseHand: {
          marginBottom: 24,
        },
        iconContainer: {
          marginRight: primitives.spacingSm,
        },
        handIconContainer: {
          marginRight: primitives.spacingSm,
          marginTop: primitives.spacingXs,
        },
        label: {
          fontSize: primitives.typographyFontSizeMd,
          color: semantics.textPrimary,
          fontWeight: primitives.typographyFontWeightRegular,
        },
        screen: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }),
    [primitives, semantics],
  );
};
