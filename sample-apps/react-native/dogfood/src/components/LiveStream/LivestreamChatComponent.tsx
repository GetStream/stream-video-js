import React from 'react';
import { Pressable, View } from 'react-native';
import { appTheme } from '../../theme';
import { Chat } from '../../assets/Chat';
import { StyleSheet } from 'react-native';

type LiveStreamChatControlButtonProps = {
  handlePresentModalPress: () => void;
};

export const LiveStreamChatControlButton = ({
  handlePresentModalPress,
}: LiveStreamChatControlButtonProps) => {
  return (
    <Pressable
      onPress={handlePresentModalPress}
      style={[
        styles.container,
        {
          backgroundColor: appTheme.colors.dark_gray,
        },
      ]}
    >
      <View style={[styles.icon]}>
        <Chat color={appTheme.colors.static_white} />
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
