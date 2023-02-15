import { Image, StyleSheet, Text, View } from 'react-native';
import React, { useMemo } from 'react';
import type { StreamVideoParticipant } from '@stream-io/video-client';

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

const DEFAULT_AVATAR_RADIUS = 100;

export const Avatar = (props: AvatarProps) => {
  const {
    participant: { userId, user },
    radius = DEFAULT_AVATAR_RADIUS,
  } = props;
  const label = useMemo(() => userId || '?', [userId]);
  const imageUrl = user?.image;
  return (
    <View
      style={{
        ...styles.container,
        borderRadius: radius / 2,
        height: radius,
        width: radius,
      }}
    >
      {imageUrl ? (
        <Image
          source={{
            uri: imageUrl,
          }}
          style={styles.image}
        />
      ) : (
        <Text
          style={{ ...styles.text, fontSize: radius / 4 }}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#005fff',
    justifyContent: 'center',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  image: {
    flex: 1,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
