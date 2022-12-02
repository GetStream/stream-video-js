import { Image, StyleSheet, Text, View } from 'react-native';
import React, { useMemo } from 'react';
import type { StreamVideoParticipant } from '@stream-io/video-client';

type AvatarProps = {
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
};

const DEFAULT_AVATAR_RADIUS = 100;

export const Avatar: React.FC<AvatarProps> = ({
  participant: { user },
  radius = DEFAULT_AVATAR_RADIUS,
}: AvatarProps) => {
  const label = useMemo(
    () => user?.name || user?.id || '?',
    [user?.id, user?.name],
  );
  return (
    <View
      style={{
        ...styles.container,
        borderRadius: radius / 2,
        height: radius,
        width: radius,
      }}
    >
      {user?.imageUrl ? (
        <Image
          source={{
            uri: user.imageUrl,
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
