import { View, Text, StyleSheet } from 'react-native';
import { Language } from '../../../icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useI18n } from '../../../i18n';

export type LobbyHeaderProps = {
  landscape?: boolean;
};

export const LobbyHeader = ({}: LobbyHeaderProps) => {
  const {
    theme: { lobby },
  } = useTheme();
  const { t } = useI18n();

  return (
    <View style={[styles.container, lobby.topContainer]}>
      <Language color={lobby.icon.color} size={24} />
      <Text style={lobby.headerText}>
        {t('lobby.setUpCall.title', 'Set up your call')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});
