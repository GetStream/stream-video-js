import { Image, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import type { StreamVideoParticipant } from '@stream-io/video-client';
import { getInitialsOfName } from '../utils';
import { theme } from '../theme';
import { A11yComponents, A11yImages } from '../constants/A11yLabels';

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
 *
 * | User's Image | User's Initials |
 * | :--- | :----: |
 * |![avatar-1](https://user-images.githubusercontent.com/25864161/217467045-2d4c8b4e-d4ec-48c1-8ede-4468854826af.png) | ![avatar-2](https://user-images.githubusercontent.com/25864161/217467043-e7a7f2a1-70a7-4d83-8d1e-6463391194ae.png)|
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
    alignSelf: 'center',
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
