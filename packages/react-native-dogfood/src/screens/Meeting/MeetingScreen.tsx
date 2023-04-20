import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActiveCall, ActiveCallProps } from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList } from '../../../types';
import { SafeAreaView, StyleSheet } from 'react-native';
import { theme } from '@stream-io/video-react-native-sdk/dist/src/theme';
import { ParticipantListButtons } from '../../components/ParticipantListButtons';

type Props = NativeStackScreenProps<MeetingStackParamList, 'MeetingScreen'>;
type Mode = NonNullable<ActiveCallProps['mode']>;

export const MeetingScreen = ({ navigation }: Props) => {
  const onOpenCallParticipantsInfoViewHandler = () => {
    navigation.navigate('CallParticipantsInfoScreen');
  };
  const [selectedMode, setMode] = React.useState<Mode>('grid');

  return (
    <SafeAreaView style={styles.wrapper}>
      <ParticipantListButtons selectedMode={selectedMode} setMode={setMode} />
      <ActiveCall
        onOpenCallParticipantsInfoView={onOpenCallParticipantsInfoViewHandler}
        mode={selectedMode}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.light.static_grey,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
});
