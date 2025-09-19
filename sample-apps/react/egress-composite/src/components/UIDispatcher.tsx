import { isPinned, useCallStateHooks } from '@stream-io/video-react-sdk';

import {
  ConditionValues,
  ProcessedCustomActions,
  useConfigurationContext,
} from '../ConfigurationContext';
import {
  DEFAULT_LAYOUT,
  DEFAULT_SCREENSHARE_LAYOUT,
  Layout,
  layoutMap,
} from './layouts';
import { Spotlight } from './layouts/Spotlight';
import { applyFilter } from '@stream-io/video-react-sdk';
import { useMemo } from 'react';

const useProcessCustomActions = () => {
  const { options } = useConfigurationContext();
  const { useParticipantCount, useParticipants } = useCallStateHooks();
  const participantCount = useParticipantCount();
  const participants = useParticipants();
  const pinnedParticipantCount = participants.reduce((count, participant) => {
    return isPinned(participant) ? count + 1 : count;
  }, 0);

  return useMemo(() => {
    if (!options?.custom_actions) {
      return;
    }

    const processed: ProcessedCustomActions = options.custom_actions.map(
      (behavior) => {
        const conditionMet = applyFilter<ConditionValues>(
          { participantCount, pinnedParticipantCount },
          behavior.condition,
        );

        return {
          ...behavior,
          conditionMet,
        };
      },
    );

    return processed;
  }, [options, participantCount, pinnedParticipantCount]);
};

export const UIDispatcher = () => {
  const { layout, screenshare_layout } = useConfigurationContext();
  const { useHasOngoingScreenShare } = useCallStateHooks();
  const hasScreenShare = useHasOngoingScreenShare();

  const processedActions = useProcessCustomActions();

  const layoutOverride = useMemo<(typeof layoutMap)[Layout] | undefined>(() => {
    if (!processedActions) {
      return;
    }

    // pick first matching layout override action
    const switchLayoutBehavior = processedActions.find(
      (behavior) =>
        behavior.action === 'layout_override' && behavior.conditionMet === true,
    ) as
      | Extract<ProcessedCustomActions[number], { action: 'layout_override' }>
      | undefined;

    return switchLayoutBehavior?.layout
      ? layoutMap[switchLayoutBehavior.layout]
      : undefined;
  }, [processedActions]);

  const DefaultView =
    layoutOverride?.[0] ??
    layoutMap[layout ?? DEFAULT_LAYOUT]?.[0] ??
    Spotlight;
  const ScreenShareView =
    layoutOverride?.[1] ??
    layoutMap[
      screenshare_layout ?? layout ?? DEFAULT_SCREENSHARE_LAYOUT
    ]?.[1] ??
    Spotlight;

  return hasScreenShare ? <ScreenShareView /> : <DefaultView />;
};
