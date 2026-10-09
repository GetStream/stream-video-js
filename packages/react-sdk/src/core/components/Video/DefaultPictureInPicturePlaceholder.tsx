import { forwardRef } from 'react';
import { useI18n } from '../../../i18n';
import {
  BaseVideoPlaceholder,
  type BaseVideoPlaceholderProps,
} from './BaseVideoPlaceholder';

export type PictureInPicturePlaceholderProps = BaseVideoPlaceholderProps;

export const DefaultPictureInPicturePlaceholder = forwardRef<
  HTMLDivElement,
  PictureInPicturePlaceholderProps
>(function DefaultPictureInPicturePlaceholderRender(props, ref) {
  const { t } = useI18n();
  return (
    <BaseVideoPlaceholder ref={ref} {...props}>
      {t(
        'videoPlaceholder.videoPlayingInPopup.text',
        'Video is playing in a popup',
      )}
    </BaseVideoPlaceholder>
  );
});
