import React, { useEffect, useReducer, useRef } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import { ParticipantView } from './ParticipantView';
import { LocalVideoView } from './LocalVideoView';
import { useRemoteParticipants } from '@stream-io/video-react-bindings';
import { StreamVideoParticipant } from '@stream-io/video-client';
import { theme } from '../theme';
import { useDebounce } from '../utils/hooks';

type FlatListProps = React.ComponentProps<
  typeof FlatList<StreamVideoParticipant>
>;

const VIEWABILITY_CONFIG: FlatListProps['viewabilityConfig'] = {
  minimumViewTime: 500, // we wait at least 1 second before marking a participant as viewable, this is to avoid too early marking of participants as viewable when the list is scrolled quickly
  waitForInteraction: false,
  itemVisiblePercentThreshold: 75,
};

interface CallParticipantsViewProps {
  /**
   * The number of columns to display in the list of participants
   * @default 2
   */
  numColumns?: number;
}

export const CallParticipantsView = (props: CallParticipantsViewProps) => {
  const { numColumns = 2 } = props;
  const _remoteParticipants = useRemoteParticipants();
  const remoteParticipants = useDebounce(_remoteParticipants, 300); // we debounce the remote participants to avoid unnecessary rerenders that happen when participant tracks are all subscribed simultaneously
  const isUserAloneInCall = remoteParticipants?.length === 0;

  // we use a HashSet to track the currently viewable participants
  // and a separate force update state to rerender the component to inform that the HashSet has changed
  // NOTE: we use set instead of array or object for O(1) lookup, add and delete
  const viewableParticipantSessionIds = useRef<Set<string>>(new Set());
  const [_forceUpdateValue, forceUpdate] = useReducer((x) => x + 1, 0);
  const forceUpdateValue = useDebounce(_forceUpdateValue, 300); // we debounce forced value to avoid multiple viewability change rerender due to callback that occurs simultaneously when a large list scroll is completed

  // we use window dimensions to calculate the height of the participant view and hook gets called only when the window dimensions change
  const { width: windowWidth } = useWindowDimensions();

  const onViewableItemsChanged = useRef<
    FlatListProps['onViewableItemsChanged']
  >(({ changed }) => {
    changed.forEach((viewToken) => {
      if (viewToken.isViewable) {
        if (viewableParticipantSessionIds.current.has(viewToken.key)) return;
        viewableParticipantSessionIds.current.add(viewToken.key);
      } else {
        viewableParticipantSessionIds.current.delete(viewToken.key);
      }
    });
    if (changed.length) {
      forceUpdate();
    }
  }).current;

  // NOTE: key must be sessionId always as it is used to track viewable participants
  const keyExtractor = useRef<FlatListProps['keyExtractor']>(
    (item) => item.sessionId,
  ).current;

  const renderItem = useRef<FlatListProps['renderItem']>(
    ({ item: remoteParticipant }) => {
      const isVideoViewable = viewableParticipantSessionIds.current.has(
        remoteParticipant.sessionId,
      );
      return (
        <ParticipantView
          participant={remoteParticipant}
          containerStyle={[
            styles.participantWrapper,
            { height: windowWidth / numColumns },
          ]}
          kind="video"
          disableVideo={!isVideoViewable}
        />
      );
    },
  ).current;

  if (isUserAloneInCall) return <LocalVideoView layout={'fullscreen'} />;

  return (
    <View style={{ flex: 1 }}>
      <LocalVideoView layout={'floating'} zOrder={2} />
      <FlatList
        key={numColumns} // this is a strict requirement of react-native to support changing numColumns on the fly
        data={remoteParticipants}
        keyExtractor={keyExtractor}
        viewabilityConfig={VIEWABILITY_CONFIG}
        onViewableItemsChanged={onViewableItemsChanged}
        renderItem={renderItem}
        numColumns={numColumns}
        extraData={`${forceUpdateValue}${windowWidth}`} // this is important to force re-render when either of these value change
      />
    </View>
  );
};

const styles = StyleSheet.create({
  participantWrapper: {
    flex: 1,
    margin: theme.margin.sm,
    overflow: 'hidden',
    borderRadius: theme.rounded.sm,
  },
});
