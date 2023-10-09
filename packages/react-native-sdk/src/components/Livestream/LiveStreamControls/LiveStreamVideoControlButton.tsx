import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';
import React from 'react';
import { useTheme } from '../../../contexts';
import { Pressable, StyleSheet, View } from 'react-native';
import { Video, VideoSlash } from '../../../icons';

export const LiveStreamVideoControlButton = () => {
  const call = useCall();
  const { useCameraState } = useCallStateHooks();
  const { status } = useCameraState();
  const {
    theme: {
      colors,
      variants: { iconSizes, buttonSizes },
    },
  } = useTheme();

  const onPress = async () => {
    await call?.camera.toggle();
  };

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: colors.dark_gray,
          height: buttonSizes.xs,
          width: buttonSizes.xs,
        },
      ]}
    >
      {status === 'enabled' ? (
        <View
          style={[
            styles.icon,
            {
              height: iconSizes.sm,
              width: iconSizes.sm,
            },
          ]}
        >
          <Video color={colors.static_white} />
        </View>
      ) : (
        <View
          style={[
            styles.icon,
            {
              height: iconSizes.sm,
              width: iconSizes.sm,
            },
          ]}
        >
          <VideoSlash color={colors.static_white} />
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  icon: {},
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 4,
  },
});
