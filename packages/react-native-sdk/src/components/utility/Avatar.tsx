import { Image, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import type { StreamVideoParticipant } from '@stream-io/video-client';
import { getInitialsOfName } from '../../utils';
import { ComponentTestIds, ImageTestIds } from '../../constants/TestIds';
import { useTheme } from '../../contexts/ThemeContext';
import { Theme } from '../../theme/theme';

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
  /**
   * Custom style to be merged with the avatar.
   * @example
   * ```
   * <Avatar
   *  participant={participant}
   *  style={{
   *   container: {
   *    backgroundColor: 'red',
   *   },
   *   image: {
   *    borderRadius: 10,
   *   },
   *   text: {
   *     color: 'white',
   *   },
   *   }}
   * />
   */
  style?: Theme['avatar'];
}

/**
 * Shows either user's image or initials based on the user state and existence of
 * their image.
 */
export const Avatar = (props: AvatarProps) => {
  const {
    participant: { userId, image, name },
    size = 100,
    style: styleProp,
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
        styleProp?.container,
      ]}
    >
      {imageUrl ? (
        <Image
          testID={ImageTestIds.AVATAR}
          source={{
            uri: imageUrl,
          }}
          style={[styles.image, avatar.image, styleProp?.image]}
        />
      ) : (
        <Text
          style={[
            styles.text,
            { fontSize: size / 2, color: colors.bars },
            typefaces.heading6,
            avatar.text,
            styleProp?.text,
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
