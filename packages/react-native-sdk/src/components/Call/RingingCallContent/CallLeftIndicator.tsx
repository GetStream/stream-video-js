import { useI18n } from '@stream-io/video-react-bindings';
import React from 'react';
import {
  TextBasedIndicator,
  type TextBasedIndicatorProps,
} from './TextBasedIndicator';

export type CallLeftIndicatorProps = Pick<
  TextBasedIndicatorProps,
  'onBackPress'
>;

export const CallLeftIndicator = (props: CallLeftIndicatorProps) => {
  const { t } = useI18n();
  return (
    <TextBasedIndicator
      text={t('You have left the call')}
      onBackPress={props.onBackPress}
    />
  );
};
