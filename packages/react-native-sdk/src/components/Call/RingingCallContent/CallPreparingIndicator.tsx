import { useI18n } from '@stream-io/video-react-bindings';
import React from 'react';
import {
  TextBasedIndicator,
  type TextBasedIndicatorProps,
} from './TextBasedIndicator';

export type CallPreparingIndicatorProps = Pick<
  TextBasedIndicatorProps,
  'onBackPress'
>;

export const CallPreparingIndicator = (props: CallPreparingIndicatorProps) => {
  const { t } = useI18n();
  return (
    <TextBasedIndicator
      text={t('Preparing call')}
      onBackPress={props.onBackPress}
    />
  );
};
