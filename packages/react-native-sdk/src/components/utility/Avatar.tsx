import { Image, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import type { StreamVideoParticipant } from '@stream-io/video-client';
import { getInitialsOfName } from '../../utils';
import { ComponentTestIds, ImageTestIds } from '../../constants/TestIds';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Props to be passed for the Avatar component.
 */
export interface AvatarProps {
  /**
   * The participant of which the avatar will be rendered
   */
  participant: StreamVideoParticipant;
  /**
   * The size of the avatar
   * @defaultValue
   * The default value is `100`
   */
  size?: number;
}

/**
 * Shows either user's image or initials based on the user state and existence of
 * their image.
 */
export const Avatar = (props: AvatarProps) => {
  const {
    participant: { userId, image, name },
    size = 100,
  } = props;
  const {
    theme: { avatar, colors, typefaces },
  } = useTheme();
  const userDetails = name || userId;
  const userLabel = userDetails ? getInitialsOfName(userDetails) : '?';

  const imageUrl = image;
  return (
    <View
      testID={ComponentTestIds.PARTICIPANT_AVATAR}
      style={[
        styles.container,
        {
          borderRadius: size / 2,
          height: size,
          width: size,
        },
        {
          backgroundColor: colors.primary,
        },
        avatar.container,
      ]}
    >
      {imageUrl ? (
        <Image
          testID={ImageTestIds.AVATAR}
          source={{
            uri: imageUrl,
          }}
          style={[styles.image, avatar.image]}
        />
      ) : (
        <Text
          style={[
            styles.text,
            { fontSize: size / 2, color: colors.bars },
            typefaces.heading6,
            avatar.text,
          ]}
          numberOfLines={1}
        >
          {userLabel}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    flex: 1,
  },
  text: {
    textAlign: 'center',
  },
});
