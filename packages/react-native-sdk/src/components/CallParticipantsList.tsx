import React, {
  useCallback,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { FlatList, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { ParticipantView } from './ParticipantView';
import {
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { theme } from '../theme';
import { useDebouncedValue } from '../utils/hooks';

type FlatListProps = React.ComponentProps<
  typeof FlatList<StreamVideoParticipant | StreamVideoLocalParticipant>
>;

const VIEWABILITY_CONFIG: FlatListProps['viewabilityConfig'] = {
  waitForInteraction: false,
  itemVisiblePercentThreshold: 60,
};

/**
 * The props for the CallParticipantsList component
 */
interface CallParticipantsListProps {
  /**
   * The list of participants to display in the list
   */
  participants: (StreamVideoParticipant | StreamVideoLocalParticipant)[];
  /**
   * The number of columns to display in the list of participants while in vertical or horizontal scrolling mode
   * @default 2
   */
  numColumns?: number;
  /**
   * If true, the list will be displayed in horizontal scrolling mode
   */
  horizontal?: boolean;
}

/**
 * The CallParticipantsList component displays a list of participants in a FlatList
 * NOTE: this component depends on a flex container to calculate the width and height of the participant view, hence it should be used only in a flex parent container
 */
export const CallParticipantsList = (props: CallParticipantsListProps) => {
  const { numColumns = 2, horizontal, participants } = props;
  const [containerWidth, setContainerWidth] = useState(0);

  // we use a HashSet to track the currently viewable participants
  // and a separate force update state to rerender the component to inform that the HashSet has changed
  // NOTE: we use set instead of array or object for O(1) lookup, add and delete
  const viewableParticipantSessionIds = useRef<Set<string>>(new Set());
  const [_forceUpdateValue, forceUpdate] = useReducer((x) => x + 1, 0);
  const forceUpdateValue = useDebouncedValue(_forceUpdateValue, 500); // we debounce forced value to avoid multiple viewability change continuous rerenders due to callbacks that occurs simultaneously during a large list scroll or when scrolling is completed

  // This is the function that gets called when the user scrolls the list of participants.
  // It updates viewableParticipantSessionIds HashSet with the session IDs
  // of the participants that are currently visible.
  const onViewableItemsChanged = useRef<
    FlatListProps['onViewableItemsChanged']
  >(({ viewableItems }) => {
    // NOTE: viewableItems is more reliable when items are added to the list
    // but it is not reliable when items are removed from the list.
    // Hence we clear the HashSet and add the viewable items to it.
    // We could have also used changed to remove the items from the HashSet one by one, yet we chose to clear the HashSet
    viewableParticipantSessionIds.current.clear();

    // viewableItems: Visible items are the ones that are currently visible on the screen
    viewableItems.forEach((viewToken) => {
      if (viewToken.isViewable) {
        viewableParticipantSessionIds.current.add(viewToken.key);
      }
    });
    if (viewableItems.length) {
      forceUpdate();
    }
  }).current;

  // NOTE: key must be sessionId always as it is used to track viewable participants
  const keyExtractor = useRef<FlatListProps['keyExtractor']>(
    (item) => item.sessionId,
  ).current;

  const onLayout = useRef<FlatListProps['onLayout']>((event) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  }).current;

  const itemContainerStyle = useMemo<StyleProp<ViewStyle>>(() => {
    // we calculate the size of the participant view based on the containerWidth (the phone's screen width),
    // number of columns and the margin between the views
    const size = containerWidth / numColumns - theme.margin.sm * 2;
    const style = { width: size, height: size };
    if (horizontal) {
      return [styles.participantWrapperHorizontal, style];
    }
    return [styles.participantWrapperVertical, style];
  }, [horizontal, numColumns, containerWidth]);

  const renderItem = useCallback<NonNullable<FlatListProps['renderItem']>>(
    ({ item: participant }) => {
      const isVideoViewable = viewableParticipantSessionIds.current.has(
        participant.sessionId,
      );
      console.log(
        'viewableParticipantSessionIds.current >>>>',
        viewableParticipantSessionIds.current,
      );
      console.log('participant.sessionId >>>>', participant.sessionId);

      return (
        <ParticipantView
          participant={participant}
          containerStyle={itemContainerStyle}
          kind="video"
          disableVideo={!isVideoViewable}
        />
      );
    },
    [itemContainerStyle],
  );

  return (
    <FlatList
      onLayout={onLayout}
      key={!horizontal ? numColumns : undefined} // setting numColumns as key is a strict requirement of react-native to support changing numColumns on the fly
      data={participants}
      keyExtractor={keyExtractor}
      viewabilityConfig={VIEWABILITY_CONFIG}
      onViewableItemsChanged={onViewableItemsChanged}
      renderItem={renderItem}
      numColumns={!horizontal ? numColumns : undefined}
      horizontal={horizontal}
      showsHorizontalScrollIndicator={false}
      extraData={`${forceUpdateValue}${containerWidth}`} // this is important to force re-render when visibility changes
    />
  );
};

const styles = StyleSheet.create({
  participantWrapperVertical: {
    margin: theme.margin.sm,
    overflow: 'hidden',
    borderRadius: theme.rounded.sm,
  },
  participantWrapperHorizontal: {
    marginHorizontal: theme.margin.sm,
    overflow: 'hidden',
    borderRadius: theme.rounded.sm,
  },
});
