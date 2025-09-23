import {
  createContext,
  PropsWithChildren,
  useContext,
  useLayoutEffect,
  useMemo,
} from 'react';
import {
  applyFilter,
  isPinned,
  useCallStateHooks,
  type Filter,
} from '@stream-io/video-react-sdk';
import { layoutMap, type Layout } from './layouts';
import {
  type ConfigurationValue,
  useConfigurationContext,
} from '../ConfigurationContext';

export type ConditionValues = {
  participant_count: number;
  pinned_participant_count: number;
};

export type CustomActions = ({
  condition: Filter<ConditionValues>;
} & (
  | {
      action_type: 'layout_override';
      layout: Layout;
      // keep the override when screen sharing is active
      // otherwise use the screenshare layout from configuration
      ignore_screenshare?: boolean; // default: false
    }
  | {
      action_type: 'options_override';
      options: Partial<Omit<ConfigurationValue['options'], 'custom_actions'>>;
    }
))[];

export type ProcessedCustomActions = Array<
  CustomActions[number] & { conditionMet: boolean }
>;

export const CustomActionsContext = createContext<ProcessedCustomActions>([]);

const EMPTY: ProcessedCustomActions = [];

const useProcessCustomActions = () => {
  const { options } = useConfigurationContext();
  const { useParticipantCount, useParticipants } = useCallStateHooks();
  const participantCount = useParticipantCount();
  const participants = useParticipants();
  const pinnedParticipantCount = participants.reduce((count, participant) => {
    return isPinned(participant) ? count + 1 : count;
  }, 0);

  return useMemo(() => {
    if (!options.custom_actions) {
      return EMPTY;
    }

    const processed: ProcessedCustomActions = options.custom_actions.map(
      (behavior) => {
        const conditionMet = applyFilter<ConditionValues>(
          {
            participant_count: participantCount,
            pinned_participant_count: pinnedParticipantCount,
          },
          behavior.condition,
        );

        return {
          ...behavior,
          conditionMet,
        };
      },
    );

    return processed;
  }, [options.custom_actions, participantCount, pinnedParticipantCount]);
};

export const CustomActionsContextProvider = ({
  children,
}: PropsWithChildren) => {
  const processedActions = useProcessCustomActions();

  useOptionsOverride(processedActions);

  return (
    <CustomActionsContext.Provider value={processedActions}>
      {children}
    </CustomActionsContext.Provider>
  );
};

export const useCustomActionsContext = () => {
  return useContext(CustomActionsContext);
};

export const useFirstMatchingLayoutOverride = () => {
  const processedCustomActions = useCustomActionsContext();

  const layoutOverrideCustomAction = useMemo(() => {
    // pick first matching layout override action
    return processedCustomActions.find(
      (ca) => ca.action_type === 'layout_override' && ca.conditionMet === true,
    ) as
      | Extract<
          ProcessedCustomActions[number],
          { action_type: 'layout_override' }
        >
      | undefined;
  }, [processedCustomActions]);

  const layoutOverride = layoutOverrideCustomAction?.layout
    ? layoutMap[layoutOverrideCustomAction.layout]
    : undefined;

  return { layoutOverride, layoutOverrideCustomAction };
};

export const useOptionsOverride = (
  processedCustomActions: ProcessedCustomActions,
) => {
  const { setOptionsOverride } = useConfigurationContext();

  const data = useMemo(() => {
    const optionsToCombine = processedCustomActions.reduce<
      Partial<ConfigurationValue['options']>[]
    >((options, ca) => {
      if (ca.action_type === 'options_override' && ca.conditionMet) {
        options.push(ca.options);
      }
      return options;
    }, []);

    const optionsOverride = Object.assign({}, ...optionsToCombine) as Partial<
      ConfigurationValue['options']
    >;

    // we don't want to have custom_actions in the override
    delete optionsOverride.custom_actions;

    return {
      optionsOverride,
      hasOptionsOverride: optionsToCombine.length > 0,
    };
  }, [processedCustomActions]);

  useLayoutEffect(() => {
    if (data.hasOptionsOverride) {
      setOptionsOverride(data.optionsOverride);
    } else {
      setOptionsOverride(undefined);
    }
  }, [setOptionsOverride, data]);
};
