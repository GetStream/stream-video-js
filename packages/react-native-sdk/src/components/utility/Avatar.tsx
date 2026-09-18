import { Image, ImageStyle, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { getInitialsOfName } from '../../utils';
import { ComponentTestIds, ImageTestIds } from '../../constants/TestIds';
import { DeepPartial, useTheme } from '../../contexts/ThemeContext';
import { AvatarSize, type Theme } from '../../theme/theme';

export type AvatarUser =
  | { id: string; name?: string; image?: string }
  | { userId: string; name?: string; image?: string };

/**
 * Reads the identifier off whichever of the two accepted shapes was passed.
 */
const getUserId = (user: AvatarUser | undefined) => {
  if (!user) {
    return undefined;
  }
  return 'id' in user ? user.id : user.userId;
};

type AvatarBaseProps = {
  /**
   * The size of the avatar
   * @defaultValue
   * The default value is `2xl`
   */
  size?: AvatarSize;
  /**
   * Custom style to be merged with the avatar.
   * @example
   * ```
   * <Avatar
   *  user={user}
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
  style?: DeepPartial<Theme['avatar']>;
};

/**
 * Props to be passed for the Avatar component.
 */
export type AvatarProps = AvatarBaseProps & {
  /**
   * The user or participant of which the avatar will be rendered.
   */
  user?: AvatarUser;
};

/**
 * Shows either user's image or initials based on the user state and existence of
 * their image.
 */
export const Avatar = ({ user, size = '2xl', style }: AvatarProps) => {
  const {
    theme: { avatar },
  } = useTheme();
  const id = getUserId(user);
  const imageUrl = user?.image;
  const userDetails = user?.name || id;
  const userLabel = userDetails ? getInitialsOfName(userDetails) : '?';

  return (
    <View
      testID={ComponentTestIds.PARTICIPANT_AVATAR}
      style={[
        styles.container,
        avatar.container.base,
        avatar.container[size],
        style?.container?.base,
      ]}
    >
      {imageUrl ? (
        <Image
          testID={ImageTestIds.AVATAR}
          source={{
            uri: imageUrl,
          }}
          style={[
            avatar.container.base as ImageStyle,
            avatar.container[size] as ImageStyle,
          ]}
        />
      ) : (
        <Text
          style={[styles.text, avatar.text.base, avatar.text[size]]}
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
