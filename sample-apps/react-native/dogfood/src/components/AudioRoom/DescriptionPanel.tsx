import { useCallMetadata, useI18n } from '@stream-io/video-react-native-sdk';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const DescriptionPanel = () => {
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    marginHorizontal: 32,
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
});
