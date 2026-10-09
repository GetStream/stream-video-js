import React from 'react';
import { useI18n } from '../../../i18n';
import {
  TextBasedIndicator,
  type TextBasedIndicatorProps,
} from './TextBasedIndicator';

export type CallLeftIndicatorProps = Pick<
  TextBasedIndicatorProps,
  'onBackPress' | 'style'
>;

export const CallLeftIndicator = (props: CallLeftIndicatorProps) => {
  const { t } = useI18n();

  return (
    <TextBasedIndicator
      text={t('ringingCall.leftCall.title', 'You have left the call')}
      onBackPress={props.onBackPress}
      style={props.style}
    />
  );
};
