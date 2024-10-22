import { forwardRef } from 'react';
import { useI18n } from '@stream-io/video-react-bindings';
import {
  BaseVideoPlaceholder,
  type BaseVideoPlaceholderProps,
} from './BaseVideoPlaceholder';

export type PictureInPicturePlaceholderProps = BaseVideoPlaceholderProps;

export const DefaultPictureInPicturePlaceholder = forwardRef<
  HTMLDivElement,
  PictureInPicturePlaceholderProps
>(function DefaultPictureInPicturePlaceholder(props, ref) {
  const { t } = useI18n();
  return (
    <BaseVideoPlaceholder ref={ref} {...props}>
      {t('Video is playing in a popup')}
    </BaseVideoPlaceholder>
  );
});
