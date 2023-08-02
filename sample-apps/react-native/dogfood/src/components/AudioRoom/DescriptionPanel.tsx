import { useCallMetadata, useI18n } from '@stream-io/video-react-native-sdk';
import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';

export const DescriptionPanel = ({ onClose }: { onClose: () => void }) => {
  const metadata = useCallMetadata();
  const custom = metadata?.custom;
  const participantsCount = metadata?.session?.participants?.length ?? 0;
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{custom?.title ?? `<${t('Title')}>`}</Text>
      <Text style={styles.subtitle}>
        {custom?.description ?? `<${t('Description')}>`}
      </Text>
      <Text style={styles.participantsCount}>
        {t('{{ numberOfParticipants }} participant(s) are in the call.', {
          numberOfParticipants: participantsCount,
        })}
      </Text>
      <Pressable
        onPress={onClose}
        style={(state) =>
          state.pressed
            ? [styles.closeButton, { opacity: 0.2 }]
            : styles.closeButton
        }
      >
        <Text style={styles.closeText}>X</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    color: 'black',
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'black',
    paddingVertical: 4,
    fontSize: 14,
  },
  participantsCount: {
    color: 'black',
    fontSize: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 4,
    right: 16,
  },
  closeText: {
    fontSize: 24,
    color: 'black',
  },
});
