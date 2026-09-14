import { useI18n } from '../../../i18n';
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
      text={t('ringingCall.preparing.title', 'Preparing call')}
      onBackPress={props.onBackPress}
    />
  );
};
