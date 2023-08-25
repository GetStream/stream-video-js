import React, {
  useCallback,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { FlatList, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import {
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
  StreamVideoParticipantPatches,
  VisibilityState,
} from '@stream-io/video-client';
import { useDebouncedValue } from '../../../utils/hooks/useDebouncedValue';
import { useCall } from '@stream-io/video-react-bindings';
import { ComponentTestIds } from '../../../constants/TestIds';
import {
  ParticipantView as DefaultParticipantView,
  ParticipantViewComponentProps,
  ParticipantViewProps,
} from '../../Participant/ParticipantView';

type FlatListProps = React.ComponentProps<
  typeof FlatList<StreamVideoParticipant | StreamVideoLocalParticipant>
>;

const VIEWABILITY_CONFIG: FlatListProps['viewabilityConfig'] = {
  waitForInteraction: false,
  itemVisiblePercentThreshold: 60,
};

export type CallParticipantsListComponentProps =
  ParticipantViewComponentProps & {
    /**
     * Component to customize the participant view.
     */
    ParticipantView?: React.ComponentType<ParticipantViewProps> | null;
  };

/**
 * Props of the CallParticipantsList component
 */
export type CallParticipantsListProps = CallParticipantsListComponentProps & {
  /**
   * The list of participants to display in the list
   */
  participants: (StreamVideoParticipant | StreamVideoLocalParticipant)[];
  /**
   * The number of columns to display in the list of participants while in vertical or horizontal scrolling mode. This property is only used when there are more than 2 participants.
   * @default 2
   */
  numberOfColumns?: number;
  /**
   * If true, the list will be displayed in horizontal scrolling mode
   */
  horizontal?: boolean;
};

/**
 * This component displays a list of participants in a FlatList.
 * You can use this component to display participants either in a vertical or horizontal scrolling mode.
 * NOTE: this component depends on a flex container to calculate the width and height of the participant view,
 * hence it should be used only in a flex parent container
 */
export const CallParticipantsList = ({
  numberOfColumns = 2,
  horizontal,
  participants,
  ParticipantView = DefaultParticipantView,
  ParticipantLabel,
  ParticipantNetworkQualityIndicator,
  ParticipantReaction,
  ParticipantVideoFallback,
  VideoRenderer,
}: CallParticipantsListProps) => {
  const [containerLayout, setContainerLayout] = useState({
    width: 0,
    height: 0,
  });

  // we use a HashSet to track the currently viewable participants
  // and a separate force update state to rerender the component to inform that the HashSet has changed
  // NOTE: we use set instead of array or object for O(1) lookup, add and delete
  const viewableParticipantSessionIds = useRef<Set<string>>(new Set());
  const [_forceUpdateValue, forceUpdate] = useReducer((x) => x + 1, 0);
  const forceUpdateValue = useDebouncedValue(_forceUpdateValue, 500); // we debounce forced value to avoid multiple viewability change continuous rerenders due to callbacks that occurs simultaneously during a large list scroll or when scrolling is completed

  // we use a ref to store the active call object
  // so that it can be used in the onViewableItemsChanged callback
  const activeCall = useCall();
  const activeCallRef = useRef(activeCall);
  activeCallRef.current = activeCall;
  // This is the function that gets called when the user scrolls the list of participants.
  // It updates viewableParticipantSessionIds HashSet with the session IDs
  // of the participants that are currently visible.
  const onViewableItemsChanged = useRef<
    FlatListProps['onViewableItemsChanged']
  >(({ viewableItems }) => {
    const participantPatches: StreamVideoParticipantPatches = {};
    let mustUpdate = false;
    const newVisibleParticipantSessionIds = new Set<string>(
      viewableItems.map((v) => v.key),
    );
    const oldVisibleParticipantSessionIds =
      viewableParticipantSessionIds.current;
    newVisibleParticipantSessionIds.forEach((key) => {
      if (!oldVisibleParticipantSessionIds.has(key)) {
        mustUpdate = true;
        participantPatches[key] = {
          viewportVisibilityState: {
            video: VisibilityState.VISIBLE,
            screen: VisibilityState.UNKNOWN,
          },
        };
      }
    });
    oldVisibleParticipantSessionIds.forEach((key) => {
      if (!newVisibleParticipantSessionIds.has(key)) {
        mustUpdate = true;
        participantPatches[key] = {
          viewportVisibilityState: {
            video: VisibilityState.VISIBLE,
            screen: VisibilityState.UNKNOWN,
          },
        };
      }
    });
    viewableParticipantSessionIds.current = newVisibleParticipantSessionIds;
    if (mustUpdate) {
      activeCallRef.current?.state.updateParticipants(participantPatches);
      forceUpdate();
    }
  }).current;

  // NOTE: key must be sessionId always as it is used to track viewable participants
  const keyExtractor = useRef<NonNullable<FlatListProps['keyExtractor']>>(
    (item) => item.sessionId,
  ).current;

  const onLayout = useRef<NonNullable<FlatListProps['onLayout']>>((event) => {
    const { height, width } = event.nativeEvent.layout;
    setContainerLayout((prev) => {
      if (prev.height === height && prev.width === width) {
        return prev;
      }
      return { height, width };
    });
  }).current;

  const { itemHeight, itemWidth } = calculateParticipantViewSize({
    containerHeight: containerLayout.height,
    containerWidth: containerLayout.width,
    participantsLength: participants.length,
    numberOfColumns,
    horizontal,
  });

  const itemContainerStyle = useMemo<StyleProp<ViewStyle>>(() => {
    const style = { width: itemWidth, height: itemHeight };
    if (horizontal) {
      return [styles.participantWrapperHorizontal, style];
    }
    return style;
  }, [itemWidth, itemHeight, horizontal]);

  const participantProps: ParticipantViewComponentProps = {
    ParticipantLabel,
    ParticipantNetworkQualityIndicator,
    ParticipantReaction,
    ParticipantVideoFallback,
    VideoRenderer,
  };

  const renderItem = useCallback<NonNullable<FlatListProps['renderItem']>>(
    ({ item: participant }) => {
      const isVisible = viewableParticipantSessionIds.current.has(
        participant.sessionId,
      );
      return (
        <>
          {ParticipantView && (
            <ParticipantView
              participant={participant}
              style={itemContainerStyle}
              videoMode="video"
              isVisible={isVisible}
              {...participantProps}
            />
          )}
        </>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itemContainerStyle],
  );

  // in vertical mode, only when there are more than 2 participants in a call, the participants should be displayed in a grid
  // else we display them both in a stretched row on the screen
  const shouldWrapByColumns = !!horizontal || participants.length > 2;

  if (!shouldWrapByColumns) {
    return (
      <>
        {participants.map((participant, index) => {
          return (
            ParticipantView && (
              <ParticipantView
                participant={participant}
                style={styles.flexed}
                videoMode="video"
                key={keyExtractor(participant, index)}
                {...participantProps}
              />
            )
          );
        })}
      </>
    );
  }

  return (
    <FlatList
      onLayout={onLayout}
      key={!horizontal ? numberOfColumns : undefined} // setting numColumns as key is a strict requirement of react-native to support changing numColumns on the fly
      data={participants}
      keyExtractor={keyExtractor}
      viewabilityConfig={VIEWABILITY_CONFIG}
      onViewableItemsChanged={onViewableItemsChanged}
      renderItem={renderItem}
      numColumns={!horizontal ? numberOfColumns : undefined}
      horizontal={horizontal}
      showsHorizontalScrollIndicator={false}
      extraData={`${forceUpdateValue}`} // this is important to force re-render when visibility changes
      testID={ComponentTestIds.CALL_PARTICIPANTS_LIST}
    />
  );
};

const styles = StyleSheet.create({
  flexed: {
    flex: 1,
  },
  participantWrapperHorizontal: {
    // note: if marginHorizontal is changed, be sure to change the width calculation in calculateParticipantViewSize function
    marginHorizontal: 8,
    borderRadius: 10,
  },
});

/**
 * This function calculates the size of the participant view based on the size of the container (the phone's screen size) and the number of participants.
 * @param {number} containerHeight - height of the container (the phone's screen height) in pixels
 * @param {number} containerWidth - width of the container (the phone's screen width) in pixels
 * @param {number} participantsLength - number of participants
 * @param {number} numColumns - number of columns
 * @param {boolean} horizontal - whether the participant view is in horizontal mode
 * @returns {object} - an object containing the height and width of the participant view
 */
function calculateParticipantViewSize({
  containerHeight,
  containerWidth,
  participantsLength,
  numberOfColumns,
  horizontal,
}: {
  containerHeight: number;
  containerWidth: number;
  participantsLength: number;
  numberOfColumns: number;
  horizontal: boolean | undefined;
}) {
  let itemHeight = containerHeight;
  // in vertical mode, we calculate the height of the participant view based on the containerHeight (aka the phone's screen height)
  if (!horizontal) {
    if (participantsLength <= 4) {
      // special case: if there are 4 or less participants, we display them in 2 rows
      itemHeight = containerHeight / 2;
    } else {
      // generally, we display the participants in 3 rows
      itemHeight = containerHeight / 3;
    }
  }

  let itemWidth = containerWidth / numberOfColumns;
  if (horizontal) {
    // in horizontal mode we apply margin of 8 to the participant view and that should be subtracted from the width
    itemWidth = itemWidth - 8 * 2;
  }

  return { itemHeight, itemWidth };
}
