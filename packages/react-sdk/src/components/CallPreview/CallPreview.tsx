import clsx from 'clsx';
import { CSSProperties, useEffect, useState } from 'react';
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

export type CallPreviewProps = {
  /**
   * Additional CSS class name to apply to the CallPreview element.
   */
  className?: string;

  /**
   * Additional CSS properties to apply to the CallPreview element.
   */
  style?: CSSProperties;
};

export const CallPreview = (props: CallPreviewProps) => {
  const { className, style } = props;
  const call = useCall();
  const { useCallThumbnail } = useCallStateHooks();
  const thumbnail = useCallThumbnail();

  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!imageRef || !call) return;
    const cleanup = call.bindCallThumbnailElement(imageRef);
    return () => cleanup();
  }, [imageRef, call]);

  if (!thumbnail) return null;

  return (
    <img
      className={clsx('str-video__call-preview', className)}
      style={style}
      alt="Call Preview Thumbnail"
      ref={setImageRef}
    />
  );
};
