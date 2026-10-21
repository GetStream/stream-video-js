import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LiveStreamChat } from '../../assets/LiveStreamChat';
import { useTheme } from '@stream-io/video-react-native-sdk';

type LiveStreamChatControlButtonProps = {
  onPress: () => void;
};

export const LiveStreamChatControlButton = ({
  onPress,
}: LiveStreamChatControlButtonProps) => {
  const {
    theme: { semantics },
  } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: semantics.backgroundCoreApp,
        },
      ]}
    >
      <View style={[styles.icon]}>
        <LiveStreamChat color={semantics.textPrimary} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 4,
    height: 40,
    width: 40,
  },
  icon: {
    height: 20,
    width: 20,
  },
});
