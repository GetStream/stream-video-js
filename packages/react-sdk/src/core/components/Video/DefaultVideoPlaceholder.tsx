import { forwardRef } from 'react';
import { useI18n } from '@stream-io/video-react-bindings';
import {
  BaseVideoPlaceholder,
  type BaseVideoPlaceholderProps,
} from './BaseVideoPlaceholder';

export type VideoPlaceholderProps = BaseVideoPlaceholderProps;

export const DefaultVideoPlaceholder = forwardRef<
  HTMLDivElement,
  VideoPlaceholderProps
>(function DefaultVideoPlaceholder(props, ref) {
  const { t } = useI18n();
  return (
    <BaseVideoPlaceholder ref={ref} {...props}>
      {t('Video is disabled')}
    </BaseVideoPlaceholder>
  );
});
