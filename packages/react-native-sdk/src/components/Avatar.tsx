import { Image, StyleSheet, Text, View } from 'react-native';
import React, { useMemo } from 'react';
import type { StreamVideoParticipant } from '@stream-io/video-client';

type AvatarProps = {
  participant: StreamVideoParticipant;
  size?: number;
};

export const Avatar = ({ participant: { user } }: AvatarProps) => {
  const label = useMemo(
    () => user?.name || user?.id || '?',
    [user?.id, user?.name],
  );
  return (
    <View
      style={{
        backgroundColor: '#005fff',
        borderRadius: 50,
        height: 100,
        width: 100,
        justifyContent: 'center',
        alignSelf: 'center',
        overflow: 'hidden',
      }}
    >
      {user?.imageUrl ? (
        <Image
          source={{
            uri: user.imageUrl,
          }}
          style={{
            flex: 1,
          }}
        />
      ) : (
        <Text
          style={{
            color: 'white',
            fontSize: 24,
            fontWeight: 'bold',
            textAlign: 'center',
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
    </View>
  );
};

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: '#005fff',
//     borderRadius: 50,
//     height: 100,
//     width: 100,
//     justifyContent: 'center',
//     alignSelf: 'center',
//     overflow: 'hidden',
//   },
//   image: {
//     flex: 1,
//   },
//   text: {
//     color: 'white',
//     fontSize: 24,
//     fontWeight: 'bold',
//     textAlign: 'center',
//   },
// });
