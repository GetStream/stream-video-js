import { forwardRef } from 'react';
import { useI18n } from '../../../i18n';
import {
  BaseVideoPlaceholder,
  type BaseVideoPlaceholderProps,
} from './BaseVideoPlaceholder';

export type VideoPlaceholderProps = BaseVideoPlaceholderProps;

export const DefaultVideoPlaceholder = forwardRef<
  HTMLDivElement,
  VideoPlaceholderProps
>(function DefaultVideoPlaceholderRender(props, ref) {
  const { t } = useI18n();
  return (
    <BaseVideoPlaceholder ref={ref} {...props}>
      {t('common.videoDisabled.text', 'Video is disabled')}
    </BaseVideoPlaceholder>
  );
});
