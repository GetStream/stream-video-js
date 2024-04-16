import {
  LiveIndicator,
  FollowerCount,
} from '@stream-io/video-react-native-sdk';
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetModalProvider,
  useBottomSheetInternal,
} from '@gorhom/bottom-sheet';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { appTheme } from '../../theme';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Channel, MessageInput, MessageList } from 'stream-chat-react-native';
import { Channel as ChannelType } from 'stream-chat';
import { StreamChatGenerics } from '../../../types';
import { Cross } from '../../assets/Cross';
import { useChatContext } from 'stream-chat-react-native';
import { FlatList as GestureHandlerFlatlist } from 'react-native-gesture-handler';

/**
 * Patch the safe area insets to have a default bottom value if the bottom insets are not provided.
 */
const patchSafeAreaInsets = (insets: { top: number; bottom: number }) => {
  return {
    top: insets.top,
    bottom: insets.bottom ? insets.bottom : 8,
  };
};

const BottomSheetHandleComponent = ({ onClose }: { onClose: () => void }) => {
  return (
    <View
      style={[
        styles.handleContainer,
        { backgroundColor: appTheme.colors.static_grey },
      ]}
    >
      <Text
        style={[styles.handleText, { color: appTheme.colors.static_white }]}
      >
        Live Chat
      </Text>
      <View style={styles.liveContainer}>
        <LiveIndicator />
        <FollowerCount />
      </View>
      <TouchableOpacity onPress={onClose}>
        <Cross
          color={appTheme.colors.static_white}
          style={styles.handleCloseButton}
        />
      </TouchableOpacity>
    </View>
  );
};

type Props = React.PropsWithChildren<{
  onBottomSheetClose: () => void;
  onBottomSheetOpen: () => void;
  callId: string;
}>;

export type BottomSheetWrapperMethods = {
  open: () => void;
  close: () => void;
};

/**
 * A common wrapper component that wraps the chat component in a bottom sheet.
 * This component is used in both the host and viewer live stream screens.
 */
const BottomSheetChatWrapper = React.forwardRef<
  BottomSheetWrapperMethods,
  Props
>((props, ref) => {
  const { onBottomSheetClose, onBottomSheetOpen, callId, children } = props;
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const safeAreaInsets = patchSafeAreaInsets(useSafeAreaInsets());
  const { client: chatClient } = useChatContext();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(() => {
    if (windowHeight >= windowWidth) {
      return ['50%'];
    } else {
      return ['75%'];
    }
  }, [windowHeight, windowWidth]);
  const sheetHeight = windowHeight - safeAreaInsets.top - safeAreaInsets.bottom;
  const currentPosition = useSharedValue(sheetHeight);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      height: currentPosition.value,
    };
  });

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onBottomSheetClose();
        currentPosition.value = withTiming(sheetHeight);
      } else {
        onBottomSheetOpen();
        currentPosition.value = withTiming(sheetHeight * 0.5);
      }
    },
    [currentPosition, sheetHeight, onBottomSheetClose, onBottomSheetOpen],
  );

  // on portrait and landscape mode switch, close the bottom sheet if it was open
  useEffect(() => {
    bottomSheetModalRef.current?.forceClose();
    setTimeout(() => {
      // also reset the height, small delay added to wait for close to happen
      currentPosition.value = withTiming(sheetHeight);
    }, 1000);
  }, [currentPosition, sheetHeight]);

  const chatChannel = useMemo(() => {
    return chatClient.channel('livestream', callId);
  }, [callId, chatClient]);

  // This function is to bring back the bottom sheet to the initial snap point for iOS when the focus is outside message input
  const focusOutsideMessageInput = () => {
    bottomSheetModalRef.current?.snapToIndex(0);
  };

  useImperativeHandle(ref, () => ({
    open: () => {
      bottomSheetModalRef.current?.present();
    },
    close: () => {
      bottomSheetModalRef.current?.close();
    },
  }));

  const CustomBottomSheetHandleComponent = useCallback(() => {
    return (
      <BottomSheetHandleComponent
        onClose={() => {
          // close the bottom sheet
          bottomSheetModalRef.current?.close();
        }}
      />
    );
  }, []);

  return (
    <BottomSheetModalProvider>
      <View
        style={[
          styles.container,
          {
            paddingTop: safeAreaInsets.top,
            paddingBottom: safeAreaInsets.bottom,
          },
        ]}
      >
        <Animated.View style={animatedStyles}>{children}</Animated.View>
      </View>
      <BottomSheetModal
        enablePanDownToClose={true}
        handleComponent={CustomBottomSheetHandleComponent}
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
      >
        <BottomSheetView
          style={[
            styles.chatBottomSheetContainer,
            { paddingBottom: safeAreaInsets.bottom },
          ]}
        >
          <LivestreamChat
            channel={chatChannel}
            focusOutsideMessageInput={focusOutsideMessageInput}
          />
        </BottomSheetView>
      </BottomSheetModal>
    </BottomSheetModalProvider>
  );
});

type LivestreamChatProps = {
  channel: ChannelType<StreamChatGenerics>;
  focusOutsideMessageInput: () => void;
};

const LivestreamChat = ({
  channel,
  focusOutsideMessageInput,
}: LivestreamChatProps) => {
  const { shouldHandleKeyboardEvents } = useBottomSheetInternal();

  /**
   * Done as per the text input behaviour from BottomSheetTextInput(https://github.com/gorhom/react-native-bottom-sheet/blob/master/src/components/bottomSheetTextInput/BottomSheetTextInput.tsx)
   * to solve the issue around keyboard hiding the text input in the chat inside bottom sheet.
   * The tip in https://ui.gorhom.dev/components/bottom-sheet/keyboard-handling/ is followed.
   */
  useEffect(() => {
    return () => {
      // Reset the flag on unmount
      shouldHandleKeyboardEvents.value = false;
    };
  }, [shouldHandleKeyboardEvents]);

  return (
    <View style={styles.chatContainer}>
      <Channel
        // On Android, the default behaviour is as expected so we do not need to apply the fix to the text input to work with keyboard.
        additionalTextInputProps={
          Platform.OS === 'ios'
            ? {
                // Done as per https://ui.gorhom.dev/components/bottom-sheet/keyboard-handling/ to solve keyboard hiding the text input in the chat inside bottom sheet.
                onBlur: () => {
                  shouldHandleKeyboardEvents.value = false;
                  focusOutsideMessageInput();
                },
                onFocus: () => {
                  shouldHandleKeyboardEvents.value = true;
                },
              }
            : {}
        }
        // Hides the sticky date header component on the top of the MessageList
        hideStickyDateHeader={true}
        channel={channel}
        onLongPressMessage={() => null}
      >
        {/**
         * GestureHandler FlatList needs to be passed for scrolling to work inside bottom sheet
         * ref: https://ui.gorhom.dev/components/bottom-sheet/troubleshooting/#adding-horizontal-flatlist-or-scrollview-is-not-working-properly-on-android
         */}
        {/* @ts-expect-error typing error is expected and can be ignored */}
        <MessageList FlatList={GestureHandlerFlatlist} />
        <MessageInput InputButtons={undefined} />
      </Channel>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.static_grey,
  },
  chatBottomSheetContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: appTheme.colors.dark_gray,
  },
  chatContainer: {
    width: '100%',
  },
  handleContainer: {
    flexDirection: 'row',
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  handleCloseButton: {
    height: 16,
    width: 16,
  },
  handleText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  liveContainer: {
    flexDirection: 'row',
  },
});

export default BottomSheetChatWrapper;
