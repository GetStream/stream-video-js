import { Image, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import type { StreamVideoParticipant } from '@stream-io/video-client';
import { getInitialsOfName } from '../../utils';
import { theme } from '../../theme';
import { A11yComponents, A11yImages } from '../../constants/A11yLabels';

/**
 * Props to be passed for the Avatar component.
 */
export interface AvatarProps {
  /**
   * The participant of which the avatar will be rendered
   */
  participant: StreamVideoParticipant;
  /**
   * The radius of the avatar
   * @defaultValue
   * The default value is `100`
   */
  radius?: number;
}

const DEFAULT_AVATAR_RADIUS = theme.avatar.sm;

/**
 * Shows either user's image or initials based on the user state and existence of
 * their image.
 */
export const Avatar = (props: AvatarProps) => {
  const {
    participant: { userId, image, name },
    radius = DEFAULT_AVATAR_RADIUS,
  } = props;

  const userDetails = name || userId;
  const userLabel = userDetails ? getInitialsOfName(userDetails) : '?';

  const imageUrl = image;
  return (
    <View
      accessibilityLabel={A11yComponents.PARTICIPANT_AVATAR}
      style={{
        ...styles.container,
        borderRadius: radius / 2,
        height: radius,
        width: radius,
      }}
    >
      {imageUrl ? (
        <Image
          accessibilityLabel={A11yImages.AVATAR}
          source={{
            uri: imageUrl,
          }}
          style={styles.image}
        />
      ) : (
        <Text
          style={{ ...styles.text, fontSize: radius / 2 }}
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
    backgroundColor: theme.light.primary,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    flex: 1,
  },
  text: {
    color: theme.light.bars,
    textAlign: 'center',
    ...theme.fonts.heading4,
  },
});
