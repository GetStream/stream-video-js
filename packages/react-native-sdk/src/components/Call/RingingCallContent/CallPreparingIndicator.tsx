import React from 'react';
import { useI18n } from '../../../i18n';
import {
  TextBasedIndicator,
  type TextBasedIndicatorProps,
} from './TextBasedIndicator';

export type CallPreparingIndicatorProps = Pick<
  TextBasedIndicatorProps,
  'onBackPress'
>;

/**
 * Shown while the call is still being created, before it is known whether the
 * call is incoming or outgoing. Rendering a ringing screen here would have to
 * guess that direction, and the guess shows the *caller* an Accept/Decline UI.
 */
export const CallPreparingIndicator = (props: CallPreparingIndicatorProps) => {
  const { t } = useI18n();

  return (
    <TextBasedIndicator
      text={t('ringingCall.preparing.title', 'Preparing call')}
      onBackPress={props.onBackPress}
    />
  );
};
