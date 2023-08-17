import React, { useCallback, useState } from 'react';
import {
  useCall,
  CallContent,
  StreamReaction,
  ParticipantReactionProps,
} from '@stream-io/video-react-native-sdk';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ParticipantsInfoList } from './ParticipantsInfoList';
import {
  CallControlsComponent,
  CallControlsComponentProps,
} from './CallControlsComponent';
import { appTheme } from '../theme';
import { Z_INDEX } from '../constants';
import { ParticipantsLayoutSwitchButton } from './ParticipantsLayoutButton';

type ActiveCallProps = CallControlsComponentProps & {
  onBackPressed?: () => void;
};

const CustomParticipantReaction = ({
  participant,
}: ParticipantReactionProps) => {
  const { reaction } = participant;
  type Reaction = StreamReaction & { icon: string };
  const supportedReactions: Reaction[] = [
    {
      type: 'reaction',
      emoji_code: ':like:',
      custom: {},
      icon: '👍',
    },
    {
      type: 'raised-hand',
      emoji_code: ':raise-hand:',
      custom: {},
      icon: '✋',
    },
    {
      type: 'reaction',
      emoji_code: ':fireworks:',
      custom: {},
      icon: '🎉',
    },
  ];

  const currentReaction =
    reaction &&
    supportedReactions.find(
      (supportedReaction) =>
        supportedReaction.emoji_code === reaction.emoji_code,
    );

  return (
    <View style={styles.background}>
      <Text style={styles.reaction}>{currentReaction?.icon}</Text>
    </View>
  );
};

type Layout = 'grid' | 'spotlight';

const CallTopViewComponent = ({
  selectedLayout,
  setSelectedLayout,
}: {
  selectedLayout: Layout;
  setSelectedLayout: React.Dispatch<React.SetStateAction<Layout>>;
}) => {
  return (
    <View style={styles.topView}>
      <ParticipantsLayoutSwitchButton
        selectedLayout={selectedLayout}
        setSelectedLayout={setSelectedLayout}
      />
    </View>
  );
};

export const ActiveCall = ({
  onChatOpenHandler,
  onBackPressed,
  onHangupCallHandler,
  unreadCountIndicator,
}: ActiveCallProps) => {
  const [isCallParticipantsVisible, setIsCallParticipantsVisible] =
    useState<boolean>(false);
  const [selectedLayout, setSelectedLayout] = useState<Layout>('grid');
  const call = useCall();

  const onOpenCallParticipantsInfo = () => {
    setIsCallParticipantsVisible(true);
  };

  const CustomControlsComponent = useCallback(() => {
    return (
      <CallControlsComponent
        onHangupCallHandler={onHangupCallHandler}
        onChatOpenHandler={onChatOpenHandler}
        unreadCountIndicator={unreadCountIndicator}
      />
    );
  }, [onChatOpenHandler, onHangupCallHandler, unreadCountIndicator]);

  const CustomCallTopView = useCallback(() => {
    return (
      <CallTopViewComponent
        selectedLayout={selectedLayout}
        setSelectedLayout={setSelectedLayout}
      />
    );
  }, [selectedLayout, setSelectedLayout]);

  if (!call) {
    return <ActivityIndicator size={'large'} style={StyleSheet.absoluteFill} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <CallContent
        layout={selectedLayout}
        onBackPressed={onBackPressed}
        onParticipantInfoPress={onOpenCallParticipantsInfo}
        CallControls={CustomControlsComponent}
        CallTopView={CustomCallTopView}
        // ParticipantNetworkQualityIndicator={CustomNetworkQualityIndicator}
      />
      <ParticipantsInfoList
        isCallParticipantsInfoVisible={isCallParticipantsVisible}
        setIsCallParticipantsInfoVisible={setIsCallParticipantsVisible}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: appTheme.colors.dark_gray,
    flex: 1,
  },
  background: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: Z_INDEX.IN_FRONT,
  },
  reaction: {
    fontSize: 50,
  },
  container1: {
    backgroundColor: 'gray',
    borderRadius: 5,
    alignSelf: 'center',
    padding: 5,
  },
  connection: {
    fontSize: 10,
  },
  topView: {
    width: '100%',
    backgroundColor: 'transparent',
    alignItems: 'center',
    paddingVertical: 20,
  },
});
